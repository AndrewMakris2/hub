// Ported from FantasyFootballTool's server/src/services/yahooClient.ts.
// Stays server-side entirely because Yahoo's OAuth2 token exchange requires
// a confidential client secret, which can never live in browser code.
const { getYahooTokens, setYahooTokens } = require("./yahooTokens");

const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const FANTASY_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

function buildAuthorizeUrl(state, redirectUri) {
  const params = new URLSearchParams({
    client_id: requireEnv("YAHOO_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    // Yahoo's app dashboard no longer has a "Fantasy Sports" permission
    // checkbox — read access has to be requested explicitly here instead.
    scope: "fspt-r",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function requestToken(body) {
  const clientId = requireEnv("YAHOO_CLIENT_ID");
  const clientSecret = requireEnv("YAHOO_CLIENT_SECRET");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo token request failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt: Date.now() + json.expires_in * 1000 };
}

async function exchangeCodeForTokens(code, redirectUri) {
  const tokens = await requestToken(new URLSearchParams({ grant_type: "authorization_code", redirect_uri: redirectUri, code }));
  await setYahooTokens(tokens);
  return tokens;
}

async function refreshTokens(refreshToken) {
  const tokens = await requestToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
  await setYahooTokens(tokens);
  return tokens;
}

async function getValidAccessToken() {
  const tokens = await getYahooTokens();
  if (!tokens) return null;
  const expiringSoon = tokens.expiresAt - Date.now() < 60000;
  if (!expiringSoon) return tokens.accessToken;
  const refreshed = await refreshTokens(tokens.refreshToken);
  return refreshed.accessToken;
}

async function isYahooConnected() {
  return (await getYahooTokens()) !== null;
}

async function yahooGet(pathname) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("Yahoo is not connected");
  const res = await fetch(`${FANTASY_BASE}${pathname}?format=json`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Yahoo's JSON responses nest arrays as objects keyed by index with a
// trailing "count" field. This helper pulls the actual items out.
function extractItems(collection) {
  const items = [];
  for (const key of Object.keys(collection)) {
    if (key === "count") continue;
    items.push(collection[key]);
  }
  return items;
}

function parseTeamRoster(teamWrapper) {
  const roster = [];
  if (!teamWrapper || !teamWrapper.team[1] || !teamWrapper.team[1].roster) return roster;

  const rosterPlayers = extractItems(teamWrapper.team[1].roster[0].players);
  for (const playerWrapper of rosterPlayers) {
    const playerMeta = playerWrapper.player[0];
    const name = (playerMeta.find((e) => e && e.name) || {}).name;
    const position = (playerMeta.find((e) => e && e.display_position) || {}).display_position;
    const team = (playerMeta.find((e) => e && e.editorial_team_abbr) || {}).editorial_team_abbr;
    const playerKey = (playerMeta.find((e) => e && e.player_key) || {}).player_key;
    const injuryStatus = (playerMeta.find((e) => e && e.status) || {}).status || null;
    roster.push({
      playerId: playerKey || (name && name.full) || "unknown",
      name: (name && name.full) || "Unknown Player",
      position: position || "UNK",
      team: team || null,
      injuryStatus,
    });
  }
  return roster;
}

async function getLeaguesForCurrentUser() {
  const data = await yahooGet("/users;use_login=1/games;game_keys=nfl/leagues");
  const users = extractItems(data.fantasy_content.users);
  const leagues = [];
  for (const user of users) {
    const games = extractItems(user.user[1].games);
    for (const game of games) {
      const gameLeagues = extractItems(game.game[1].leagues);
      for (const leagueWrapper of gameLeagues) {
        const league = leagueWrapper.league[0];
        leagues.push({ league_key: league.league_key, league_id: league.league_id, name: league.name, season: league.season });
      }
    }
  }
  return leagues;
}

async function getLeagueDetail(leagueKey) {
  const data = await yahooGet(`/league/${leagueKey};out=settings,standings/teams;out=roster`);
  const leagueNode = data.fantasy_content.league;
  const leagueMeta = leagueNode[0];

  const standingsTeamsRaw = extractItems(leagueNode[1].standings[0].teams);
  const standings = standingsTeamsRaw.map((teamWrapper) => {
    const teamArr = teamWrapper.team;
    const teamMeta = extractItems(teamArr[0]);
    const teamStandings = (teamArr[1] && teamArr[1].team_standings) || {};
    const nameEntry = teamArr[0].find((e) => e && e.name);
    return {
      teamId: String((teamMeta.find((e) => e && e.team_id) || {}).team_id || ""),
      teamName: (nameEntry && nameEntry.name) || "Unknown Team",
      record: {
        wins: Number((teamStandings.outcome_totals && teamStandings.outcome_totals.wins) || 0),
        losses: Number((teamStandings.outcome_totals && teamStandings.outcome_totals.losses) || 0),
        ties: Number((teamStandings.outcome_totals && teamStandings.outcome_totals.ties) || 0),
      },
      pointsFor: Number(teamStandings.points_for || 0),
      pointsAgainst: Number(teamStandings.points_against || 0),
      rank: Number(teamStandings.rank || 0),
    };
  });

  // Yahoo doesn't cleanly tell us "my team" from this endpoint without the
  // logged-in user's GUID; find it via is_owned_by_current_login flag instead.
  const myTeamWrapper = standingsTeamsRaw.find((teamWrapper) => {
    const teamMeta = teamWrapper.team[0];
    return teamMeta.some((e) => e && (e.is_owned_by_current_login === 1 || e.is_owned_by_current_login === "1"));
  });

  const myTeamMeta = myTeamWrapper ? myTeamWrapper.team[0] : [];
  const myTeamName = (myTeamMeta.find((e) => e && e.name) || {}).name || "My Team";
  const myTeamId = String((myTeamMeta.find((e) => e && e.team_id) || {}).team_id || "");
  const myStanding = standings.find((s) => s.teamId === myTeamId);

  const roster = parseTeamRoster(myTeamWrapper);

  const teams = standingsTeamsRaw.map((teamWrapper) => {
    const teamMeta = teamWrapper.team[0];
    return {
      teamId: String((teamMeta.find((e) => e && e.team_id) || {}).team_id || ""),
      teamName: (teamMeta.find((e) => e && e.name) || {}).name || "Unknown Team",
      roster: parseTeamRoster(teamWrapper),
    };
  });

  // Best-effort: scoring_type/num_teams are top-level fields on Yahoo's base
  // league resource. Roster position counts and playoff team count, and
  // current-week matchup, follow the same deeply-nested pattern but aren't
  // verified against a live league yet, so they're left empty/null rather
  // than risk a wrong parse.
  const settings = {
    scoringType: typeof leagueMeta.scoring_type === "string" ? leagueMeta.scoring_type : "unknown",
    rosterPositions: [],
    playoffTeams: null,
    totalRosters: Number(leagueMeta.num_teams || teams.length),
  };

  return {
    platform: "yahoo",
    leagueId: leagueKey,
    name: leagueMeta.name,
    season: String(leagueMeta.season),
    myTeam: { teamId: myTeamId, teamName: myTeamName, record: (myStanding && myStanding.record) || { wins: 0, losses: 0, ties: 0 }, roster },
    teams,
    standings,
    currentMatchup: null,
    settings,
  };
}

// Yahoo's transactions/draftresults resources use the same deeply-nested
// shape as everything else here, but without a live league to verify the
// exact structure against, an honest "not available yet" beats a wrong parse.
async function getLeagueTransactions() {
  return [];
}
async function getLeagueDraft() {
  return { status: "not_started", numTeams: 0, rounds: 0, picks: [] };
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  isYahooConnected,
  getLeaguesForCurrentUser,
  getLeagueDetail,
  getLeagueTransactions,
  getLeagueDraft,
};
