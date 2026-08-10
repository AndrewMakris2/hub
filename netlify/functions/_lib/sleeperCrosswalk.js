// Ported from FantasyFootballTool's server/src/services/sleeperClient.ts
// (getPlayersMap/getSleeperCrosswalk only — everything else in that file
// is CORS-open and fetched directly from the browser instead, see the
// Fantasy tab's client-side data layer). This half stays server-side only
// because player-stats.js needs it to resolve nflverse's GSIS IDs to
// Sleeper player IDs, and there's no reason to ship the ~14MB player
// directory to the browser twice just to compute a lookup table.
const { getStore } = require("@netlify/blobs");

const BASE_URL = "https://api.sleeper.app/v1";
const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF"]);
const PLAYERS_CACHE_KEY = "players-v2";
const PLAYERS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// nflverse uses "LA" for the Rams, Sleeper uses "LAR" — normalize before
// using a team code as part of a cross-source lookup key.
const TEAM_ABBR_ALIASES = { LA: "LAR" };
function normalizeTeamAbbr(team) {
  return TEAM_ABBR_ALIASES[team] || team;
}

async function getPlayersMap() {
  const store = getStore("sleeper-cache");
  const cached = await store.getWithMetadata(PLAYERS_CACHE_KEY, { type: "json" });
  const fetchedAt = cached && cached.metadata.fetchedAt;
  if (cached && fetchedAt && Date.now() - fetchedAt < PLAYERS_CACHE_MAX_AGE_MS) {
    return cached.data;
  }
  const res = await fetch(`${BASE_URL}/players/nfl`);
  if (!res.ok) throw new Error(`Sleeper API error ${res.status} for /players/nfl`);
  const players = await res.json();
  await store.setJSON(PLAYERS_CACHE_KEY, players, { metadata: { fetchedAt: Date.now() } });
  return players;
}

// Sleeper's own gsis_id field only covers a fraction of current players, so
// statsClient falls back through espn_id, then name+team, then unique
// name-only matching.
async function getSleeperCrosswalk() {
  const playersMap = await getPlayersMap();
  const byGsisId = {};
  const byEspnId = {};
  const byNameTeam = {};
  const byNameOnly = {};

  for (const [playerId, meta] of Object.entries(playersMap)) {
    if (meta.gsis_id) byGsisId[meta.gsis_id] = playerId;
    if (meta.espn_id) byEspnId[String(meta.espn_id)] = playerId;

    const name = meta.full_name || `${meta.first_name || ""} ${meta.last_name || ""}`.trim();
    if (!name) continue;
    const nameKey = name.toLowerCase();

    if (meta.team) byNameTeam[`${nameKey}|${normalizeTeamAbbr(meta.team)}`] = playerId;
    if (meta.position && FANTASY_POSITIONS.has(meta.position)) {
      (byNameOnly[nameKey] = byNameOnly[nameKey] || []).push(playerId);
    }
  }

  return { byGsisId, byEspnId, byNameTeam, byNameOnly };
}

module.exports = { getPlayersMap, getSleeperCrosswalk, normalizeTeamAbbr };
