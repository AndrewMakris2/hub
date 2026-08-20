
const { useState, useEffect, useMemo, useRef, useContext, createContext } = React;

/* ----------------------------------------------------------------------
   THEMES
   Each theme defines every color token the UI needs. Components never
   hardcode colors — they read from the active theme object.
---------------------------------------------------------------------- */

const THEMES = {
  minimal: {
    name: "Minimal",
    pageBg: "#fafaf8",
    pageBgGradient: "none",
    text: "#1a1a1a",
    textMuted: "#71716f",
    textFaint: "#757572",
    cardBg: "#ffffff",
    cardBorder: "#e8e8e4",
    cardShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cardRadius: "14px",
    sectionLabelColor: "#70706c",
    accent: "#1a1a1a",
    accentText: "#ffffff",
    accentOn: "#1a1a1a",
    accentSoft: "#f0f0ec",
    divider: "#eeeeea",
    inputBg: "#ffffff",
    inputBorder: "#dcdcd6",
    inputText: "#1a1a1a",
    danger: "#c0392b",
    dangerSoft: "#fbeceb",
    chip: "#f2f2ee",
    chipText: "#5a5a56",
    themeBarBg: "rgba(255,255,255,0.7)",
    themeBarBorder: "#e8e8e4",
    positive: "#2f6b3f",
    progressTrack: "#eeeeea",
    progressFill: "#1a1a1a",
    headerWeight: 700,
    cardStyle: "flat",
  },
  navyGold: {
    name: "Navy & Gold",
    pageBg: "#0b1f3a",
    pageBgGradient: "linear-gradient(160deg, #0b1f3a 0%, #142c52 45%, #0b1f3a 100%)",
    text: "#f4ecd8",
    textMuted: "#b9c2d6",
    textFaint: "#7f8bab",
    cardBg: "linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    cardBorder: "rgba(212,175,55,0.28)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.35)",
    cardRadius: "16px",
    sectionLabelColor: "#d4af37",
    accent: "#d4af37",
    accentText: "#0b1f3a",
    accentOn: "#d4af37",
    accentSoft: "rgba(212,175,55,0.14)",
    divider: "rgba(212,175,55,0.18)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(212,175,55,0.3)",
    inputText: "#f4ecd8",
    danger: "#e07a6f",
    dangerSoft: "rgba(224,122,111,0.14)",
    chip: "rgba(212,175,55,0.12)",
    chipText: "#e8d9a8",
    themeBarBg: "rgba(11,31,58,0.85)",
    themeBarBorder: "rgba(212,175,55,0.25)",
    positive: "#8fd19e",
    progressTrack: "rgba(255,255,255,0.08)",
    progressFill: "linear-gradient(90deg, #d4af37, #f4d47c)",
    headerWeight: 600,
    cardStyle: "gradient",
  },
  darkModern: {
    name: "Dark Modern",
    pageBg: "#0f1419",
    pageBgGradient: "none",
    text: "#e6edf3",
    textMuted: "#8b98a5",
    textFaint: "#7a848e",
    cardBg: "#161b22",
    cardBorder: "#242c36",
    cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
    cardRadius: "12px",
    sectionLabelColor: "#5b9cf6",
    accent: "#4d9bff",
    accentText: "#0a0e13",
    accentOn: "#4d9bff",
    accentSoft: "rgba(77,155,255,0.12)",
    divider: "#1f252d",
    inputBg: "#0d1117",
    inputBorder: "#2a3441",
    inputText: "#e6edf3",
    danger: "#f27272",
    dangerSoft: "rgba(242,114,114,0.12)",
    chip: "#1c2330",
    chipText: "#a9c2e0",
    themeBarBg: "rgba(15,20,25,0.85)",
    themeBarBorder: "#242c36",
    positive: "#4dd68c",
    progressTrack: "#1f252d",
    progressFill: "#4d9bff",
    headerWeight: 600,
    cardStyle: "flat",
  },
  glass: {
    name: "Glassmorphic",
    pageBg: "#6052bb",
    pageBgGradient: "linear-gradient(135deg, #694bc7 0%, #9c4465 50%, #7d5a36 100%)",
    text: "#ffffff",
    textMuted: "#ffffff",
    textFaint: "#ffffff",
    cardBg: "rgba(255,255,255,0.14)",
    cardBorder: "rgba(255,255,255,0.35)",
    cardShadow: "0 8px 32px rgba(31,38,135,0.25)",
    cardRadius: "20px",
    sectionLabelColor: "rgba(255,255,255,0.85)",
    accent: "#ffffff",
    accentText: "#5a3fc0",
    accentOn: "#ffffff",
    accentSoft: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.25)",
    inputBg: "rgba(255,255,255,0.16)",
    inputBorder: "rgba(255,255,255,0.4)",
    inputText: "#ffffff",
    danger: "#ffb4b4",
    dangerSoft: "rgba(255,120,120,0.18)",
    chip: "rgba(255,255,255,0.2)",
    chipText: "#ffffff",
    themeBarBg: "rgba(255,255,255,0.14)",
    themeBarBorder: "rgba(255,255,255,0.35)",
    positive: "#c8ffd4",
    progressTrack: "rgba(255,255,255,0.2)",
    progressFill: "linear-gradient(90deg, #ffffff, #ffe9c7)",
    headerWeight: 600,
    cardStyle: "glass",
    blur: true,
  },
  auroraGlass: {
    name: "Aurora Glass",
    pageBg: "#eceef4",
    pageBgGradient:
      "radial-gradient(38% 30% at 15% 8%, rgba(255,93,122,0.16) 0%, transparent 60%), radial-gradient(42% 34% at 88% 6%, rgba(108,107,255,0.16) 0%, transparent 60%), radial-gradient(40% 30% at 50% 100%, rgba(34,176,136,0.13) 0%, transparent 60%), linear-gradient(180deg, #eceef4 0%, #eceef4 100%)",
    text: "#14131f",
    textMuted: "#5b5a6e",
    textFaint: "#8a89a0",
    cardBg: "rgba(255,255,255,0.62)",
    cardBorder: "rgba(255,255,255,0.9)",
    cardShadow: "0 14px 34px rgba(30,30,60,0.10)",
    cardRadius: "22px",
    sectionLabelColor: "#5b5a6e",
    accent: "#6c6bff",
    accentText: "#ffffff",
    accentSoft: "rgba(108,107,255,0.14)",
    divider: "rgba(20,19,31,0.08)",
    inputBg: "rgba(255,255,255,0.7)",
    inputBorder: "rgba(20,19,31,0.14)",
    inputText: "#14131f",
    danger: "#ff5d7a",
    dangerSoft: "rgba(255,93,122,0.14)",
    chip: "rgba(255,255,255,0.55)",
    chipText: "#5b5a6e",
    themeBarBg: "rgba(255,255,255,0.7)",
    themeBarBorder: "rgba(255,255,255,0.9)",
    positive: "#22b088",
    progressTrack: "rgba(20,19,31,0.08)",
    progressFill: "linear-gradient(90deg, #22b088, #7be0c2)",
    headerWeight: 700,
    cardStyle: "glass",
    blur: true,
    categoryGlow: true,
    railGap: "14px",
    railRadius: "22px",
    railShadow: "0 12px 30px rgba(30,30,60,0.12)",
    fontDisplay: '"Bricolage Grotesque", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  sunset: {
    name: "Sunset",
    pageBg: "#fff8f0",
    pageBgGradient: "linear-gradient(160deg, #fff8f0 0%, #fdf0e2 100%)",
    text: "#3d2b1f",
    textMuted: "#866e5b",
    textFaint: "#867363",
    cardBg: "#ffffff",
    cardBorder: "#f0ddc8",
    cardShadow: "0 2px 10px rgba(196,120,60,0.08)",
    cardRadius: "16px",
    sectionLabelColor: "#b05b1e",
    accent: "#e2703a",
    accentText: "#000000",
    accentOn: "#aa542c",
    accentSoft: "#fdeee0",
    divider: "#f3e4d4",
    inputBg: "#fffaf5",
    inputBorder: "#ead9c4",
    inputText: "#3d2b1f",
    danger: "#c0392b",
    dangerSoft: "#fbeae7",
    chip: "#fdeee0",
    chipText: "#a0522d",
    themeBarBg: "rgba(255,248,240,0.85)",
    themeBarBorder: "#f0ddc8",
    positive: "#4a7c59",
    progressTrack: "#f3e4d4",
    progressFill: "linear-gradient(90deg, #e2703a, #f4a261)",
    headerWeight: 700,
    cardStyle: "flat",
  },
  forest: {
    name: "Forest",
    pageBg: "#f4f7f2",
    pageBgGradient: "none",
    text: "#263826",
    textMuted: "#627662",
    textFaint: "#6a7b6a",
    cardBg: "#ffffff",
    cardBorder: "#dfe8dc",
    cardShadow: "0 1px 4px rgba(38,56,38,0.07)",
    cardRadius: "14px",
    sectionLabelColor: "#517a4b",
    accent: "#4a7c47",
    accentText: "#ffffff",
    accentOn: "#467643",
    accentSoft: "#e8f0e5",
    divider: "#e4ece0",
    inputBg: "#ffffff",
    inputBorder: "#d3e0cf",
    inputText: "#263826",
    danger: "#b5473f",
    dangerSoft: "#f8e9e7",
    chip: "#e8f0e5",
    chipText: "#3f6b3c",
    themeBarBg: "rgba(244,247,242,0.85)",
    themeBarBorder: "#dfe8dc",
    positive: "#4a7c47",
    progressTrack: "#e4ece0",
    progressFill: "#4a7c47",
    headerWeight: 700,
    cardStyle: "flat",
  },
  cyberpunk: {
    name: "Cyberpunk",
    pageBg: "#08060f",
    pageBgGradient: "linear-gradient(160deg, #08060f 0%, #170a26 100%)",
    text: "#f2e9ff",
    textMuted: "#9b8bb4",
    textFaint: "#817694",
    cardBg: "#120b1e",
    cardBorder: "rgba(255,47,176,0.3)",
    cardShadow: "0 0 24px rgba(0,229,255,0.08)",
    cardRadius: "10px",
    sectionLabelColor: "#00e5ff",
    accent: "#ff2fb0",
    accentText: "#08060f",
    accentOn: "#ff2fb0",
    accentSoft: "rgba(255,47,176,0.12)",
    divider: "rgba(0,229,255,0.15)",
    inputBg: "rgba(255,255,255,0.04)",
    inputBorder: "rgba(0,229,255,0.3)",
    inputText: "#f2e9ff",
    danger: "#ff5470",
    dangerSoft: "rgba(255,84,112,0.15)",
    chip: "rgba(0,229,255,0.1)",
    chipText: "#7fe9ff",
    themeBarBg: "rgba(8,6,15,0.85)",
    themeBarBorder: "rgba(0,229,255,0.2)",
    positive: "#39ff8f",
    progressTrack: "rgba(255,255,255,0.08)",
    progressFill: "linear-gradient(90deg, #ff2fb0, #00e5ff)",
    headerWeight: 700,
    cardStyle: "flat",
  },
  pastel: {
    name: "Pastel Dream",
    pageBg: "#f6f3fb",
    pageBgGradient: "linear-gradient(135deg, #f6f3fb 0%, #fdf1f5 50%, #f0fbf6 100%)",
    text: "#4a4458",
    textMuted: "#756c85",
    textFaint: "#7a7388",
    cardBg: "#ffffff",
    cardBorder: "#ece5f5",
    cardShadow: "0 2px 10px rgba(147,112,219,0.08)",
    cardRadius: "18px",
    sectionLabelColor: "#786899",
    accent: "#b48ee0",
    accentText: "#000000",
    accentOn: "#785f95",
    accentSoft: "#f1e9fb",
    divider: "#efe8f8",
    inputBg: "#fdfcff",
    inputBorder: "#e4dbf2",
    inputText: "#4a4458",
    danger: "#e0819a",
    dangerSoft: "#fbe9ee",
    chip: "#f1e9fb",
    chipText: "#8867b3",
    themeBarBg: "rgba(246,243,251,0.85)",
    themeBarBorder: "#ece5f5",
    positive: "#7fc8a9",
    progressTrack: "#efe8f8",
    progressFill: "linear-gradient(90deg, #b48ee0, #f0a8c4)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  obsidian: {
    name: "Obsidian",
    pageBg: "#0a0a0a",
    pageBgGradient: "none",
    text: "#f5f5f5",
    textMuted: "#8a8a8a",
    textFaint: "#7f7f7f",
    cardBg: "#141414",
    cardBorder: "#262626",
    cardShadow: "0 1px 3px rgba(0,0,0,0.6)",
    cardRadius: "12px",
    sectionLabelColor: "#e5e5e5",
    accent: "#ffffff",
    accentText: "#0a0a0a",
    accentOn: "#ffffff",
    accentSoft: "rgba(255,255,255,0.08)",
    divider: "#232323",
    inputBg: "#0f0f0f",
    inputBorder: "#2c2c2c",
    inputText: "#f5f5f5",
    danger: "#ff5c5c",
    dangerSoft: "rgba(255,92,92,0.12)",
    chip: "#1e1e1e",
    chipText: "#cfcfcf",
    themeBarBg: "rgba(10,10,10,0.85)",
    themeBarBorder: "#262626",
    positive: "#6be08a",
    progressTrack: "#232323",
    progressFill: "#ffffff",
    headerWeight: 700,
    cardStyle: "flat",
  },
  crimsonNoir: {
    name: "Crimson Noir",
    pageBg: "#0d0707",
    pageBgGradient: "linear-gradient(160deg, #0d0707 0%, #1a0a0a 100%)",
    text: "#f2e6e6",
    textMuted: "#a68080",
    textFaint: "#8f7676",
    cardBg: "#170e0e",
    cardBorder: "rgba(178,34,52,0.3)",
    cardShadow: "0 4px 16px rgba(0,0,0,0.5)",
    cardRadius: "12px",
    sectionLabelColor: "#e5484d",
    accent: "#b3122a",
    accentText: "#ffffff",
    accentOn: "#ca596a",
    accentSoft: "rgba(179,18,42,0.15)",
    divider: "rgba(178,34,52,0.18)",
    inputBg: "#140b0b",
    inputBorder: "rgba(178,34,52,0.3)",
    inputText: "#f2e6e6",
    danger: "#ff6b6b",
    dangerSoft: "rgba(255,107,107,0.15)",
    chip: "rgba(179,18,42,0.14)",
    chipText: "#f0a8ae",
    themeBarBg: "rgba(13,7,7,0.85)",
    themeBarBorder: "rgba(178,34,52,0.25)",
    positive: "#7fd99a",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "linear-gradient(90deg, #b3122a, #e5484d)",
    headerWeight: 700,
    cardStyle: "flat",
  },
  emeraldMidnight: {
    name: "Emerald Midnight",
    pageBg: "#071410",
    pageBgGradient: "linear-gradient(160deg, #071410 0%, #0d211a 100%)",
    text: "#e3f5ec",
    textMuted: "#82a897",
    textFaint: "#6e887d",
    cardBg: "#0e1e18",
    cardBorder: "rgba(16,185,129,0.25)",
    cardShadow: "0 4px 18px rgba(0,0,0,0.4)",
    cardRadius: "14px",
    sectionLabelColor: "#34d399",
    accent: "#10b981",
    accentText: "#04140f",
    accentOn: "#10b981",
    accentSoft: "rgba(16,185,129,0.14)",
    divider: "rgba(16,185,129,0.15)",
    inputBg: "#0a1815",
    inputBorder: "rgba(16,185,129,0.28)",
    inputText: "#e3f5ec",
    danger: "#f2726e",
    dangerSoft: "rgba(242,114,110,0.14)",
    chip: "rgba(16,185,129,0.12)",
    chipText: "#86e6bb",
    themeBarBg: "rgba(7,20,16,0.85)",
    themeBarBorder: "rgba(16,185,129,0.2)",
    positive: "#34d399",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "linear-gradient(90deg, #10b981, #6ee7b7)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  amberTerminal: {
    name: "Amber Terminal",
    pageBg: "#0a0a08",
    pageBgGradient: "none",
    text: "#f5deb3",
    textMuted: "#9c8459",
    textFaint: "#8a7b5c",
    cardBg: "#121008",
    cardBorder: "rgba(255,176,0,0.25)",
    cardShadow: "0 0 20px rgba(255,176,0,0.05)",
    cardRadius: "8px",
    sectionLabelColor: "#ffb000",
    accent: "#ffb000",
    accentText: "#0a0a08",
    accentOn: "#ffb000",
    accentSoft: "rgba(255,176,0,0.14)",
    divider: "rgba(255,176,0,0.15)",
    inputBg: "#0d0b06",
    inputBorder: "rgba(255,176,0,0.3)",
    inputText: "#f5deb3",
    danger: "#ff6b4a",
    dangerSoft: "rgba(255,107,74,0.15)",
    chip: "rgba(255,176,0,0.12)",
    chipText: "#ffd27a",
    themeBarBg: "rgba(10,10,8,0.85)",
    themeBarBorder: "rgba(255,176,0,0.2)",
    positive: "#b5e550",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "#ffb000",
    headerWeight: 700,
    cardStyle: "flat",
  },
  amethyst: {
    name: "Amethyst",
    pageBg: "#120a1f",
    pageBgGradient: "linear-gradient(160deg, #120a1f 0%, #1d1030 100%)",
    text: "#ede7f6",
    textMuted: "#a696c2",
    textFaint: "#8679a1",
    cardBg: "#1a1030",
    cardBorder: "rgba(168,120,255,0.25)",
    cardShadow: "0 4px 18px rgba(0,0,0,0.45)",
    cardRadius: "14px",
    sectionLabelColor: "#b794f6",
    accent: "#9b5de5",
    accentText: "#000000",
    accentOn: "#a56de8",
    accentSoft: "rgba(155,93,229,0.16)",
    divider: "rgba(168,120,255,0.15)",
    inputBg: "#150c26",
    inputBorder: "rgba(168,120,255,0.3)",
    inputText: "#ede7f6",
    danger: "#f2726e",
    dangerSoft: "rgba(242,114,110,0.14)",
    chip: "rgba(155,93,229,0.14)",
    chipText: "#cbb2f2",
    themeBarBg: "rgba(18,10,31,0.85)",
    themeBarBorder: "rgba(168,120,255,0.2)",
    positive: "#7fd99a",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "linear-gradient(90deg, #9b5de5, #c77dff)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  oceanAbyss: {
    name: "Ocean Abyss",
    pageBg: "#061418",
    pageBgGradient: "linear-gradient(160deg, #061418 0%, #0a222a 100%)",
    text: "#dff3f5",
    textMuted: "#7ea3aa",
    textFaint: "#6e888d",
    cardBg: "#0c1f24",
    cardBorder: "rgba(45,180,200,0.25)",
    cardShadow: "0 4px 18px rgba(0,0,0,0.4)",
    cardRadius: "14px",
    sectionLabelColor: "#2dd4d9",
    accent: "#17a2b8",
    accentText: "#04141a",
    accentOn: "#17a2b8",
    accentSoft: "rgba(23,162,184,0.15)",
    divider: "rgba(45,180,200,0.15)",
    inputBg: "#081a1f",
    inputBorder: "rgba(45,180,200,0.3)",
    inputText: "#dff3f5",
    danger: "#f2827a",
    dangerSoft: "rgba(242,130,122,0.14)",
    chip: "rgba(23,162,184,0.14)",
    chipText: "#8fe0e6",
    themeBarBg: "rgba(6,20,24,0.85)",
    themeBarBorder: "rgba(45,180,200,0.2)",
    positive: "#5fd9a4",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "linear-gradient(90deg, #17a2b8, #5eead4)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  roseGold: {
    name: "Rose Gold",
    pageBg: "#1a0f14",
    pageBgGradient: "linear-gradient(160deg, #1a0f14 0%, #241319 100%)",
    text: "#f7e6ea",
    textMuted: "#b98d99",
    textFaint: "#977981",
    cardBg: "#241419",
    cardBorder: "rgba(232,180,184,0.25)",
    cardShadow: "0 4px 18px rgba(0,0,0,0.4)",
    cardRadius: "16px",
    sectionLabelColor: "#e8b4b8",
    accent: "#d88a93",
    accentText: "#1a0f14",
    accentOn: "#d88a93",
    accentSoft: "rgba(216,138,147,0.16)",
    divider: "rgba(232,180,184,0.15)",
    inputBg: "#1e1116",
    inputBorder: "rgba(232,180,184,0.3)",
    inputText: "#f7e6ea",
    danger: "#f2726e",
    dangerSoft: "rgba(242,114,110,0.14)",
    chip: "rgba(216,138,147,0.14)",
    chipText: "#f0c4c9",
    themeBarBg: "rgba(26,15,20,0.85)",
    themeBarBorder: "rgba(232,180,184,0.2)",
    positive: "#9fd9a8",
    progressTrack: "rgba(255,255,255,0.06)",
    progressFill: "linear-gradient(90deg, #d88a93, #f0c4a8)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  slateSteel: {
    name: "Slate Steel",
    pageBg: "#0f1215",
    pageBgGradient: "none",
    text: "#dde3e8",
    textMuted: "#838f99",
    textFaint: "#7c848b",
    cardBg: "#171b1f",
    cardBorder: "#2a323a",
    cardShadow: "0 1px 4px rgba(0,0,0,0.45)",
    cardRadius: "10px",
    sectionLabelColor: "#7c98b3",
    accent: "#5b7d9e",
    accentText: "#000000",
    accentOn: "#6e8ca9",
    accentSoft: "rgba(91,125,158,0.16)",
    divider: "#262c32",
    inputBg: "#121619",
    inputBorder: "#2e373f",
    inputText: "#dde3e8",
    danger: "#e0736c",
    dangerSoft: "rgba(224,115,108,0.14)",
    chip: "#1e252b",
    chipText: "#a9bccc",
    themeBarBg: "rgba(15,18,21,0.85)",
    themeBarBorder: "#2a323a",
    positive: "#6fbf8e",
    progressTrack: "#262c32",
    progressFill: "#5b7d9e",
    headerWeight: 700,
    cardStyle: "flat",
  },
  latte: {
    name: "Latte",
    pageBg: "#f4ede4",
    pageBgGradient: "linear-gradient(165deg, #f6f0e7 0%, #efe6d8 100%)",
    text: "#3a2f28",
    textMuted: "#77695d",
    textFaint: "#7f7166",
    cardBg: "#fffaf3",
    cardBorder: "#e6dccd",
    cardShadow: "0 1px 2px rgba(60,40,20,0.05)",
    cardRadius: "14px",
    sectionLabelColor: "#846544",
    accent: "#b5651d",
    accentText: "#000000",
    accentOn: "#945218",
    accentSoft: "rgba(181,101,29,0.12)",
    divider: "#ece3d6",
    inputBg: "#fffaf3",
    inputBorder: "#ddd0bd",
    inputText: "#3a2f28",
    danger: "#c0392b",
    dangerSoft: "#f7e8e5",
    chip: "#efe6d8",
    chipText: "#6b5b4d",
    themeBarBg: "rgba(255,250,243,0.7)",
    themeBarBorder: "#e6dccd",
    positive: "#5a7d3c",
    progressTrack: "#ece3d6",
    progressFill: "#b5651d",
    headerWeight: 700,
    cardStyle: "flat",
  },
  sky: {
    name: "Sky",
    pageBg: "#eef4fb",
    pageBgGradient: "linear-gradient(165deg, #eff5fc 0%, #e3edf8 100%)",
    text: "#17202a",
    textMuted: "#5d7185",
    textFaint: "#6a7887",
    cardBg: "#ffffff",
    cardBorder: "#dce6f0",
    cardShadow: "0 1px 2px rgba(20,40,70,0.05)",
    cardRadius: "14px",
    sectionLabelColor: "#496ea5",
    accent: "#2f6fed",
    accentText: "#ffffff",
    accentOn: "#2960cd",
    accentSoft: "rgba(47,111,237,0.1)",
    divider: "#e5edf5",
    inputBg: "#ffffff",
    inputBorder: "#d3dfec",
    inputText: "#17202a",
    danger: "#d64545",
    dangerSoft: "#fbeaea",
    chip: "#eef2f8",
    chipText: "#56657a",
    themeBarBg: "rgba(255,255,255,0.72)",
    themeBarBorder: "#dce6f0",
    positive: "#2f8f5b",
    progressTrack: "#e5edf5",
    progressFill: "#2f6fed",
    headerWeight: 700,
    cardStyle: "flat",
  },
  nord: {
    name: "Nord",
    pageBg: "#2e3440",
    pageBgGradient: "none",
    text: "#eceff4",
    textMuted: "#a9b1c2",
    textFaint: "#a7afbd",
    cardBg: "#3b4252",
    cardBorder: "#434c5e",
    cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
    cardRadius: "12px",
    sectionLabelColor: "#88c0d0",
    accent: "#88c0d0",
    accentText: "#2e3440",
    accentOn: "#88c0d0",
    accentSoft: "rgba(136,192,208,0.14)",
    divider: "#3b4252",
    inputBg: "#2e3440",
    inputBorder: "#434c5e",
    inputText: "#eceff4",
    danger: "#bf616a",
    dangerSoft: "rgba(191,97,106,0.15)",
    chip: "#434c5e",
    chipText: "#d8dee9",
    themeBarBg: "rgba(46,52,64,0.85)",
    themeBarBorder: "#434c5e",
    positive: "#a3be8c",
    progressTrack: "#3b4252",
    progressFill: "linear-gradient(90deg, #88c0d0, #8fbcbb)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  dracula: {
    name: "Dracula",
    pageBg: "#282a36",
    pageBgGradient: "none",
    text: "#f8f8f2",
    textMuted: "#a9adc4",
    textFaint: "#9ea0ae",
    cardBg: "#343746",
    cardBorder: "#44475a",
    cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
    cardRadius: "12px",
    sectionLabelColor: "#ff79c6",
    accent: "#bd93f9",
    accentText: "#282a36",
    accentOn: "#bf97f9",
    accentSoft: "rgba(189,147,249,0.16)",
    divider: "#3a3d4d",
    inputBg: "#21222c",
    inputBorder: "#44475a",
    inputText: "#f8f8f2",
    danger: "#ff5555",
    dangerSoft: "rgba(255,85,85,0.14)",
    chip: "#44475a",
    chipText: "#f8f8f2",
    themeBarBg: "rgba(40,42,54,0.85)",
    themeBarBorder: "#44475a",
    positive: "#50fa7b",
    progressTrack: "#3a3d4d",
    progressFill: "linear-gradient(90deg, #bd93f9, #ff79c6)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  tokyoNight: {
    name: "Tokyo Night",
    pageBg: "#1a1b26",
    pageBgGradient: "none",
    text: "#c0caf5",
    textMuted: "#8189af",
    textFaint: "#7f89b3",
    cardBg: "#1f2335",
    cardBorder: "#2a2f45",
    cardShadow: "0 1px 3px rgba(0,0,0,0.45)",
    cardRadius: "12px",
    sectionLabelColor: "#bb9af7",
    accent: "#7aa2f7",
    accentText: "#1a1b26",
    accentOn: "#7aa2f7",
    accentSoft: "rgba(122,162,247,0.14)",
    divider: "#232741",
    inputBg: "#16161e",
    inputBorder: "#2a2f45",
    inputText: "#c0caf5",
    danger: "#f7768e",
    dangerSoft: "rgba(247,118,142,0.14)",
    chip: "#2a2f45",
    chipText: "#c0caf5",
    themeBarBg: "rgba(26,27,38,0.85)",
    themeBarBorder: "#2a2f45",
    positive: "#9ece6a",
    progressTrack: "#232741",
    progressFill: "linear-gradient(90deg, #7aa2f7, #bb9af7)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  gruvbox: {
    name: "Gruvbox",
    pageBg: "#282828",
    pageBgGradient: "none",
    text: "#ebdbb2",
    textMuted: "#a89984",
    textFaint: "#a49680",
    cardBg: "#32302f",
    cardBorder: "#3c3836",
    cardShadow: "0 1px 3px rgba(0,0,0,0.42)",
    cardRadius: "12px",
    sectionLabelColor: "#fe8019",
    accent: "#fabd2f",
    accentText: "#282828",
    accentOn: "#fabd2f",
    accentSoft: "rgba(250,189,47,0.14)",
    divider: "#3c3836",
    inputBg: "#1d2021",
    inputBorder: "#504945",
    inputText: "#ebdbb2",
    danger: "#fb4934",
    dangerSoft: "rgba(251,73,52,0.14)",
    chip: "#3c3836",
    chipText: "#ebdbb2",
    themeBarBg: "rgba(40,40,40,0.85)",
    themeBarBorder: "#3c3836",
    positive: "#b8bb26",
    progressTrack: "#3c3836",
    progressFill: "linear-gradient(90deg, #fabd2f, #fe8019)",
    headerWeight: 600,
    cardStyle: "flat",
  },
  aurora: {
    name: "Aurora",
    pageBg: "#0b1020",
    pageBgGradient: "radial-gradient(1200px 700px at 12% -10%, #2a1a6b 0%, transparent 60%), radial-gradient(900px 600px at 95% 8%, #0b5f7a 0%, transparent 55%), linear-gradient(165deg, #0b1020 0%, #0d1330 100%)",
    text: "#eef1ff",
    textMuted: "#b6bce0",
    textFaint: "#8b93bf",
    cardBg: "linear-gradient(155deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)",
    cardBorder: "rgba(150,140,255,0.26)",
    cardShadow: "0 12px 34px rgba(5,4,25,0.55)",
    cardRadius: "18px",
    sectionLabelColor: "#9d8dff",
    accent: "#8b7bff",
    accentText: "#0b1020",
    accentOn: "#8b7bff",
    accentSoft: "rgba(139,123,255,0.18)",
    divider: "rgba(150,140,255,0.18)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(150,140,255,0.3)",
    inputText: "#eef1ff",
    danger: "#ff7a8a",
    dangerSoft: "rgba(255,122,138,0.16)",
    chip: "rgba(139,123,255,0.16)",
    chipText: "#d9d4ff",
    themeBarBg: "rgba(11,16,32,0.82)",
    themeBarBorder: "rgba(150,140,255,0.24)",
    positive: "#5de4b3",
    progressTrack: "rgba(255,255,255,0.09)",
    progressFill: "linear-gradient(90deg, #8b7bff, #4fd1ff)",
    headerWeight: 700,
    cardStyle: "gradient",
    blur: true,
  },
  neonMint: {
    name: "Neon Mint",
    pageBg: "#04140f",
    pageBgGradient: "radial-gradient(1000px 620px at 85% -8%, #0b5f48 0%, transparent 58%), linear-gradient(170deg, #04140f 0%, #061a15 100%)",
    text: "#e6fff5",
    textMuted: "#a6d8c6",
    textFaint: "#79a898",
    cardBg: "#0a1f19",
    cardBorder: "rgba(45,212,167,0.24)",
    cardShadow: "0 10px 28px rgba(0,0,0,0.5)",
    cardRadius: "16px",
    sectionLabelColor: "#2dd4a7",
    accent: "#2dd4a7",
    accentText: "#04140f",
    accentOn: "#2dd4a7",
    accentSoft: "rgba(45,212,167,0.16)",
    divider: "rgba(45,212,167,0.16)",
    inputBg: "#06180f",
    inputBorder: "rgba(45,212,167,0.28)",
    inputText: "#e6fff5",
    danger: "#ff7b7b",
    dangerSoft: "rgba(255,123,123,0.15)",
    chip: "rgba(45,212,167,0.14)",
    chipText: "#bff5e4",
    themeBarBg: "rgba(4,20,15,0.85)",
    themeBarBorder: "rgba(45,212,167,0.22)",
    positive: "#5ef0b6",
    progressTrack: "rgba(255,255,255,0.08)",
    progressFill: "linear-gradient(90deg, #2dd4a7, #7ef7c9)",
    headerWeight: 700,
    cardStyle: "flat",
  },
  electric: {
    name: "Electric",
    pageBg: "#08081c",
    pageBgGradient: "radial-gradient(900px 560px at 10% -6%, #4b0f6b 0%, transparent 58%), radial-gradient(800px 520px at 92% 12%, #0b3a8f 0%, transparent 55%), linear-gradient(160deg, #08081c 0%, #0a0a24 100%)",
    text: "#f2ecff",
    textMuted: "#c0b6e6",
    textFaint: "#8f86bd",
    cardBg: "linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
    cardBorder: "rgba(255,79,168,0.26)",
    cardShadow: "0 12px 32px rgba(0,0,0,0.55)",
    cardRadius: "16px",
    sectionLabelColor: "#4fd1ff",
    accent: "#ff4fa8",
    accentText: "#08081c",
    accentOn: "#ff4fa8",
    accentSoft: "rgba(255,79,168,0.17)",
    divider: "rgba(255,255,255,0.12)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,79,168,0.3)",
    inputText: "#f2ecff",
    danger: "#ff6b6b",
    dangerSoft: "rgba(255,107,107,0.16)",
    chip: "rgba(79,209,255,0.15)",
    chipText: "#bfeaff",
    themeBarBg: "rgba(8,8,28,0.84)",
    themeBarBorder: "rgba(255,79,168,0.22)",
    positive: "#4ce0a0",
    progressTrack: "rgba(255,255,255,0.09)",
    progressFill: "linear-gradient(90deg, #ff4fa8, #4fd1ff)",
    headerWeight: 700,
    cardStyle: "gradient",
    blur: true,
  },
  blossom: {
    name: "Blossom",
    pageBg: "#fff6fa",
    pageBgGradient: "radial-gradient(900px 520px at 90% -12%, #ffd9ec 0%, transparent 60%), linear-gradient(165deg, #fff8fb 0%, #fdeef6 100%)",
    text: "#2a1626",
    textMuted: "#7c5f73",
    textFaint: "#8c6d83",
    cardBg: "#ffffff",
    cardBorder: "#f4dde9",
    cardShadow: "0 2px 10px rgba(190,120,160,0.12)",
    cardRadius: "18px",
    sectionLabelColor: "#be4089",
    accent: "#e5399a",
    accentText: "#000000",
    accentOn: "#b72e7b",
    accentSoft: "rgba(229,57,154,0.12)",
    divider: "#f6e4ee",
    inputBg: "#ffffff",
    inputBorder: "#efd3e2",
    inputText: "#2a1626",
    danger: "#d63a4a",
    dangerSoft: "#fdeaec",
    chip: "#fdeaf3",
    chipText: "#7c4566",
    themeBarBg: "rgba(255,255,255,0.78)",
    themeBarBorder: "#f4dde9",
    positive: "#2f8f5b",
    progressTrack: "#f6e4ee",
    progressFill: "linear-gradient(90deg, #e5399a, #ff8ec4)",
    headerWeight: 700,
    cardStyle: "flat",
  },
  citrus: {
    name: "Citrus",
    pageBg: "#fffaf1",
    pageBgGradient: "radial-gradient(950px 540px at 8% -12%, #ffe6bf 0%, transparent 58%), linear-gradient(168deg, #fffbf3 0%, #fff3e0 100%)",
    text: "#26200f",
    textMuted: "#7a6647",
    textFaint: "#88734f",
    cardBg: "#ffffff",
    cardBorder: "#f2e3c9",
    cardShadow: "0 2px 10px rgba(180,130,50,0.12)",
    cardRadius: "16px",
    sectionLabelColor: "#b25a0a",
    accent: "#f97316",
    accentText: "#000000",
    accentOn: "#aa4f0f",
    accentSoft: "rgba(249,115,22,0.13)",
    divider: "#f7ead6",
    inputBg: "#ffffff",
    inputBorder: "#eeddc0",
    inputText: "#26200f",
    danger: "#c93a2b",
    dangerSoft: "#fceae7",
    chip: "#fdeed9",
    chipText: "#7a5320",
    themeBarBg: "rgba(255,255,255,0.78)",
    themeBarBorder: "#f2e3c9",
    positive: "#3f8f3f",
    progressTrack: "#f7ead6",
    progressFill: "linear-gradient(90deg, #f97316, #fbbf24)",
    headerWeight: 700,
    cardStyle: "flat",
  },
};

/* ----------------------------------------------------------------------
   PERSISTENCE HELPERS
---------------------------------------------------------------------- */

const STORAGE_KEYS = {
  theme: "dash.theme",
  fitness: "dash.fitness",
  golf: "dash.golf",
  financial: "dash.financial",
  trackers: "dash.trackers",
  profile: "dash.profile",
  integrations: "dash.integrations",
  upcoming: "dash.upcoming",
  history: "dash.history",
  briefingLastShown: "dash.briefingLastShown",
  weather: "dash.weather",
  watchlist: "dash.watchlist",
  journal: "dash.journal",
  goals: "dash.goals",
  transactions: "dash.transactions",
  youtube: "dash.youtube",
  golfSimRounds: "dash.golfSimRounds",
  golfOutdoorRounds: "dash.golfOutdoorRounds",
  golfScorecards: "dash.golfScorecards",
  fantasyCheatSheets: "dash.fantasyCheatSheets",
  fantasyCustomRankings: "dash.fantasyCustomRankings",
  fantasyWatchlist: "dash.fantasyWatchlist",
  fantasySleeper: "dash.fantasySleeper",
  fantasyYahoo: "dash.fantasyYahoo",
  moLinks: "dash.moLinks",
  pkiReport: "dash.pkiReport",
  moSnapshots: "dash.moSnapshots",
  moPolicies: "dash.moPolicies",
  deck: "dash.deck",
  appNotice: "dash.appNotice",
  habits: "dash.habits",
  birthdays: "dash.birthdays",
  reading: "dash.reading",
  movies: "dash.movies",
  feeds: "dash.feeds",
  resume: "dash.resume",
  moHelp: "dash.moHelp",
  railCollapsed: "dash.railCollapsed",
  pageImages: "dash.pageImages",
  appNoticeDraft: "dash.appNoticeDraft",
  games: "dash.games",
  dailyLog: "dash.dailyLog",
  kev: "dash.kev",
  vulntrend: "dash.vulntrend",
  sports: "dash.sports",
  subscriptions: "dash.subscriptions",
  news: "dash.news",
  lock: "dash.lock",
  reminders: "dash.reminders",
  navOpenGroup: "dash.navOpenGroup",
  pageVisits: "dash.pageVisits",
  ravenProducts: "dash.ravenProducts",
  trips: "dash.trips",
  mealPlanning: "dash.mealPlanning",
  lastfm: "dash.lastfm",
  cveWatchlist: "dash.cveWatchlist",
  budgets: "dash.budgets",
  workouts: "dash.workouts",
  homeTileOrder: "dash.homeTileOrder",
  schemaVersion: "dash.schemaVersion",
  categoryRules: "dash.categoryRules",
  jobSearchProfile: "dash.jobSearchProfile",
  jobSearchCache: "dash.jobSearchCache",
  jobSearchStatus: "dash.jobSearchStatus",
};

// "The War Room" fantasy-football port — defaults for the localStorage-backed
// fields that replaced its server-side Netlify Blobs storage (cheat sheets,
// custom rankings, watchlist, linked league IDs). Yahoo tokens are the one
// exception and stay server-side (see netlify/functions/fantasy-yahoo.js).
const DEFAULT_FANTASY_CHEAT_SHEETS = {};
const DEFAULT_FANTASY_CUSTOM_RANKINGS = {};
const DEFAULT_FANTASY_WATCHLIST = [];
const DEFAULT_FANTASY_SLEEPER = { username: "", userId: "", linkedLeagueIds: [] };
const DEFAULT_FANTASY_YAHOO = { linkedLeagueKeys: [] };

function isMergeablePlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed == null) return fallback;
    if (isMergeablePlainObject(fallback) && isMergeablePlainObject(parsed)) {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* localStorage unavailable or full — silently ignore */
  }
}

// ----------------------------------------------------------------------
// Versioned data migrations. Most new fields just need a default merged in
// on read — usePersistentState's loadJSON already does that for free — so
// this is only for changes loadJSON's shallow merge can't express: a field
// that needs real values computed from other stored data, a rename, a
// reshape. Runs once on boot, before anything reads state, and stamps
// dash.schemaVersion so it never re-runs a step it's already applied.
const CURRENT_SCHEMA_VERSION = 1;
const MIGRATIONS = [
  {
    version: 1,
    // The 7 named account trackers (added after `financial` already existed
    // for plenty of users) — backfill them instead of leaving old installs
    // to rely on FinancialAccountsSection's render-time fallback forever.
    migrate() {
      const fin = loadJSON(STORAGE_KEYS.financial, DEFAULT_FINANCIAL);
      if (!fin.accounts || !fin.accounts.length) {
        saveJSON(STORAGE_KEYS.financial, { ...fin, accounts: DEFAULT_FINANCIAL_ACCOUNTS });
      }
    },
  },
];
function runMigrations() {
  const stored = loadJSON(STORAGE_KEYS.schemaVersion, 0);
  const pending = MIGRATIONS.filter((m) => m.version > stored).sort((a, b) => a.version - b.version);
  if (!pending.length) return;
  pending.forEach((m) => {
    try {
      m.migrate();
    } catch (e) {
      /* one bad migration shouldn't block the rest — the field just keeps
         falling back at render time like it did before this ran */
    }
  });
  saveJSON(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
}

// Background scroll lock, ref-counted so overlapping overlays can't corrupt
// each other's save/restore. Pads for the scrollbar so locking doesn't shift
// the page underneath.
let __vScrollLocks = 0;
let __vScrollPrev = { overflow: "", paddingRight: "" };
function lockBodyScroll() {
  if (typeof document === "undefined") return () => {};
  const body = document.body;
  if (__vScrollLocks === 0) {
    __vScrollPrev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = gap + "px";
  }
  __vScrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    __vScrollLocks = Math.max(0, __vScrollLocks - 1);
    if (__vScrollLocks === 0) {
      body.style.overflow = __vScrollPrev.overflow;
      body.style.paddingRight = __vScrollPrev.paddingRight;
    }
  };
}

function usePersistentState(key, initial) {
  const [state, setState] = useState(() => loadJSON(key, initial));
  // The first effect run would write back the value we just read (or the
  // untouched default) — ~50 pointless serialize-and-store round trips during
  // startup, on the critical path. Skip it and only persist real changes.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return; }
    saveJSON(key, state);
  }, [key, state]);
  // Cross-tab sync: the storage event only fires in *other* tabs/windows for
  // the same origin, never the one that made the write, so this can't loop.
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== key) return;
      setState(loadJSON(key, initial));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [state, setState];
}

// One-shot deep-link actions (Shortcuts/home-screen icons) that App() should
// auto-clear from the hash shortly after landing — as opposed to a page's own
// persistent hash sub-route (e.g. Fantasy's "#fantasy/players"), which reuses
// the same useHashRoute "action" field but must never be cleared.
const ONE_SHOT_QUICK_ACTIONS = new Set(["log-weight", "add"]);

// Minimal hash-based router — no library needed for a handful of pages.
// The hash is the source of truth so pages are bookmarkable/shareable and
// the browser's back/forward buttons work; validIds guards against a stale
// hash pointing at a page that no longer exists.
function useHashRoute(defaultRoute, validIds) {
  function resolve() {
    const raw = window.location.hash.replace(/^#/, "");
    // Only the first "/"-segment decides the top-level page, so a page that owns
    // a deeper sub-path (e.g. the Fantasy tab's "fantasy/players/123") still
    // resolves here instead of falling back to defaultRoute.
    const parts = raw.split("/");
    const top = parts[0];
    return {
      route: top && validIds.includes(top) ? top : defaultRoute,
      // Everything after the page id — e.g. "#fitness/log-weight" gives an
      // action of "log-weight", used for deep-link quick actions (Shortcuts,
      // home-screen icons) that should open straight into a specific field
      // instead of just landing on the page.
      action: top && validIds.includes(top) && parts.length > 1 ? parts.slice(1).join("/") : null,
    };
  }
  const [state, setState] = useState(resolve);
  useEffect(() => {
    function onHashChange() {
      setState(resolve());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function navigate(next) {
    window.location.hash = next === defaultRoute ? "" : next;
  }
  // Called once the target page has consumed the action, so a refresh
  // doesn't keep re-triggering it and the URL settles on the plain page.
  function clearAction() {
    if (state.action) window.location.hash = state.route;
  }
  return [state.route, navigate, state.action, clearAction];
}

/* ----------------------------------------------------------------------
   DEFAULT DATA
---------------------------------------------------------------------- */

const DEFAULT_FITNESS = {
  benchLbs: 225,
  benchReps: 5,
  currentWeight: 185,
  targetWeight: 177,
};

const DEFAULT_GOLF = {
  roundsYtd: 18,
  handicap: 3.2,
};

const DEFAULT_GOLF_ROUNDS = [];

const DEFAULT_FINANCIAL_ACCOUNTS = [
  { id: "acct-synchrony", name: "Synchrony", balance: 0 },
  { id: "acct-checking", name: "Checking", balance: 0 },
  { id: "acct-bofa-savings", name: "BofA Savings", balance: 0 },
  { id: "acct-corro-401k", name: "Corro 401k", balance: 0 },
  { id: "acct-fidelity-brokerage", name: "Fidelity Brokerage", balance: 0 },
  { id: "acct-personal-401k", name: "Personal 401k", balance: 0 },
  { id: "acct-mo-401k", name: "Mechanical Orchard 401k", balance: 0 },
];

const DEFAULT_FINANCIAL = {
  targetDownPayment: 90000,
  timelineLow: 12,
  timelineHigh: 17,
  currentSavings: 0,
  accounts: DEFAULT_FINANCIAL_ACCOUNTS,
};

const DEFAULT_TRACKERS = [
  { id: "t2", label: "5K PR", value: "21:04", target: "" },
];

function computeGoalProgress(value, target) {
  if (!target) return null;
  const v = Number(value);
  const t = Number(target);
  if (Number.isNaN(v) || Number.isNaN(t) || t === 0) return null;
  return Math.max(0, Math.min(100, Math.round((v / t) * 100)));
}

const DEFAULT_UPCOMING_EVENTS = [
  { id: "e1", title: "Telluride Trip", detail: "Aug 14 – 17", date: "2026-08-14" },
  { id: "e2", title: "Fal.Con 2026", detail: "Aug 31 – Sep 3", date: "2026-08-31" },
];

const DEFAULT_HISTORY = { fitness: [], golf: [], trackers: {}, accounts: {} };

function pushHistoryPoint(series, value) {
  const numValue = Number(value);
  if (Number.isNaN(numValue)) return series;
  const today = new Date().toISOString().slice(0, 10);
  const idx = series.findIndex((p) => p.date === today);
  let next;
  if (idx !== -1) {
    next = series.slice();
    next[idx] = { date: today, value: numValue };
  } else {
    next = [...series, { date: today, value: numValue }];
  }
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-30);
}

function analyzeTrend(series, { flatThreshold = 0.5, minSpanDays = 6 } = {}) {
  if (!series || series.length < 3) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const spanDays = Math.round((new Date(last.date) - new Date(first.date)) / 86400000);
  if (spanDays < minSpanDays) return null;
  const delta = Math.round((last.value - first.value) * 10) / 10;
  const status = Math.abs(delta) <= flatThreshold ? "flat" : delta > 0 ? "up" : "down";
  return { status, delta, spanDays, first: first.value, last: last.value };
}

const DEFAULT_PROFILE = {
  interests: ["Golf", "Fitness"],
  genres: [],
  activities: {},
  topPicks: [],
  notes: "",
};

const DEFAULT_INTEGRATIONS = {
  googleClientId: "",
  msClientId: "",
  tiktokClientKey: "",
  tiktokBackendUrl: "",
};

const DEFAULT_WATCHLIST = [];

const DEFAULT_TRANSACTIONS = [];

const DEFAULT_YOUTUBE = { lastSeenAt: null };

const CATEGORY_KEYWORDS = [
  { category: "Groceries", pattern: /whole foods|trader joe|kroger|safeway|grocery|grocer|aldi|publix/i },
  { category: "Dining", pattern: /starbucks|coffee|restaurant|cafe|chipotle|mcdonald|doordash|uber eats|ubereats|grubhub|pizza/i },
  { category: "Transportation", pattern: /shell|chevron|exxon|gas station|uber|lyft|parking|transit/i },
  { category: "Shopping", pattern: /amazon|target|walmart|best buy|costco|ebay/i },
  { category: "Subscriptions", pattern: /netflix|spotify|hulu|disney\+|apple\.com\/bill|patreon|subscription/i },
  { category: "Housing", pattern: /\brent\b|mortgage|\bhoa\b/i },
  { category: "Utilities", pattern: /electric|water bill|utility|comcast|internet|verizon|at&t|xfinity/i },
  { category: "Health", pattern: /pharmacy|\bcvs\b|walgreens|doctor|clinic|dental/i },
];

function guessCategory(description, customRules) {
  const text = String(description || "").toLowerCase();
  if (customRules && customRules.length) {
    const custom = customRules.find((r) => r.pattern && text.includes(r.pattern.toLowerCase()));
    if (custom) return custom.category;
  }
  const found = CATEGORY_KEYWORDS.find((k) => k.pattern.test(description));
  return found ? found.category : "Uncategorized";
}

function normalizeStatementDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  let year, month, day;
  if (a > 31) {
    year = a;
    month = b;
    day = c;
  } else {
    month = a;
    day = b;
    year = c < 100 ? 2000 + c : c;
  }
  if (!year || !month || !day || month > 12 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Delimiter-agnostic on purpose: pasted CSV/TSV from a bank export and text
// reconstructed from a PDF (space-separated columns, no consistent delimiter)
// both flow through here. Rather than splitting on a delimiter, it finds the
// date and the amount by pattern anywhere in the line and treats whatever's
// left as the description — works regardless of what separates the fields.
function parseStatementLine(line, customRules) {
  const amountMatches = [...line.matchAll(/\(?-?\$?\d[\d,]*\.\d{2}\)?/g)];
  if (amountMatches.length === 0) return null;
  // Statement rows are usually "date  description  amount [running balance]" —
  // the last amount-shaped token is the transaction amount far more often than
  // not, but a running-balance column can fool this on some bank formats.
  const amountMatch = amountMatches[amountMatches.length - 1];
  const rawAmount = amountMatch[0].replace(/[\s$,]/g, "").replace(/[()]/g, "").replace(/^-/, "");
  const amount = Math.abs(Number(rawAmount));
  if (!Number.isFinite(amount) || amount === 0) return null;

  const dateMatch = line.match(/\b\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}\b/);
  const date = dateMatch ? normalizeStatementDate(dateMatch[0]) : null;

  const ranges = [[amountMatch.index, amountMatch.index + amountMatch[0].length]];
  if (dateMatch) ranges.push([dateMatch.index, dateMatch.index + dateMatch[0].length]);
  ranges.sort((a, b) => a[0] - b[0]);

  let description = "";
  let cursor = 0;
  ranges.forEach(([start, end]) => {
    description += line.slice(cursor, start);
    cursor = end;
  });
  description += line.slice(cursor);
  description = description
    .replace(/["\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,\-–—]+|[\s,\-–—]+$/g, "")
    .trim();

  return {
    date: date || new Date().toISOString().slice(0, 10),
    merchant: description || "Transaction",
    amount,
    category: guessCategory(description, customRules),
  };
}

function parseStatementText(text, customRules) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results = [];
  lines.forEach((line, lineIdx) => {
    const parsed = parseStatementLine(line, customRules);
    if (!parsed) return;
    results.push({ id: "tx" + Date.now() + lineIdx + Math.random().toString(36).slice(2, 6), ...parsed });
  });
  return results;
}

// Reconstructs readable lines from a PDF's raw positioned text fragments by
// bucketing items with near-equal Y coordinates into rows, then ordering each
// row left to right — pdf.js hands back individual glyphs/words with x/y
// positions, not pre-joined lines.
function groupPdfTextItemsIntoLines(items) {
  const sorted = items
    .slice()
    .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  const rows = [];
  let current = null;
  let currentY = null;
  const TOLERANCE = 2.5;
  sorted.forEach((item) => {
    const y = item.transform[5];
    if (current && Math.abs(y - currentY) <= TOLERANCE) {
      current.push(item);
    } else {
      if (current) rows.push(current);
      current = [item];
      currentY = y;
    }
  });
  if (current) rows.push(current);
  return rows
    .map((row) =>
      row
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((it) => it.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

// Lazily pull pdf.js from its CDN only when a PDF is actually read (bank
// statement import here, Raven's Eye report scanning below) — keeps the
// initial page weightless. It ships as an ES module with no UMD build, so
// this uses a dynamic import() rather than the createElement("script")
// pattern the other lazy-loaded libraries in this file use.
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (window.__pdfjsPromise) return window.__pdfjsPromise;
  window.__pdfjsPromise = import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.min.mjs")
    .then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.worker.min.mjs";
      window.pdfjsLib = mod;
      return mod;
    })
    .catch((err) => {
      window.__pdfjsPromise = null;
      throw new Error("Couldn't load the PDF reader (are you offline?).");
    });
  return window.__pdfjsPromise;
}

async function extractPdfText(file) {
  await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const allLines = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    allLines.push(...groupPdfTextItemsIntoLines(content.items));
  }
  return allLines.join("\n");
}

const DEFAULT_JOURNAL = [];

const DEFAULT_GOALS = [];

const GOAL_STATUSES = ["not-started", "in-progress", "done"];
const GOAL_STATUS_LABELS = { "not-started": "Not Started", "in-progress": "In Progress", done: "Done" };

const TITLE_CATALOG = [
  { title: "Mad Max: Fury Road", type: "movie", genres: ["Action"], popular: true },
  { title: "John Wick", type: "movie", genres: ["Action", "Thriller"] },
  { title: "The Bourne Identity", type: "movie", genres: ["Action", "Thriller"] },
  { title: "Brooklyn Nine-Nine", type: "show", genres: ["Comedy"], popular: true },
  { title: "Superbad", type: "movie", genres: ["Comedy"] },
  { title: "Parks and Recreation", type: "show", genres: ["Comedy"] },
  { title: "The Wire", type: "show", genres: ["Drama", "Crime"] },
  { title: "Succession", type: "show", genres: ["Drama"], popular: true },
  { title: "Manchester by the Sea", type: "movie", genres: ["Drama"] },
  { title: "Interstellar", type: "movie", genres: ["Sci-Fi"], popular: true },
  { title: "The Expanse", type: "show", genres: ["Sci-Fi"] },
  { title: "Arrival", type: "movie", genres: ["Sci-Fi"] },
  { title: "Hereditary", type: "movie", genres: ["Horror"] },
  { title: "The Haunting of Hill House", type: "show", genres: ["Horror"] },
  { title: "Get Out", type: "movie", genres: ["Horror", "Thriller"] },
  { title: "Free Solo", type: "movie", genres: ["Documentary"], popular: true },
  { title: "Chef's Table", type: "show", genres: ["Documentary"] },
  { title: "Won't You Be My Neighbor?", type: "movie", genres: ["Documentary"] },
  { title: "The Notebook", type: "movie", genres: ["Romance"] },
  { title: "Normal People", type: "show", genres: ["Romance", "Drama"] },
  { title: "Pride & Prejudice", type: "movie", genres: ["Romance"] },
  { title: "Gone Girl", type: "movie", genres: ["Thriller"] },
  { title: "Mindhunter", type: "show", genres: ["Thriller", "Crime"] },
  { title: "Prisoners", type: "movie", genres: ["Thriller"] },
  { title: "Spider-Man: Into the Spider-Verse", type: "movie", genres: ["Animation", "Action"], popular: true },
  { title: "Arcane", type: "show", genres: ["Animation", "Fantasy"] },
  { title: "Spirited Away", type: "movie", genres: ["Animation", "Fantasy"] },
  { title: "The Lord of the Rings: The Fellowship of the Ring", type: "movie", genres: ["Fantasy"], popular: true },
  { title: "The Witcher", type: "show", genres: ["Fantasy"] },
  { title: "Pan's Labyrinth", type: "movie", genres: ["Fantasy"] },
  { title: "Breaking Bad", type: "show", genres: ["Crime", "Drama"], popular: true },
  { title: "The Godfather", type: "movie", genres: ["Crime", "Drama"] },
  { title: "Narcos", type: "show", genres: ["Crime"] },
  { title: "The Great British Bake Off", type: "show", genres: ["Reality TV"] },
  { title: "Survivor", type: "show", genres: ["Reality TV"] },
  { title: "Queer Eye", type: "show", genres: ["Reality TV"] },
];

function suggestTitles(genres, queue, count) {
  const n = count || 4;
  const queuedTitles = new Set((queue || []).map((q) => q.title.toLowerCase()));
  const candidates = TITLE_CATALOG.filter((c) => !queuedTitles.has(c.title.toLowerCase()));
  if (genres && genres.length > 0) {
    const scored = candidates
      .map((c) => ({ ...c, score: c.genres.filter((g) => genres.includes(g)).length }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length >= n) return scored.slice(0, n);
    const rest = candidates.filter((c) => !scored.some((s) => s.title === c.title));
    return [...scored, ...rest.filter((c) => c.popular)].slice(0, n);
  }
  const popular = candidates.filter((c) => c.popular);
  return (popular.length >= n ? popular : candidates).slice(0, n);
}

const QUIZ_GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Horror",
  "Documentary",
  "Romance",
  "Thriller",
  "Animation",
  "Fantasy",
  "Crime",
  "Reality TV",
];

const QUIZ_ACTIVITIES = [
  "Hiking",
  "Cooking",
  "Gaming",
  "Live Music",
  "Museums",
  "Golf",
  "Travel",
  "Photography",
  "Board Games",
  "Wine/Beer Tasting",
  "Movie Nights",
  "Running",
  "Yoga",
  "Fishing",
  "Skiing/Snowboarding",
];

function findFreeWeekendDay(events) {
  const busyDates = new Set(events.map((e) => e.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 9; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const day = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    if ((day === 0 || day === 6) && !busyDates.has(iso)) {
      return { date: iso, label: d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) };
    }
  }
  return null;
}

const DEFAULT_WEATHER = { lat: null, lon: null, fetchedAt: null, days: [] };

function weatherInfo(code) {
  if (code === 0) return { label: "Clear", icon: "☀️", outdoor: true };
  if (code >= 1 && code <= 3) return { label: "Partly cloudy", icon: "⛅", outdoor: true };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "🌫️", outdoor: false };
  if (code >= 51 && code <= 67) return { label: "Rain", icon: "🌧️", outdoor: false };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "❄️", outdoor: false };
  if (code >= 80 && code <= 82) return { label: "Showers", icon: "🌦️", outdoor: false };
  if (code >= 95) return { label: "Storms", icon: "⛈️", outdoor: false };
  return { label: "Mixed", icon: "🌤️", outdoor: true };
}

async function fetchWeatherDays(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
    "&temperature_unit=fahrenheit&timezone=auto&forecast_days=10";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  return data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weathercode[i],
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    precipProb: data.daily.precipitation_probability_max[i],
  }));
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCSV(headers, rows) {
  const lines = [headers.map(csvCell).join(",")];
  rows.forEach((r) => lines.push(r.map(csvCell).join(",")));
  return lines.join("\r\n");
}

function IconMusic({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconCloud({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.3-2A5 5 0 0 0 6 19h11.5z" />
    </svg>
  );
}

const WEATHER_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A dedicated forecast view for data that was already being fetched
// (fetchWeatherDays above) but never had anywhere to be seen beyond
// feeding golf/briefing suggestions — this is pure presentation, no new
// data layer.
function WeatherPage({ theme, weather, weatherStatus, onEnableWeather }) {
  const enabled = weather && weather.lat != null;
  const todayIso = new Date().toISOString().slice(0, 10);

  if (!enabled) {
    return (
      <Card theme={theme}>
        <SectionLabel theme={theme} icon={<IconCloud size={16} />}>Weather</SectionLabel>
        <p style={{ fontSize: "14px", color: theme.textMuted, marginBottom: "16px" }}>
          Add your location to see a 10-day forecast here.
        </p>
        <button
          onClick={onEnableWeather}
          className="v-btn"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: theme.accentText,
            background: theme.accent,
            border: "none",
            borderRadius: "999px",
            padding: "9px 18px",
            alignSelf: "flex-start",
          }}
        >
          {weatherStatus && weatherStatus.type === "loading" ? weatherStatus.message : "Add local weather"}
        </button>
        {weatherStatus && weatherStatus.type === "error" && (
          <div style={{ fontSize: "12px", color: theme.danger, marginTop: "12px" }}>{weatherStatus.message}</div>
        )}
      </Card>
    );
  }

  const days = weather.days || [];

  return (
    <Card theme={theme}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconCloud size={16} />} style={{ marginBottom: 0 }}>
          10-Day Forecast
        </SectionLabel>
        <button
          onClick={onEnableWeather}
          className="v-btn"
          style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
        >
          {weatherStatus && weatherStatus.type === "loading" ? weatherStatus.message : "Refresh"}
        </button>
      </div>
      {weatherStatus && weatherStatus.type === "error" && (
        <div style={{ fontSize: "12px", color: theme.danger, marginBottom: "14px" }}>
          {days.length > 0 && weather.fetchedAt
            ? `Couldn't refresh — showing forecast from ${timeAgo(weather.fetchedAt)}.`
            : weatherStatus.message}
        </div>
      )}
      {days.length > 0 && (!weatherStatus || weatherStatus.type !== "error") && weather.fetchedAt && (
        <div style={{ fontSize: "11px", color: theme.textFaint, marginBottom: "14px" }}>Updated {timeAgo(weather.fetchedAt)}</div>
      )}
      {days.length === 0 ? (
        <p style={{ fontSize: "14px", color: theme.textFaint }}>No forecast yet — try refreshing.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
          {days.map((d) => {
            const info = weatherInfo(d.code);
            const isToday = d.date === todayIso;
            const dow = WEATHER_DAY_NAMES[new Date(d.date + "T00:00:00").getDay()];
            return (
              <div
                key={d.date}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  padding: "14px 8px",
                  borderRadius: "12px",
                  border: `1px solid ${isToday ? theme.accent : theme.divider}`,
                  background: isToday ? theme.accentSoft : "transparent",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: isToday ? theme.accent : theme.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {isToday ? "Today" : dow}
                </span>
                <span style={{ fontSize: "28px" }}>{info.icon}</span>
                <span style={{ fontSize: "11px", color: theme.textFaint, textAlign: "center" }}>{info.label}</span>
                <span className="v-tabular" style={{ fontSize: "15px", fontWeight: 700, color: theme.text }}>
                  {d.tempMax}&deg; <span style={{ color: theme.textFaint, fontWeight: 500 }}>{d.tempMin}&deg;</span>
                </span>
                {d.precipProb > 0 && <span style={{ fontSize: "10.5px", color: theme.sectionLabelColor }}>💧 {d.precipProb}%</span>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const DEFAULT_TRIPS = [];
const TRIP_PACKING_SUGGESTIONS = ["Passport", "Phone charger", "Toothbrush", "Medications", "Sunglasses", "Weather-appropriate layers"];

function IconPlane({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 0-1.3.4l-.7.7c-.4.4-.3 1 .2 1.3L9 12l-2 2H4l-1 1 3 2 2 3 1-1v-3l2-2 3.6 6c.3.5.9.6 1.3.2l.7-.7c.4-.3.5-.8.4-1.3Z" />
    </svg>
  );
}

function tripBlank() {
  return { name: "", destination: "", startDate: "", endDate: "" };
}

function TripDetail({ theme, trip, onUpdate, onBack, onRemove, inputStyle }) {
  const [packItem, setPackItem] = useState("");
  const [itinDay, setItinDay] = useState("");
  const [itinText, setItinText] = useState("");
  const [budgetLabel, setBudgetLabel] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  function addPackItem(label) {
    const l = (label ?? packItem).trim();
    if (!l) return;
    onUpdate({ packing: [...trip.packing, { id: "pk" + Date.now() + Math.random().toString(36).slice(2, 6), label: l, done: false }] });
    if (label === undefined) setPackItem("");
  }
  function togglePack(id) {
    onUpdate({ packing: trip.packing.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) });
  }
  function removePack(id) {
    onUpdate({ packing: trip.packing.filter((p) => p.id !== id) });
  }
  function addItinerary() {
    if (!itinText.trim()) return;
    onUpdate({ itinerary: [...trip.itinerary, { id: "it" + Date.now(), day: itinDay.trim(), text: itinText.trim() }] });
    setItinDay("");
    setItinText("");
  }
  function removeItinerary(id) {
    onUpdate({ itinerary: trip.itinerary.filter((i) => i.id !== id) });
  }
  function addBudgetItem() {
    const amt = Number(budgetAmount);
    if (!budgetLabel.trim() || !amt) return;
    onUpdate({ budget: [...trip.budget, { id: "bg" + Date.now(), label: budgetLabel.trim(), amount: amt }] });
    setBudgetLabel("");
    setBudgetAmount("");
  }
  function removeBudgetItem(id) {
    onUpdate({ budget: trip.budget.filter((b) => b.id !== id) });
  }

  const totalBudget = trip.budget.reduce((s, b) => s + b.amount, 0);
  const packedCount = trip.packing.filter((p) => p.done).length;
  const removeBtnStyle = { fontSize: "16px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer" };
  const rowStyle = { display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px" };
  const addBtnStyle = { fontSize: "13px", fontWeight: 700, color: theme.accentText, background: theme.accent, border: "none", borderRadius: "8px", padding: "9px 16px", flexShrink: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <button onClick={onBack} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: "none", padding: 0, marginBottom: "6px", cursor: "pointer" }}>
              ← All trips
            </button>
            <SectionLabel theme={theme} icon={<IconPlane size={16} />} style={{ marginBottom: 0 }}>
              {trip.name}
            </SectionLabel>
            <div style={{ fontSize: "12.5px", color: theme.textMuted, marginTop: "4px" }}>
              {trip.destination || "—"} {trip.startDate && `· ${trip.startDate}${trip.endDate ? " – " + trip.endDate : ""}`}
            </div>
          </div>
          <button
            onClick={onRemove}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.danger, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
          >
            Delete trip
          </button>
        </div>
      </Card>

      <Card theme={theme}>
        <SectionLabel theme={theme}>Packing list{trip.packing.length > 0 ? ` (${packedCount}/${trip.packing.length})` : ""}</SectionLabel>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <input
            value={packItem}
            onChange={(e) => setPackItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPackItem()}
            placeholder="Add an item…"
            className="v-input"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => addPackItem()} className="v-btn" style={addBtnStyle}>
            Add
          </button>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {TRIP_PACKING_SUGGESTIONS.filter((s) => !trip.packing.some((p) => p.label === s)).map((s) => (
            <button
              key={s}
              onClick={() => addPackItem(s)}
              className="v-btn"
              style={{ fontSize: "11.5px", fontWeight: 600, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
            >
              + {s}
            </button>
          ))}
        </div>
        {trip.packing.length === 0 ? (
          <p style={{ fontSize: "13px", color: theme.textFaint }}>Nothing added yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {trip.packing.map((p) => (
              <div key={p.id} style={rowStyle}>
                <input type="checkbox" checked={p.done} onChange={() => togglePack(p.id)} />
                <span style={{ flex: 1, fontSize: "13.5px", color: theme.text, textDecoration: p.done ? "line-through" : "none", opacity: p.done ? 0.6 : 1 }}>
                  {p.label}
                </span>
                <button onClick={() => removePack(p.id)} className="v-btn" style={removeBtnStyle}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card theme={theme}>
        <SectionLabel theme={theme}>Itinerary</SectionLabel>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input value={itinDay} onChange={(e) => setItinDay(e.target.value)} placeholder="Day (e.g. Fri)" className="v-input" style={{ ...inputStyle, width: "110px", flexShrink: 0 }} />
          <input
            value={itinText}
            onChange={(e) => setItinText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItinerary()}
            placeholder="What's happening…"
            className="v-input"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addItinerary} className="v-btn" style={addBtnStyle}>
            Add
          </button>
        </div>
        {trip.itinerary.length === 0 ? (
          <p style={{ fontSize: "13px", color: theme.textFaint }}>Nothing planned yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {trip.itinerary.map((i) => (
              <div key={i.id} style={rowStyle}>
                {i.day && <span style={{ fontSize: "11px", fontWeight: 700, color: theme.accent, flexShrink: 0, width: "40px" }}>{i.day}</span>}
                <span style={{ flex: 1, fontSize: "13.5px", color: theme.text }}>{i.text}</span>
                <button onClick={() => removeItinerary(i.id)} className="v-btn" style={removeBtnStyle}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card theme={theme}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <SectionLabel theme={theme} style={{ marginBottom: 0 }}>
            Budget
          </SectionLabel>
          <span className="v-tabular" style={{ fontSize: "16px", fontWeight: 700, color: theme.text }}>
            ${totalBudget.toLocaleString()}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            value={budgetLabel}
            onChange={(e) => setBudgetLabel(e.target.value)}
            placeholder="Item (e.g. Flights)"
            className="v-input"
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && addBudgetItem()}
            inputMode="decimal"
            placeholder="$"
            className="v-input"
            style={{ ...inputStyle, width: "90px" }}
          />
          <button onClick={addBudgetItem} className="v-btn" style={addBtnStyle}>
            Add
          </button>
        </div>
        {trip.budget.length === 0 ? (
          <p style={{ fontSize: "13px", color: theme.textFaint }}>No budget items yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {trip.budget.map((b) => (
              <div key={b.id} style={rowStyle}>
                <span style={{ flex: 1, fontSize: "13.5px", color: theme.text }}>{b.label}</span>
                <span className="v-tabular" style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text }}>
                  ${b.amount.toLocaleString()}
                </span>
                <button onClick={() => removeBudgetItem(b.id)} className="v-btn" title="Remove item" style={removeBtnStyle}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TravelPage({ theme, trips, setTrips }) {
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(tripBlank());
  const [showForm, setShowForm] = useState(false);

  function addTrip() {
    if (!form.name.trim()) { toast.info("Give the trip a name first."); focusField("trip-name"); return; }
    const trip = {
      id: "trip" + Date.now(),
      name: form.name.trim(),
      destination: form.destination.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      packing: [],
      itinerary: [],
      budget: [],
    };
    setTrips([trip, ...trips]);
    setForm(tripBlank());
    setShowForm(false);
    setSelectedId(trip.id);
  }
  function removeTrip(id) {
    const removed = trips.find((t) => t.id === id);
    const wasSelected = selectedId === id;
    setTrips(trips.filter((t) => t.id !== id));
    if (wasSelected) setSelectedId(null);
    if (removed) toastUndo(`"${removed.name || "trip"}"`, () => {
      setTrips((cur) => [...(cur || []), removed]);
      if (wasSelected) setSelectedId(removed.id);
    });
  }
  function updateTrip(id, patch) {
    setTrips(trips.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  const selected = trips.find((t) => t.id === selectedId);
  if (selected) {
    return (
      <TripDetail
        theme={theme}
        trip={selected}
        onUpdate={(patch) => updateTrip(selected.id, patch)}
        onBack={() => setSelectedId(null)}
        onRemove={() => removeTrip(selected.id)}
        inputStyle={inputStyle}
      />
    );
  }

  return (
    <Card theme={theme}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <SectionLabel theme={theme} icon={<IconPlane size={16} />} style={{ marginBottom: 0 }}>
          Trips
        </SectionLabel>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="v-btn"
          style={{ fontSize: "12px", fontWeight: 700, color: theme.accentText, background: theme.accent, border: "none", borderRadius: "999px", padding: "6px 14px" }}
        >
          + New Trip
        </button>
      </div>
      {showForm && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
          <input id="v-field-trip-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Trip name (e.g. Telluride)" className="v-input" style={inputStyle} />
          <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Destination" className="v-input" style={inputStyle} />
          <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="v-input" style={inputStyle} />
          <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="v-input" style={inputStyle} />
          <button
            onClick={addTrip}
            className="v-btn"
            style={{ gridColumn: "span 2", fontSize: "13px", fontWeight: 700, color: theme.accentText, background: theme.accent, border: "none", borderRadius: "8px", padding: "9px" }}
          >
            Create trip
          </button>
        </div>
      )}
      {trips.length === 0 ? (
        <p style={{ fontSize: "14px", color: theme.textFaint }}>No trips yet — plan your first one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {trips.map((t) => {
            const packed = t.packing.filter((p) => p.done).length;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="v-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", padding: "12px 14px", color: theme.text }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>
                    {t.destination || "—"} {t.startDate && `· ${t.startDate}${t.endDate ? " – " + t.endDate : ""}`}
                  </div>
                </div>
                <div style={{ fontSize: "11.5px", color: theme.textFaint, flexShrink: 0 }}>{t.packing.length > 0 ? `${packed}/${t.packing.length} packed` : ""}</div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const DEFAULT_MEAL_PLANNING = { likedIngredients: [], savedRecipes: [], weeklyPlan: {} };
const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";
const WEEK_DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

// Curated high-protein, low-calorie, short-ingredient-list meals — no API
// call needed, so these are always available even if TheMealDB is down.
const QUICK_MEALS = [
  {
    id: "quick-chicken-broccoli", name: "Grilled Chicken & Broccoli", kcal: 420, protein: 46,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Chicken breast", measure: "8 oz" },
      { ingredient: "Broccoli florets", measure: "2 cups" },
      { ingredient: "Olive oil", measure: "1 tbsp" },
      { ingredient: "Garlic powder", measure: "1 tsp" },
      { ingredient: "Salt & pepper", measure: "to taste" },
    ],
    instructions: "Season the chicken breast with garlic powder, salt and pepper. Grill or pan-sear over medium-high heat, about 6-7 minutes per side until cooked through. Toss broccoli in olive oil and roast or steam until tender-crisp. Serve together.",
  },
  {
    id: "quick-greek-yogurt-bowl", name: "Greek Yogurt Protein Bowl", kcal: 280, protein: 32,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Plain nonfat Greek yogurt", measure: "1.5 cups" },
      { ingredient: "Blueberries", measure: "1/2 cup" },
      { ingredient: "Chia seeds", measure: "1 tbsp" },
      { ingredient: "Honey", measure: "1 tsp" },
    ],
    instructions: "Spoon the Greek yogurt into a bowl. Top with blueberries and chia seeds, then drizzle with honey. Stir and eat immediately, or refrigerate overnight for a thicker texture.",
  },
  {
    id: "quick-turkey-lettuce-wraps", name: "Turkey Lettuce Wraps", kcal: 310, protein: 34,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Ground turkey (93% lean)", measure: "6 oz" },
      { ingredient: "Butter lettuce leaves", measure: "6 leaves" },
      { ingredient: "Taco seasoning", measure: "1 tbsp" },
      { ingredient: "Salsa", measure: "1/4 cup" },
    ],
    instructions: "Brown the ground turkey in a nonstick pan over medium heat, breaking it up as it cooks. Stir in taco seasoning and a splash of water, simmer 2 minutes. Spoon into lettuce leaves and top with salsa.",
  },
  {
    id: "quick-salmon-asparagus", name: "Baked Salmon & Asparagus", kcal: 390, protein: 38,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Salmon fillet", measure: "6 oz" },
      { ingredient: "Asparagus", measure: "1 bunch" },
      { ingredient: "Lemon", measure: "1/2, sliced" },
      { ingredient: "Olive oil", measure: "1 tsp" },
      { ingredient: "Salt & pepper", measure: "to taste" },
    ],
    instructions: "Preheat oven to 400°F. Place salmon and asparagus on a lined sheet pan, drizzle with olive oil, season with salt and pepper, and top with lemon slices. Bake 12-15 minutes until the salmon flakes easily.",
  },
  {
    id: "quick-egg-white-scramble", name: "Egg White & Spinach Scramble", kcal: 220, protein: 28,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Egg whites", measure: "1.5 cups" },
      { ingredient: "Baby spinach", measure: "2 cups" },
      { ingredient: "Feta cheese", measure: "2 tbsp" },
      { ingredient: "Black pepper", measure: "to taste" },
    ],
    instructions: "Heat a nonstick pan over medium heat. Wilt the spinach for a minute, then pour in the egg whites and scramble until just set. Fold in feta and finish with black pepper.",
  },
  {
    id: "quick-tuna-white-bean-salad", name: "Tuna & White Bean Salad", kcal: 350, protein: 35,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Canned tuna in water, drained", measure: "1 can (5 oz)" },
      { ingredient: "White beans, drained", measure: "1 cup" },
      { ingredient: "Red onion, diced", measure: "2 tbsp" },
      { ingredient: "Lemon juice", measure: "1 tbsp" },
      { ingredient: "Olive oil", measure: "1 tsp" },
    ],
    instructions: "Combine the tuna, white beans and red onion in a bowl. Dress with lemon juice and olive oil, season with salt and pepper, and toss to combine. Serve cold.",
  },
  {
    id: "quick-cottage-cheese-pineapple", name: "Cottage Cheese & Pineapple", kcal: 200, protein: 25,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Low-fat cottage cheese", measure: "1 cup" },
      { ingredient: "Pineapple chunks", measure: "1/2 cup" },
      { ingredient: "Black pepper", measure: "pinch" },
    ],
    instructions: "Spoon the cottage cheese into a bowl, top with pineapple chunks, and finish with a pinch of black pepper for a savory-sweet contrast.",
  },
  {
    id: "quick-shrimp-stir-fry", name: "Shrimp Stir-Fry", kcal: 340, protein: 36,
    category: "High-Protein", area: "Quick Pick", thumb: null, youtube: "",
    ingredients: [
      { ingredient: "Shrimp, peeled & deveined", measure: "8 oz" },
      { ingredient: "Bell peppers, sliced", measure: "1.5 cups" },
      { ingredient: "Soy sauce", measure: "1 tbsp" },
      { ingredient: "Garlic, minced", measure: "2 cloves" },
      { ingredient: "Sesame oil", measure: "1 tsp" },
    ],
    instructions: "Heat sesame oil in a wok or large pan over high heat. Stir-fry garlic and bell peppers for 2 minutes, add shrimp, and cook until pink and opaque, about 3 minutes. Finish with soy sauce and toss.",
  },
];

function IconChefHat({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
}

async function mealDbFilterByIngredient(ingredient) {
  const q = ingredient.trim().toLowerCase().replace(/\s+/g, "_");
  if (!q) return [];
  const res = await fetch(`${MEALDB_BASE}/filter.php?i=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Recipe search failed (${res.status})`);
  const data = await res.json();
  return data.meals || [];
}

async function mealDbLookup(id) {
  const res = await fetch(`${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Recipe lookup failed (${res.status})`);
  const data = await res.json();
  const meal = data.meals && data.meals[0];
  if (!meal) return null;
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push({ ingredient: ing.trim(), measure: (measure || "").trim() });
  }
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    thumb: meal.strMealThumb,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    youtube: meal.strYoutube,
    ingredients,
  };
}

function MealPlanningPage({ theme, state, setState }) {
  const s = state && state.likedIngredients ? state : DEFAULT_MEAL_PLANNING;
  const [ingredientInput, setIngredientInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function addIngredient() {
    const v = ingredientInput.trim();
    if (!v || s.likedIngredients.includes(v)) return;
    setState({ ...s, likedIngredients: [...s.likedIngredients, v] });
    setIngredientInput("");
  }
  function removeIngredient(ing) {
    setState({ ...s, likedIngredients: s.likedIngredients.filter((i) => i !== ing) });
  }

  async function findRecipes() {
    if (s.likedIngredients.length === 0) return;
    setSearching(true);
    setSearchError("");
    setResults(null);
    try {
      const lists = await Promise.all(s.likedIngredients.map((ing) => mealDbFilterByIngredient(ing).catch(() => [])));
      const byId = new Map();
      lists.forEach((meals) => {
        meals.forEach((m) => {
          const existing = byId.get(m.idMeal);
          if (existing) existing.matchCount += 1;
          else byId.set(m.idMeal, { id: m.idMeal, name: m.strMeal, thumb: m.strMealThumb, matchCount: 1 });
        });
      });
      const ranked = Array.from(byId.values()).sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name));
      if (ranked.length === 0) {
        setSearchError("No recipes matched those ingredients — try a more common one (e.g. chicken, rice, tomato).");
      }
      setResults(ranked.slice(0, 40));
    } catch (err) {
      setSearchError(err.message || "Couldn't reach the recipe service.");
    } finally {
      setSearching(false);
    }
  }

  async function openDetail(id) {
    const quick = QUICK_MEALS.find((m) => m.id === id);
    if (quick) { setDetail(quick); return; }
    setDetailLoading(true);
    setDetail(null);
    try {
      const full = await mealDbLookup(id);
      setDetail(full);
    } catch (err) {
      setDetail({ error: err.message || "Couldn't load that recipe." });
    } finally {
      setDetailLoading(false);
    }
  }

  function openQuickDetail(meal) {
    setDetail(meal);
  }

  function saveRecipe(recipe) {
    if (s.savedRecipes.some((r) => r.id === recipe.id)) return;
    setState({ ...s, savedRecipes: [...s.savedRecipes, { id: recipe.id, name: recipe.name, thumb: recipe.thumb, kcal: recipe.kcal, protein: recipe.protein }] });
  }
  function unsaveRecipe(id) {
    setState({
      ...s,
      savedRecipes: s.savedRecipes.filter((r) => r.id !== id),
      weeklyPlan: Object.fromEntries(Object.entries(s.weeklyPlan).filter(([, v]) => v !== id)),
    });
  }
  function assignDay(day, recipeId) {
    setState({ ...s, weeklyPlan: { ...s.weeklyPlan, [day]: recipeId || undefined } });
  }

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme}>
        <SectionLabel theme={theme} icon={<IconChefHat size={16} />}>
          Foods you like
        </SectionLabel>
        <p style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "12px" }}>
          Add ingredients you like, then generate recipes that use as many of them as possible.
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <input
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
            placeholder="e.g. chicken, rice, garlic…"
            className="v-input"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={addIngredient}
            className="v-btn"
            style={{ fontSize: "13px", fontWeight: 700, color: theme.accentText, background: theme.accent, border: "none", borderRadius: "8px", padding: "9px 16px", flexShrink: 0 }}
          >
            Add
          </button>
        </div>
        {s.likedIngredients.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {s.likedIngredients.map((ing) => (
              <span
                key={ing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.text,
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "999px",
                  padding: "5px 6px 5px 12px",
                }}
              >
                {ing}
                <button onClick={() => removeIngredient(ing)} className="v-btn" style={{ fontSize: "14px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 6px", cursor: "pointer" }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={findRecipes}
          disabled={s.likedIngredients.length === 0 || searching}
          className="v-btn"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: theme.accentText,
            background: theme.accent,
            border: "none",
            borderRadius: "999px",
            padding: "9px 18px",
            opacity: s.likedIngredients.length === 0 ? 0.5 : 1,
          }}
        >
          {searching ? "Searching…" : "Find recipes"}
        </button>
        {searchError && <div style={{ fontSize: "12.5px", color: theme.danger, marginTop: "10px" }}>{searchError}</div>}
      </Card>

      <Card theme={theme}>
        <SectionLabel theme={theme} icon={<IconChefHat size={16} />}>Quick picks — high protein, low calorie</SectionLabel>
        <p style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "12px" }}>
          Built-in, no search needed — each one is 3-5 ingredients and 200-450 calories.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
          {QUICK_MEALS.map((m) => (
            <button
              key={m.id}
              onClick={() => openQuickDetail(m)}
              className="v-btn"
              style={{ display: "flex", flexDirection: "column", textAlign: "left", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", overflow: "hidden", padding: 0 }}
            >
              <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: theme.chip, color: theme.accent }}>
                <IconChefHat size={26} />
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{m.name}</div>
                <div style={{ fontSize: "11px", color: theme.accent, marginTop: "4px", fontWeight: 600 }}>
                  {m.kcal} kcal · {m.protein}g protein
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {results && results.length > 0 && (
        <Card theme={theme}>
          <SectionLabel theme={theme}>
            {results.length} recipe{results.length === 1 ? "" : "s"} found
          </SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => openDetail(r.id)}
                className="v-btn"
                style={{ display: "flex", flexDirection: "column", textAlign: "left", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", overflow: "hidden", padding: 0 }}
              >
                <img src={r.thumb} alt="" loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{r.name}</div>
                  <div style={{ fontSize: "11px", color: theme.accent, marginTop: "4px", fontWeight: 600 }}>
                    Matches {r.matchCount} of {s.likedIngredients.length}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card theme={theme}>
        <SectionLabel theme={theme}>Saved recipes</SectionLabel>
        {s.savedRecipes.length === 0 ? (
          <p style={{ fontSize: "13px", color: theme.textFaint }}>Save a recipe from your search results to plan meals with it.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {s.savedRecipes.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px" }}>
                {r.thumb ? (
                  <img src={r.thumb} alt="" loading="lazy" decoding="async" style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ width: "36px", height: "36px", borderRadius: "6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: theme.chip, color: theme.accent }}>
                    <IconChefHat size={16} />
                  </span>
                )}
                <button
                  onClick={() => openDetail(r.id)}
                  className="v-btn"
                  style={{ flex: 1, textAlign: "left", fontSize: "13.5px", color: theme.text, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                >
                  {r.name}
                  {r.kcal != null && <span style={{ fontSize: "11px", color: theme.textFaint, marginLeft: "8px" }}>{r.kcal} kcal · {r.protein}g protein</span>}
                </button>
                <button onClick={() => unsaveRecipe(r.id)} className="v-btn" style={{ fontSize: "16px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {s.savedRecipes.length > 0 && (
        <Card theme={theme}>
          <SectionLabel theme={theme}>Weekly plan</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
            {WEEK_DAYS.map((d) => (
              <div key={d.id}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>{d.label}</div>
                <select
                  value={s.weeklyPlan[d.id] || ""}
                  onChange={(e) => assignDay(d.id, e.target.value)}
                  className="v-input"
                  style={{ ...inputStyle, width: "100%", fontSize: "12px", padding: "7px 8px" }}
                >
                  <option value="">—</option>
                  {s.savedRecipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(detail || detailLoading) && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px 16px", background: "rgba(0,0,0,0.5)", overflowY: "auto" }}
        >
          <div className="v-scroll" style={{ width: "100%", maxWidth: "560px", maxHeight: "88vh", overflowY: "auto", ...cardBackgroundStyle(theme), background: theme.cardBg, padding: "22px" }}>
            {detailLoading ? (
              <p style={{ fontSize: "14px", color: theme.textMuted }}>Loading recipe…</p>
            ) : detail.error ? (
              <>
                <p style={{ fontSize: "14px", color: theme.danger, marginBottom: "14px" }}>{detail.error}</p>
                <button
                  onClick={() => setDetail(null)}
                  className="v-btn"
                  style={{ fontSize: "13px", fontWeight: 700, color: theme.text, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "8px", padding: "8px 14px" }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: theme.text }}>{detail.name}</h3>
                    <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>{[detail.category, detail.area].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="v-btn"
                    style={{ fontSize: "20px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
                {detail.thumb && <img src={detail.thumb} alt="" loading="lazy" decoding="async" style={{ width: "100%", borderRadius: "10px", marginBottom: "14px" }} />}
                <button
                  onClick={() => saveRecipe(detail)}
                  disabled={s.savedRecipes.some((r) => r.id === detail.id)}
                  className="v-btn"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: theme.accentText,
                    background: theme.accent,
                    border: "none",
                    borderRadius: "999px",
                    padding: "8px 16px",
                    marginBottom: "16px",
                    opacity: s.savedRecipes.some((r) => r.id === detail.id) ? 0.5 : 1,
                  }}
                >
                  {s.savedRecipes.some((r) => r.id === detail.id) ? "Saved" : "Save recipe"}
                </button>
                <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Ingredients</div>
                <ul style={{ margin: 0, marginBottom: "16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {detail.ingredients.map((ing, i) => (
                    <li key={i} style={{ fontSize: "13.5px", color: theme.text, display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${theme.divider}`, padding: "4px 0" }}>
                      <span>{ing.ingredient}</span>
                      <span style={{ color: theme.textMuted }}>{ing.measure}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Instructions</div>
                <p style={{ fontSize: "13.5px", color: theme.text, lineHeight: 1.6, whiteSpace: "pre-line", marginBottom: detail.youtube ? "16px" : 0 }}>{detail.instructions}</p>
                {detail.youtube && (
                  <a href={detail.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 700, color: theme.accent }}>
                    Watch on YouTube ↗
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Apple Music has no free public API, so this bridges through Last.fm
// instead: if plays are scrobbled there (Apple Music can do this via a free
// iOS Shortcut, or any of several third-party scrobbler apps), Last.fm's
// read API — free, keyed per-app, no OAuth — surfaces now-playing, recent
// history, and top artists. The username + API key are supplied by the user
// and stored like any other local integration credential (see
// integrations.googleClientId above).
const DEFAULT_LASTFM = { username: "", apiKey: "", cache: null, fetchedAt: null };
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";

function lastfmImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const preferred = images.find((i) => i.size === "extralarge") || images.find((i) => i.size === "large") || images[images.length - 1];
  return preferred && preferred["#text"] ? preferred["#text"] : null;
}

async function lastfmRequest(method, params, apiKey) {
  const url = new URL(LASTFM_API_BASE);
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.error) {
    throw new Error((json && json.message) || `Last.fm request failed (${res.status})`);
  }
  return json;
}

async function fetchLastfmData(username, apiKey) {
  const [recentJson, topJson, infoJson] = await Promise.all([
    lastfmRequest("user.getrecenttracks", { user: username, limit: "12" }, apiKey),
    lastfmRequest("user.gettopartists", { user: username, period: "7day", limit: "6" }, apiKey),
    lastfmRequest("user.getinfo", { user: username }, apiKey),
  ]);

  const rawTracks = recentJson.recenttracks && recentJson.recenttracks.track;
  const tracks = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : [];
  const nowPlayingRaw = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
  const historyRaw = tracks.filter((t) => !(t["@attr"] && t["@attr"].nowplaying === "true"));
  const mapTrack = (t) => ({
    name: t.name,
    artist: t.artist ? t.artist["#text"] || t.artist.name || "" : "",
    album: t.album ? t.album["#text"] : "",
    image: lastfmImageUrl(t.image),
    url: t.url,
    playedAt: t.date ? Number(t.date.uts) * 1000 : null,
  });

  const rawArtists = topJson.topartists && topJson.topartists.artist;
  const artists = Array.isArray(rawArtists) ? rawArtists : rawArtists ? [rawArtists] : [];

  return {
    nowPlaying: nowPlayingRaw ? mapTrack(nowPlayingRaw) : null,
    recent: historyRaw.map(mapTrack),
    topArtists: artists.map((a) => ({ name: a.name, playcount: Number(a.playcount) || 0, image: lastfmImageUrl(a.image), url: a.url })),
    scrobbles: infoJson.user ? Number(infoJson.user.playcount) || 0 : null,
    profileUrl: infoJson.user ? infoJson.user.url : null,
  };
}

function MusicPage({ theme, state, setState }) {
  const s = state || DEFAULT_LASTFM;
  const [username, setUsername] = useState(s.username || "");
  const [apiKey, setApiKey] = useState(s.apiKey || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const connected = !!(s.username && s.apiKey);

  async function refresh(uname, key) {
    setBusy(true);
    setError(null);
    try {
      const cache = await fetchLastfmData(uname, key);
      setState({ username: uname, apiKey: key, cache, fetchedAt: Date.now() });
    } catch (e) {
      setError(e.message || "Couldn't reach Last.fm.");
    } finally {
      setBusy(false);
    }
  }

  function connect() {
    const u = username.trim();
    const k = apiKey.trim();
    if (!u || !k) {
      setError("Enter both your Last.fm username and API key.");
      return;
    }
    refresh(u, k);
  }

  function disconnect() {
    setState(DEFAULT_LASTFM);
    setUsername("");
    setApiKey("");
    setError(null);
  }

  useEffect(() => {
    if (connected && (!s.fetchedAt || Date.now() - s.fetchedAt > 5 * 60 * 1000)) {
      refresh(s.username, s.apiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  if (!connected) {
    return (
      <Card theme={theme}>
        <SectionLabel theme={theme} icon={<IconMusic />}>Connect Last.fm</SectionLabel>
        <div style={{ fontSize: "12.5px", color: theme.textMuted, lineHeight: 1.5, marginBottom: "16px" }}>
          Apple Music has no free public API, so this bridges through Last.fm instead. Scrobble your plays there —
          via a free iOS Shortcut, or a scrobbler app for Apple Music — then connect your Last.fm account below.
          Get a free API key at{" "}
          <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>
            last.fm/api/account/create
          </a>{" "}
          (any app name works — nothing needs to be published).
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "360px" }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            placeholder="Last.fm username"
            className="v-input"
            style={inputStyle}
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            placeholder="Last.fm API key"
            className="v-input"
            style={inputStyle}
          />
          <MoButton theme={theme} variant="primary" onClick={connect} disabled={busy} style={{ alignSelf: "flex-start" }}>
            {busy ? "Connecting…" : "Connect"}
          </MoButton>
        </div>
        {error && <div style={{ fontSize: "12px", color: theme.danger, marginTop: "12px" }}>{error}</div>}
      </Card>
    );
  }

  const data = s.cache;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <SectionLabel theme={theme} icon={<IconMusic />} style={{ marginBottom: 0 }}>
            {s.username}'s Last.fm
          </SectionLabel>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {data && data.fetchedAt !== undefined && (
              <span style={{ fontSize: "11px", color: theme.textFaint }}>{s.fetchedAt ? `Updated ${timeAgo(s.fetchedAt)}` : ""}</span>
            )}
            <button onClick={() => refresh(s.username, s.apiKey)} disabled={busy} className="v-btn" style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}>
              {busy ? "Refreshing…" : "Refresh"}
            </button>
            <button onClick={disconnect} className="v-btn" style={{ fontSize: "11.5px", fontWeight: 700, color: theme.text, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}>
              Disconnect
            </button>
          </div>
        </div>
        {error && <div style={{ fontSize: "12px", color: theme.danger, marginBottom: "12px" }}>{error}</div>}
        {data && data.scrobbles != null && (
          <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: data.nowPlaying ? "14px" : 0 }}>
            {data.scrobbles.toLocaleString()} total scrobbles
            {data.profileUrl && (
              <>
                {" "}
                &middot;{" "}
                <a href={data.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>
                  view profile
                </a>
              </>
            )}
          </div>
        )}
        {data && data.nowPlaying && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center", background: theme.accentSoft, border: `1px solid ${theme.accent}`, borderRadius: "12px", padding: "10px 12px" }}>
            {data.nowPlaying.image ? (
              <img src={data.nowPlaying.image} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", flexShrink: 0, background: theme.chip }} />
            ) : (
              <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: theme.progressTrack, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.accent, flexShrink: 0, animation: "v-pulse 1.6s ease-in-out infinite" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.04em" }}>Now playing</span>
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{data.nowPlaying.name}</div>
              <div style={{ fontSize: "12px", color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.nowPlaying.artist}</div>
            </div>
          </div>
        )}
      </Card>

      {data && data.topArtists && data.topArtists.length > 0 && (
        <Card theme={theme}>
          <SectionLabel theme={theme}>Top artists this week</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {data.topArtists.map((a) => (
              <a
                key={a.name}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.chip, border: `1px solid ${theme.cardBorder}`, borderRadius: "999px", padding: "6px 12px 6px 6px", textDecoration: "none" }}
              >
                {a.image ? (
                  <img src={a.image} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} style={{ width: "26px", height: "26px", objectFit: "cover", borderRadius: "50%", flexShrink: 0, background: theme.progressTrack }} />
                ) : (
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: theme.progressTrack, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: theme.text }}>{a.name}</span>
                <span style={{ fontSize: "11px", color: theme.textFaint }}>{a.playcount}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card theme={theme}>
        <SectionLabel theme={theme}>Recently played</SectionLabel>
        {data && data.recent.length === 0 ? (
          <div style={{ fontSize: "13px", color: theme.textFaint }}>No scrobbles found yet — play something and it'll show up here.</div>
        ) : (
          <div className="v-scroll" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
            {data &&
              data.recent.map((t, i) => (
                <a
                  key={`${t.name}-${t.playedAt || i}`}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", gap: "10px", alignItems: "center", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", padding: "8px 10px", textDecoration: "none" }}
                >
                  {t.image ? (
                    <img src={t.image} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0, background: theme.chip }} />
                  ) : (
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: theme.progressTrack, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: theme.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ fontSize: "11.5px", color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.artist}
                      {t.playedAt ? ` · ${timeAgo(t.playedAt)}` : ""}
                    </div>
                  </div>
                </a>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   SMALL BUILDING BLOCKS
---------------------------------------------------------------------- */

/* ----------------------------------------------------------------------
   Theme -> CSS custom properties bridge.

   The app styles almost everything with inline styles off the `theme`
   object, but three things live outside those React subtrees and still
   need theme colors: <body> (so iOS overscroll matches the page instead
   of flashing white), portalled overlays rendered into document.body,
   and the shared stylesheet itself. Publishing the tokens on :root gives
   all three access, and lets CSS handle what CSS is good at.

   data-scheme drives the elevation ramp and `color-scheme`, the latter
   being what makes native controls (date pickers, selects, scrollbars)
   render correctly on the dark themes instead of white-on-white.
---------------------------------------------------------------------- */
function vLuminance(color) {
  const hex = String(color || "").trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
// Light text means the theme paints a dark UI. Falls back to the page
// background when `text` isn't a plain hex, then to "dark".
function isDarkTheme(theme) {
  const t = vLuminance(theme && theme.text);
  if (t != null) return t > 0.5;
  const bg = vLuminance(theme && theme.pageBg);
  if (bg != null) return bg < 0.5;
  return true;
}
const THEME_VAR_MAP = {
  "--v-page-bg": "pageBg",
  "--v-text": "text",
  "--v-text-muted": "textMuted",
  "--v-text-faint": "textFaint",
  "--v-card-border": "cardBorder",
  "--v-card-shadow": "cardShadow",
  "--v-card-radius": "cardRadius",
  "--v-section-label": "sectionLabelColor",
  "--v-accent": "accent",
  "--v-accent-text": "accentText",
  "--v-accent-soft": "accentSoft",
  "--v-accent-on": "accentOn",
  "--v-divider": "divider",
  "--v-input-bg": "inputBg",
  "--v-input-border": "inputBorder",
  "--v-input-text": "inputText",
  "--v-danger": "danger",
  "--v-danger-soft": "dangerSoft",
  "--v-chip": "chip",
  "--v-chip-text": "chipText",
  "--v-positive": "positive",
  "--v-progress-track": "progressTrack",
  "--v-progress-fill": "progressFill",
  "--v-rail-bg": "themeBarBg",
  "--v-rail-border": "themeBarBorder",
  "--v-font-sans": "fontSans",
  "--v-font-display": "fontDisplay",
  "--v-rail-gap": "railGap",
  "--v-rail-radius": "railRadius",
  "--v-rail-shadow": "railShadow",
};
// Bricolage Grotesque is only used by the Aurora Glass theme's --v-font-display.
// Loading it as a real file (fetched on demand) instead of embedding it as a
// base64 @font-face in the static shell CSS keeps the other 27 themes from
// paying ~30KB of critical-path payload for a font they never render.
let __auroraFontInjected = false;
function ensureAuroraFont() {
  if (__auroraFontInjected || typeof document === "undefined") return;
  __auroraFontInjected = true;
  const style = document.createElement("style");
  style.textContent = '@font-face{font-family:"Bricolage Grotesque";font-weight:700;font-style:normal;font-display:swap;src:url("bricolage-grotesque-700.woff2") format("woff2");}';
  document.head.appendChild(style);
}

function applyThemeVars(theme) {
  if (typeof document === "undefined" || !theme) return;
  const root = document.documentElement;
  Object.keys(THEME_VAR_MAP).forEach((cssVar) => {
    const val = theme[THEME_VAR_MAP[cssVar]];
    if (val != null) root.style.setProperty(cssVar, String(val));
  });
  root.setAttribute("data-scheme", isDarkTheme(theme) ? "dark" : "light");
  if (theme.fontDisplay) ensureAuroraFont();
}

// Put the cursor on the field the user has to fix. Paired with a message,
// never instead of one: focus alone is easy to miss, a message alone leaves
// them hunting for which box was wrong.
function focusField(id) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("v-field-" + id);
  if (el && typeof el.focus === "function") el.focus({ preventScroll: false });
}

function cardBackgroundStyle(theme) {
  const style = {
    border: "1px solid var(--v-edge)",
    borderRadius: "var(--r-card)",
    boxShadow: "var(--sh-card)",
  };
  if (theme.cardStyle === "gradient") {
    style.backgroundImage = theme.cardBg;
    style.backgroundColor = "rgba(255,255,255,0.03)";
  } else {
    style.background = theme.cardBg;
  }
  if (theme.blur) {
    style.backdropFilter = "blur(18px)";
    style.WebkitBackdropFilter = "blur(18px)";
  }
  return style;
}

/* ----------------------------------------------------------------------
   Shared empty state.

   Every section had rolled its own centred grey sentence. This gives them
   one voice and a little warmth: a small line-art illustration drawn from
   theme tokens (inline SVG — nothing to fetch, nothing to break offline),
   a title, an optional hint, and an optional action slot.
---------------------------------------------------------------------- */
function EmptyArt({ kind, theme }) {
  const stroke = theme.textFaint;
  const glow = theme.accentSoft;
  const accent = theme.accent;
  const common = { width: 72, height: 72, viewBox: "0 0 72 72", fill: "none" };
  const art = {
    habits: (
      <g>
        <rect x="14" y="20" width="44" height="36" rx="7" stroke={stroke} strokeWidth="2" />
        <path d="M22 14v8M50 14v8" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M14 31h44" stroke={stroke} strokeWidth="2" />
        <rect x="21" y="37" width="8" height="8" rx="2.5" fill={glow} />
        <rect x="32" y="37" width="8" height="8" rx="2.5" fill={glow} />
        <path d="M44.5 41.5l2.6 2.6 5-5.4" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    books: (
      <g>
        <path d="M15 18h16a6 6 0 0 1 6 6v29a5 5 0 0 0-5-4H15z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <path d="M57 18H41a6 6 0 0 0-6 6v29a5 5 0 0 1 5-4h17z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <rect x="43" y="26" width="10" height="3" rx="1.5" fill={glow} />
        <rect x="43" y="33" width="7" height="3" rx="1.5" fill={glow} />
      </g>
    ),
    games: (
      <g>
        <rect x="10" y="25" width="52" height="26" rx="12" stroke={stroke} strokeWidth="2" />
        <path d="M22 33v10M17 38h10" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <circle cx="47" cy="35.5" r="2.6" fill={glow} />
        <circle cx="53" cy="42" r="2.6" fill={accent} />
      </g>
    ),
    gift: (
      <g>
        <rect x="14" y="30" width="44" height="10" rx="3" stroke={stroke} strokeWidth="2" />
        <path d="M18 40v14a3 3 0 0 0 3 3h30a3 3 0 0 0 3-3V40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M36 30v27" stroke={stroke} strokeWidth="2" />
        <path d="M36 30s-4-11-9.5-8.4S31 30 36 30zm0 0s4-11 9.5-8.4S41 30 36 30z" stroke={accent} strokeWidth="2" strokeLinejoin="round" fill={glow} />
      </g>
    ),
    money: (
      <g>
        <rect x="12" y="22" width="48" height="30" rx="6" stroke={stroke} strokeWidth="2" />
        <path d="M12 32h48" stroke={stroke} strokeWidth="2" />
        <rect x="19" y="40" width="13" height="4" rx="2" fill={glow} />
        <circle cx="50" cy="42" r="4" fill={glow} stroke={accent} strokeWidth="1.6" />
      </g>
    ),
    golf: (
      <g>
        <path d="M27 52V16l20 8-20 7.6" stroke={stroke} strokeWidth="2" strokeLinejoin="round" fill={glow} />
        <ellipse cx="36" cy="55" rx="15" ry="4" stroke={stroke} strokeWidth="2" />
        <circle cx="45" cy="52" r="3.4" fill={accent} />
      </g>
    ),
    search: (
      <g>
        <circle cx="32" cy="32" r="15" stroke={stroke} strokeWidth="2" />
        <path d="M43 43l11 11" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy="32" r="8" fill={glow} />
      </g>
    ),
  };
  return <svg {...common} aria-hidden="true">{art[kind] || art.search}</svg>;
}

function EmptyState({ theme, art = "search", title, message, action }) {
  return (
    <div className="v-empty">
      <EmptyArt kind={art} theme={theme} />
      <div className="v-empty__title" style={{ color: theme.text }}>{title}</div>
      {message && <div className="v-empty__msg" style={{ color: theme.textFaint }}>{message}</div>}
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------------
   Toasts / alerts.

   A module-level pub-sub rather than React context: any function anywhere in
   this file can call toast.success(...) without threading a provider through
   a 24-tab component tree. The host subscribes once and portals to <body>.
---------------------------------------------------------------------- */
const __toastListeners = new Set();
let __toastItems = [];
let __toastSeq = 0;

function __toastEmit() {
  const snapshot = __toastItems.slice();
  __toastListeners.forEach((fn) => fn(snapshot));
}
function dismissToast(id) {
  __toastItems = __toastItems.filter((t) => t.id !== id);
  __toastEmit();
}
function showToast(opts) {
  const o = typeof opts === "string" ? { message: opts } : opts || {};
  const id = "t" + ++__toastSeq;
  const item = {
    id,
    kind: o.kind || "info",
    title: o.title || "",
    message: o.message || "",
    action: o.action || null, // { label, onClick }
    duration: o.duration == null ? (o.kind === "error" ? 7000 : 4500) : o.duration,
  };
  // Newest first, and keep the stack from growing without bound.
  __toastItems = [item, ...__toastItems].slice(0, 4);
  __toastEmit();
  if (item.duration > 0) setTimeout(() => dismissToast(id), item.duration);
  return id;
}
// A delete you can take back. The label names the thing in the sentence
// "Deleted X." — quote it if it is a user-supplied name.
function toastUndo(label, restore) {
  toast.show({
    message: "Deleted " + label + ".",
    duration: 8000,
    action: { label: "Undo", onClick: restore },
  });
}

const toast = {
  show: showToast,
  info: (m, o) => showToast({ ...(o || {}), message: m, kind: "info" }),
  success: (m, o) => showToast({ ...(o || {}), message: m, kind: "success" }),
  error: (m, o) => showToast({ ...(o || {}), message: m, kind: "error" }),
  warn: (m, o) => showToast({ ...(o || {}), message: m, kind: "warn" }),
  reminder: (m, o) => showToast({ ...(o || {}), message: m, kind: "reminder" }),
  dismiss: dismissToast,
};

function ToastIcon({ kind, size = 16 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "success") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>;
  if (kind === "error") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>;
  if (kind === "warn") return <svg {...common}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.01" /></svg>;
  if (kind === "reminder") return <svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10.5 20a2 2 0 0 0 3 0" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></svg>;
}

function ToastHost({ theme }) {
  const [items, setItems] = useState(__toastItems);
  useEffect(() => {
    __toastListeners.add(setItems);
    return () => { __toastListeners.delete(setItems); };
  }, []);
  if (typeof document === "undefined") return null;

  const tone = (kind) => {
    if (kind === "success") return theme.positive;
    if (kind === "error") return theme.danger;
    if (kind === "warn") return "#f59e0b";
    if (kind === "reminder") return theme.accent;
    return theme.accent;
  };

  return ReactDOM.createPortal(
    <div className="v-toasts" role="region" aria-label="Notifications">
      {items.map((t) => (
        <div
          key={t.id}
          className="v-toast"
          role={t.kind === "error" ? "alert" : "status"}
          aria-live={t.kind === "error" ? "assertive" : "polite"}
          style={{ ...cardBackgroundStyle(theme), "--toast-tone": tone(t.kind) }}
        >
          <span className="v-toast__bar" />
          <span className="v-toast__icon" style={{ color: tone(t.kind) }}>
            <ToastIcon kind={t.kind} />
          </span>
          <span className="v-toast__body">
            {t.title && <span className="v-toast__title" style={{ color: theme.text }}>{t.title}</span>}
            <span className="v-toast__msg" style={{ color: t.title ? theme.textMuted : theme.text }}>{t.message}</span>
          </span>
          {t.action && (
            <button
              className="v-btn v-toast__action"
              onClick={() => { try { t.action.onClick(); } finally { dismissToast(t.id); } }}
              style={{ color: tone(t.kind), background: theme.accentSoft }}
            >
              {t.action.label}
            </button>
          )}
          <button
            className="v-btn v-iconbtn v-toast__close"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            style={{ color: theme.textMuted }}
          >
            <IconClose size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

// Which card label each page repeats in its own header. Keyed by page so the
// same component keeps its label on Home, where nothing else names the card.
const REDUNDANT_SECTION_LABELS = {
  fitness: ["Fitness"],
  golf: ["Golf"],
  financial: ["Financial"],
  transactions: ["Transactions"],
  upcoming: ["Upcoming"],
  weather: ["Weather"],
  agenda: ["7-Day Agenda"],
  youtube: ["YouTube Updates"],
  profile: ["About Me"],
  resume: ["Resume"],
  watchlist: ["Watch List"],
  trackers: ["Custom Trackers"],
  goals: ["Life Goals"],
  videos: ["Fitness Videos"],
  journal: ["Journal"],
  habits: ["Habits"],
  birthdays: ["Birthdays & Gifts"],
  reading: ["Reading"],
  games: ["Games"],
  subscriptions: ["Subscriptions"],
  movies: ["Movies & TV"],
  gaming: ["Gaming"],
};

const PageIdContext = createContext("");

// Only plain text can be compared; a label built out of elements or counts is
// left alone rather than guessed at.
function sectionLabelText(children) {
  if (typeof children === "string") return children.trim();
  if (Array.isArray(children) && children.every((c) => typeof c === "string" || typeof c === "number")) {
    return children.join("").trim();
  }
  return null;
}

function SectionLabel({ theme, icon, children, style, className }) {
  const pageId = useContext(PageIdContext);
  const flat = sectionLabelText(children);
  const redundant = REDUNDANT_SECTION_LABELS[pageId];
  if (flat && redundant && redundant.indexOf(flat) !== -1) return null;
  return (
    <div
      className={"v-sectionlabel" + (className ? " " + className : "")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: theme.sectionLabelColor,
        marginBottom: "12px",
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

// options: [{ id, label }] or [[id, label], ...] — both shapes exist in the
// call sites this replaced, so both are accepted rather than rewritten.
function Segmented({ theme, value, onChange, options, ariaLabel, size, style }) {
  const items = (options || []).map((o) => (Array.isArray(o) ? { id: o[0], label: o[1] } : o));
  return (
    <div
      className={"v-segmented" + (size === "sm" ? " v-segmented--sm" : "")}
      role="tablist"
      aria-label={ariaLabel}
      style={{ background: theme.chip, borderColor: "var(--v-edge)", ...style }}
    >
      {items.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={"v-btn v-segmented__seg" + (on ? " is-on" : "")}
            style={on
              ? { background: theme.cardBg, color: theme.text }
              : { background: "transparent", color: theme.textMuted }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Card({ theme, children, style, delay = 0 }) {
  return (
    <div
      className="v-card"
      style={{
        ...cardBackgroundStyle(theme),
        padding: "var(--pad-card)",
        animationDelay: `${delay}ms`,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Metric({ theme, label, value, suffix, prefix, formatDisplay, editable, onChange, inputType, autoOpen }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Deep-link quick actions (e.g. #fitness/log-weight) land here to jump
  // straight into editing without the user hunting for the field.
  useEffect(() => {
    if (autoOpen && editable) setEditing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  function commit() {
    setEditing(false);
    if (draft === "" || draft === value) return;
    onChange(draft);
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div
        className="v-metric__label"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: "6px",
          lineHeight: 1.3,
          minHeight: "2.6em",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {label}
      </div>
      {editable && editing ? (
        <input
          autoFocus
          type={inputType || "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="v-input v-tabular"
          style={{
            width: "100%",
            fontSize: "26px",
            fontWeight: 700,
            color: theme.inputText,
            background: theme.inputBg,
            border: `1px solid ${theme.accent}`,
            borderRadius: "8px",
            padding: "4px 8px",
            "--focus-ring": theme.accentSoft,
            "--focus-border": theme.accent,
          }}
        />
      ) : (
        <div
          onClick={() => editable && setEditing(true)}
          title={editable ? "Click to edit" : undefined}
          className="v-tabular"
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: theme.text,
            cursor: editable ? "text" : "default",
            lineHeight: 1.15,
            wordBreak: "break-word",
          }}
        >
          {prefix}
          {formatDisplay ? formatDisplay(value) : value}
          {suffix ? (
            <span style={{ fontSize: "15px", fontWeight: 600, color: theme.textMuted, marginLeft: "4px" }}>
              {suffix}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MetricGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "20px",
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ theme, from, to, current }) {
  const span = Math.abs(from - to) || 1;
  const progressed = Math.min(Math.max((from - current) / (from - to), 0), 1);
  const pct = Math.round(progressed * 100);
  return (
    <div style={{ marginTop: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          fontWeight: 600,
          color: theme.textMuted,
          marginBottom: "6px",
        }}
      >
        <span>Progress to target</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: "8px",
          borderRadius: "999px",
          background: theme.progressTrack,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "999px",
            backgroundImage:
              typeof theme.progressFill === "string" && theme.progressFill.includes("gradient")
                ? theme.progressFill
                : undefined,
            background: theme.progressFill,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ theme, data, label, width = 130, height = 34, goodDirection = "down" }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ marginTop: "16px", fontSize: "11px", color: theme.textFaint }}>
        Trend appears after a couple more updates.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 4;
  const points = data
    .map((d, i) => {
      const x = i * stepX;
      const y = pad + (1 - (d.value - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = (data.length - 1) * stepX;
  const lastY = pad + (1 - (values[values.length - 1] - min) / range) * (height - pad * 2);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = Math.round((last - first) * 10) / 10;
  const improved = goodDirection === "down" ? delta < 0 : delta > 0;
  const worsened = goodDirection === "down" ? delta > 0 : delta < 0;
  const deltaColor = delta === 0 ? theme.textMuted : improved ? theme.positive : worsened ? theme.danger : theme.textMuted;

  return (
    <div style={{ marginTop: "16px" }}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            fontWeight: 600,
            color: theme.textMuted,
            marginBottom: "6px",
          }}
        >
          <span>{label}</span>
          <span style={{ color: deltaColor }}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <polyline points={points} fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r="2.75" fill={theme.accent} />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------------
   ICONS
---------------------------------------------------------------------- */

function IconLogo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18l6-10 4 6 3-4 5 8" />
    </svg>
  );
}

function IconDumbbell() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7v10M2 9v6M18 7v10M22 9v6M6 12h12" />
    </svg>
  );
}

function IconGolf() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21V4" />
      <path d="M6 4l10 4-10 4" />
      <ellipse cx="6" cy="21" rx="4" ry="1.4" />
    </svg>
  );
}

function IconFootball({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-40 12 12)" />
      <path d="M8.2 9.5l7.6 5" />
      <path d="M10 8.7l-.7 1.4M12 10l-.7 1.4M14 11.3l-.7 1.4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
    </svg>
  );
}

function IconBulb({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  );
}

function IconYoutube({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconChecklist({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </svg>
  );
}

function IconBriefcase({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

function IconClose({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconVideo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <path d="M16 9l6-3v12l-6-3" />
    </svg>
  );
}

function IconShare({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function IconUpload({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconFilm({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 15h18M8 4v16M16 4v16" />
    </svg>
  );
}

function IconWallet({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h5" />
    </svg>
  );
}

function IconBookOpen({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6c-2-1.5-5-2-8-1v13c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1z" />
      <path d="M12 6v13" />
    </svg>
  );
}

function IconFlag({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4.5L18 13H5" />
    </svg>
  );
}

function IconReceipt({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

/* ----------------------------------------------------------------------
   VIDEO LIBRARY STORAGE
   Video files are stored in IndexedDB (localStorage caps out around
   5-10MB, nowhere near enough for video). Lives in this browser only —
   not backed up, not synced, and excluded from JSON backup/restore.
---------------------------------------------------------------------- */

const VIDEO_DB_NAME = "vantage-videos";
const VIDEO_STORE = "videos";

function openVideoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser doesn't support local video storage."));
      return;
    }
    const req = indexedDB.open(VIDEO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutVideo(record) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readwrite");
    tx.objectStore(VIDEO_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAllVideos() {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readonly");
    const req = tx.objectStore(VIDEO_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteVideo(id) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readwrite");
    tx.objectStore(VIDEO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Golf round scorecard photos — same rationale as video storage above:
// IndexedDB only, local to this browser, excluded from JSON backup.
const PHOTO_DB_NAME = "vantage-golf-photos";
const PHOTO_STORE = "photos";

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser doesn't support local photo storage."));
      return;
    }
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutPhoto(record) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetPhotosByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const db = await openPhotoDB();
  const store = db.transaction(PHOTO_STORE, "readonly").objectStore(PHOTO_STORE);
  const results = await Promise.all(
    ids.map(
      (id) =>
        new Promise((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        })
    )
  );
  return results.filter(Boolean);
}

async function dbDeletePhoto(id) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// iPhones shoot HEIC by default and browsers (Safari included, inconsistently)
// largely can't render it in an <img> tag, so convert to JPEG before it's
// ever staged or stored. MIME type detection for HEIC is unreliable across
// browsers/OSes, so the file extension is checked too.
function isHeicFile(file) {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || "");
}

// Lazily pull heic-to from its CDN only when a HEIC file is actually staged —
// most uploads across the app are already JPEG/PNG, so this no longer has to
// load on every page view for a conversion that rarely triggers.
function loadHeicTo() {
  if (window.HeicTo) return Promise.resolve(window.HeicTo);
  if (window.__heicToPromise) return window.__heicToPromise;
  window.__heicToPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/heic-to@1.5.2/dist/iife/heic-to.js";
    s.integrity = "sha384-cVm8gaWQ5+URpoh6ACKXpm8TuyoHkfIDDBkxvDoUdIZ18w8nV5en0lVQvWMwO/6S";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.HeicTo ? resolve(window.HeicTo) : reject(new Error("HEIC converter failed to initialize.")));
    s.onerror = () => {
      window.__heicToPromise = null;
      reject(new Error("Couldn't load the HEIC converter (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__heicToPromise;
}

async function convertHeicIfNeeded(file) {
  if (!isHeicFile(file)) return file;
  try {
    await loadHeicTo();
    const blob = await window.HeicTo({ blob: file, type: "image/jpeg", quality: 0.85 });
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
  } catch (err) {
    return file;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function extFromType(type) {
  if (!type) return "mp4";
  const parts = type.split("/");
  return parts[1] ? parts[1].split(";")[0] : "mp4";
}

async function shareVideoFile(video, onStatus) {
  const file = new File([video.blob], `${video.title || "video"}.${extFromType(video.type)}`, { type: video.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: video.title || "Fitness video" });
      onStatus({ type: "success", message: "Shared — finish posting inside TikTok." });
    } catch (err) {
      if (err && err.name !== "AbortError") {
        onStatus({ type: "error", message: "Share was cancelled or failed." });
      }
    }
    return;
  }
  const url = URL.createObjectURL(video.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  onStatus({ type: "success", message: "Native share isn't available here — downloaded instead. Upload it in TikTok." });
}

/* ----------------------------------------------------------------------
   SUGGESTIONS ENGINE
   Pure, local, rule-based — no external calls or API keys. Reads profile,
   goal progress, and event dates to produce a short list of nudges.
---------------------------------------------------------------------- */

function generateSuggestions({ fitness, golf, trackers, profile, events, history, weather, watchlist, newYoutubeCount }) {
  const suggestions = [];

  if (newYoutubeCount > 0) {
    suggestions.push({
      id: "s-youtube",
      priority: "info",
      text: `${newYoutubeCount} new video${newYoutubeCount === 1 ? "" : "s"} from channels you're subscribed to.`,
    });
  }

  if (profile.topPicks && profile.topPicks.length > 0) {
    const pick = profile.topPicks[0];
    const free = findFreeWeekendDay(events);
    if (free) {
      const dayWeather = weather && weather.days ? weather.days.find((d) => d.date === free.date) : null;
      if (dayWeather) {
        const info = weatherInfo(dayWeather.code);
        if (info.outdoor) {
          suggestions.push({
            id: "s-freeday",
            priority: "info",
            text: `You're free ${free.label} and it's looking ${info.label.toLowerCase()} (${dayWeather.tempMax}°) — good day for ${pick.toLowerCase()}, your top pick from the quiz.`,
          });
        } else {
          suggestions.push({
            id: "s-freeday",
            priority: "info",
            text: `You're free ${free.label}, but ${info.label.toLowerCase()} is expected (${dayWeather.tempMax}°) — might be worth an indoor alternative to ${pick.toLowerCase()}.`,
          });
        }
      } else {
        suggestions.push({
          id: "s-freeday",
          priority: "info",
          text: `You're free ${free.label} — good day for ${pick.toLowerCase()}, your top pick from the quiz.`,
        });
      }
    } else {
      suggestions.push({
        id: "s-toppick",
        priority: "info",
        text: `You ranked ${pick.toLowerCase()} as a top pick in the quiz — worth making time for it this week.`,
      });
    }
  }

  trackers.forEach((t) => {
    const progress = computeGoalProgress(t.value, t.target);
    const trend = analyzeTrend((history.trackers && history.trackers[t.id]) || []);
    if (progress !== null && trend && trend.status === "flat") {
      suggestions.push({
        id: `s-tracker-${t.id}`,
        priority: "attention",
        text: `${t.label} has held at ${trend.last} for ${trend.spanDays} days (goal ${t.target}) — a push this week would help.`,
      });
    } else if (progress !== null && progress < 50) {
      suggestions.push({
        id: `s-tracker-${t.id}`,
        priority: "attention",
        text: `${t.label} is at ${progress}% of your goal (${t.value}/${t.target}) — a push this week would help.`,
      });
    }
  });

  events.forEach((ev) => {
    const days = daysUntil(ev.date);
    if (days >= 0 && days <= 10) {
      suggestions.push({
        id: `s-event-${ev.id}`,
        priority: days <= 3 ? "urgent" : "attention",
        text: `${ev.title} is in ${days} day${days === 1 ? "" : "s"} (${ev.detail}) — good time to start prepping.`,
      });
    }
  });

  const weightTrend = analyzeTrend(history.fitness, { flatThreshold: 1 });
  if (fitness.currentWeight > fitness.targetWeight) {
    const diff = Math.round((fitness.currentWeight - fitness.targetWeight) * 10) / 10;
    if (weightTrend && weightTrend.status === "flat") {
      suggestions.push({
        id: "s-fitness",
        priority: "attention",
        text: `Weight's held steady around ${fitness.currentWeight} lbs for ${weightTrend.spanDays} days — might be worth mixing up your routine.`,
      });
    } else if (weightTrend && weightTrend.status === "down") {
      suggestions.push({
        id: "s-fitness",
        priority: "positive",
        text: `Down ${Math.abs(weightTrend.delta)} lbs over the last ${weightTrend.spanDays} days — keep it up, ${diff} lbs to go.`,
      });
    } else {
      suggestions.push({
        id: "s-fitness",
        priority: "attention",
        text: `You're ${diff} lbs from your target weight — a cardio session this week would help close the gap.`,
      });
    }
  } else {
    suggestions.push({
      id: "s-fitness",
      priority: "positive",
      text: `You've hit your target weight — nice work. Consider setting a new one.`,
    });
  }

  const handicapTrend = analyzeTrend(history.golf, { flatThreshold: 0.3 });
  if (profile.interests.some((i) => i.toLowerCase().includes("golf"))) {
    if (handicapTrend && handicapTrend.status === "flat") {
      suggestions.push({
        id: "s-golf",
        priority: "attention",
        text: `Handicap's been steady at ${golf.handicap} for ${handicapTrend.spanDays} days — a lesson or range session could break the plateau.`,
      });
    } else if (handicapTrend && handicapTrend.status === "down") {
      suggestions.push({
        id: "s-golf",
        priority: "positive",
        text: `Handicap's down ${Math.abs(handicapTrend.delta)} over the last ${handicapTrend.spanDays} days, now at ${golf.handicap} — booking another round would keep the momentum.`,
      });
    } else {
      suggestions.push({
        id: "s-golf",
        priority: "info",
        text: `Handicap is sitting at ${golf.handicap} — booking a round would keep it sharp.`,
      });
    }
  }

  if (profile.genres && profile.genres.length > 0) {
    const top = profile.genres.slice(0, 2).join(" and ");
    const pick = suggestTitles(profile.genres, watchlist || [], 1)[0];
    suggestions.push({
      id: "s-genre",
      priority: "info",
      text: pick
        ? `You're into ${top} — "${pick.title}" (${pick.type}) could be a good pick this week.`
        : `You're into ${top} — worth checking what's new to watch there this week.`,
    });
  }

  const trackedLabels = trackers.map((t) => t.label.toLowerCase());
  profile.interests.forEach((interest) => {
    const hasTracker = trackedLabels.some((l) => l.includes(interest.toLowerCase()));
    if (!hasTracker && !["golf", "fitness"].includes(interest.toLowerCase())) {
      suggestions.push({
        id: `s-interest-${interest}`,
        priority: "info",
        text: `You listed "${interest}" as an interest — want to add a tracker for it?`,
      });
    }
  });

  return suggestions.slice(0, 5);
}

/* ----------------------------------------------------------------------
   SECTIONS
---------------------------------------------------------------------- */

function FitnessSection({ theme, data, setData, history, onRecordWeight, autoOpenWeight }) {
  return (
    <Card theme={theme} delay={0}>
      <SectionLabel theme={theme} icon={<IconDumbbell />}>Fitness</SectionLabel>
      <MetricGrid>
        <Metric
          theme={theme}
          label="Incline Bench Press"
          value={`${data.benchLbs} × ${data.benchReps}`}
          editable={false}
        />
        <Metric
          theme={theme}
          label="Current Weight"
          value={data.currentWeight}
          suffix="lbs"
          editable
          autoOpen={autoOpenWeight}
          inputType="number"
          onChange={(v) => {
            const next = Number(v) || data.currentWeight;
            setData({ ...data, currentWeight: next });
            onRecordWeight(next);
          }}
        />
        <Metric
          theme={theme}
          label="Target Weight"
          value={data.targetWeight}
          suffix="lbs"
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, targetWeight: Number(v) || data.targetWeight })}
        />
      </MetricGrid>
      <ProgressBar theme={theme} from={225} to={data.targetWeight} current={data.currentWeight} />
      <Sparkline theme={theme} data={history} label="Weight trend" goodDirection="down" />
    </Card>
  );
}

function WorkoutLogSection({ theme, workouts, setWorkouts }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  function addEntry() {
    const ex = exercise.trim();
    if (!ex) { toast.info("Name the exercise first."); focusField("lift-name"); return; }
    if (!sets) { toast.info("How many sets?"); focusField("lift-sets"); return; }
    if (!reps) { toast.info("How many reps?"); focusField("lift-reps"); return; }
    const entry = {
      id: "wo" + Date.now() + Math.random().toString(36).slice(2, 6),
      date: date || new Date().toISOString().slice(0, 10),
      exercise: ex,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: weight === "" ? null : Number(weight) || 0,
    };
    setWorkouts([entry, ...(workouts || [])]);
    setExercise(""); setSets(""); setReps(""); setWeight("");
  }
  function removeEntry(id) {
    const removed = (workouts || []).find((w) => w.id === id);
    setWorkouts((workouts || []).filter((w) => w.id !== id));
    if (removed) {
      toast.show({
        message: `Deleted "${removed.exercise}".`,
        action: { label: "Undo", onClick: () => setWorkouts((cur) => [removed, ...(cur || [])]) },
      });
    }
  }

  const sorted = [...(workouts || [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return (workouts || []).filter((w) => new Date(w.date) >= weekAgo).length;
  }, [workouts]);

  const inputStyle = {
    background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "8px",
    color: theme.inputText, padding: "9px 12px", fontSize: "14px", minWidth: 0,
    "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={30}>
      <SectionLabel theme={theme} icon={<IconDumbbell size={14} />}>Workout Log</SectionLabel>
      <div style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "14px" }}>
        {(workouts || []).length} lift{(workouts || []).length === 1 ? "" : "s"} logged · {thisWeekCount} this week
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px", marginBottom: "16px" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="v-input" style={inputStyle} />
        <input id="v-field-lift-name" value={exercise} onChange={(e) => setExercise(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} placeholder="Exercise" className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }} />
        <input id="v-field-lift-sets" value={sets} onChange={(e) => setSets(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} placeholder="Sets" inputMode="numeric" className="v-input" style={inputStyle} />
        <input id="v-field-lift-reps" value={reps} onChange={(e) => setReps(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} placeholder="Reps" inputMode="numeric" className="v-input" style={inputStyle} />
        <input value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} placeholder="lbs (optional)" inputMode="decimal" className="v-input" style={inputStyle} />
        <button onClick={addEntry} className="v-btn" style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Log it</button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>No lifts logged yet — add one above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "340px", overflowY: "auto" }} className="v-scroll">
          {sorted.map((w) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: theme.textFaint, width: "58px", flexShrink: 0 }}>{new Date(w.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span style={{ fontSize: "13.5px", color: theme.text, flex: 1, minWidth: 0, fontWeight: 600 }}>{w.exercise}</span>
              <span className="v-tabular" style={{ fontSize: "12.5px", color: theme.textMuted, flexShrink: 0 }}>
                {w.sets}×{w.reps}{w.weight != null ? ` @ ${w.weight}lbs` : ""}
              </span>
              <button onClick={() => removeEntry(w.id)} className="v-btn" title="Remove lift" style={{ fontSize: "16px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function GolfSection({ theme, data, setData, history, onRecordHandicap }) {
  return (
    <Card theme={theme} delay={60}>
      <SectionLabel theme={theme} icon={<IconGolf />}>Golf</SectionLabel>
      <MetricGrid>
        <Metric
          theme={theme}
          label="Rounds YTD"
          value={data.roundsYtd}
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, roundsYtd: Number(v) || data.roundsYtd })}
        />
        <Metric
          theme={theme}
          label="Handicap"
          value={data.handicap}
          editable
          inputType="number"
          onChange={(v) => {
            const next = Number(v);
            setData({ ...data, handicap: next });
            onRecordHandicap(next);
          }}
        />
      </MetricGrid>
      <Sparkline theme={theme} data={history} label="Handicap trend" goodDirection="down" />
    </Card>
  );
}

// Golf's hole-by-hole scorecards + simulator/outdoor round logs now ship as
// their own chunk (see loadChunk()/window.__v near the bottom of this file)
// instead of every page's bundle — same rationale and mechanism as Raven's
// Eye. GolfSection above (the small Rounds YTD/Handicap card) stays in core
// since it's tiny and needed the instant the page opens.
function LazyGolfExtras({ theme, golfScorecards, setGolfScorecards, golfSimRounds, setGolfSimRounds, golfOutdoorRounds, setGolfOutdoorRounds }) {
  const [mod, setMod] = useState(() => (window.__vChunks && window.__vChunks.golf) ? window.__vChunks.golf : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("golf", "chunk-golf.js").then(setMod).catch((err) => setError(err.message || "Couldn't load Golf."));
  }

  useEffect(() => {
    if (mod) return;
    let cancelled = false;
    loadChunk("golf", "chunk-golf.js")
      .then((m) => { if (!cancelled) setMod(m); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load Golf."); });
    return () => { cancelled = true; };
  }, [mod]);

  if (error) {
    return (
      <EmptyState
        theme={theme}
        art="golf"
        title="Couldn't load scorecards"
        message={error}
        action={
          <button
            className="v-btn"
            style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700 }}
            onClick={attemptLoad}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (!mod) {
    return <EmptyState theme={theme} art="golf" title="Loading scorecards…" />;
  }
  const { GolfScorecards, GolfRoundLog } = mod;
  return (
    <>
      <GolfScorecards theme={theme} cards={golfScorecards} setCards={setGolfScorecards} delay={0} />
      <GolfRoundLog theme={theme} title="Simulator Rounds" rounds={golfSimRounds} setRounds={setGolfSimRounds} delay={0} />
      <GolfRoundLog theme={theme} title="Outdoor Rounds" rounds={golfOutdoorRounds} setRounds={setGolfOutdoorRounds} delay={0} />
    </>
  );
}
function UpcomingSection({ theme, events, setEvents, connectedEvents }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState("");

  function addEvent() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { toast.info("Give the event a title first."); focusField("event-title"); return; }
    if (!date) { toast.info("Pick a date for the event."); focusField("event-date"); return; }
    const id = "pe" + Date.now() + Math.random().toString(36).slice(2, 6);
    const autoDetail = new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
    setEvents([...events, { id, title: trimmedTitle, date, detail: detail.trim() || autoDetail }]);
    setTitle("");
    setDate("");
    setDetail("");
  }

  function removeEvent(id) {
    const removed = events.find((e) => e.id === id);
    setEvents(events.filter((e) => e.id !== id));
    if (removed) toastUndo(`"${removed.title || "event"}"`, () => setEvents((cur) => [...(cur || []), removed]));
  }

  const merged = (() => {
    const all = [...events, ...connectedEvents];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Today counts as upcoming: a thing happening in four hours belongs above
    // the fold, not under a heading called Earlier.
    const past = (e) => new Date(e.date + "T00:00:00") < today;
    const ahead = all.filter((e) => !past(e)).sort((x, y) => x.date.localeCompare(y.date));
    const behind = all.filter(past).sort((x, y) => y.date.localeCompare(x.date));
    return { ahead, behind, all: [...ahead, ...behind] };
  })();

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "8px 10px",
    fontSize: "12.5px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={120}>
      <SectionLabel theme={theme} icon={<IconCalendar />}>Upcoming</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
        {merged.all.length === 0 && (
          <div style={{ fontSize: "13px", color: theme.textFaint }}>No upcoming events — add one below.</div>
        )}
        {merged.ahead.length === 0 && merged.behind.length > 0 && (
          <div style={{ fontSize: "13px", color: theme.textFaint }}>Nothing ahead — everything below has already happened.</div>
        )}
        {merged.all.map((ev, i) => (
          <React.Fragment key={"g" + ev.id}>
          {i === merged.ahead.length && merged.ahead.length > 0 && (
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: theme.textFaint, marginTop: "4px" }}>Earlier</div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              paddingBottom: "12px",
              borderBottom: `1px solid ${theme.divider}`,
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: theme.text,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ev.title}
              {ev.source && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: theme.textFaint, marginLeft: "6px" }}>
                  {ev.source}
                </span>
              )}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: theme.chipText,
                  background: theme.chip,
                  padding: "5px 10px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              >
                {ev.detail}
              </span>
              {!ev.source && (
                <button
                  onClick={() => removeEvent(ev.id)}
                  title="Remove"
                  className="v-btn"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "none",
                    background: theme.dangerSoft,
                    color: theme.danger,
                    fontSize: "12px",
                    lineHeight: "20px",
                    textAlign: "center",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </span>
          </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          placeholder="Event title"
          id="v-field-event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEvent()}
          className="v-input"
          style={{ ...inputStyle, flex: "2 1 130px" }}
        />
        <input
          id="v-field-event-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 135px" }}
        />
        <input
          placeholder="Detail (optional)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEvent()}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 110px" }}
        />
        <button
          onClick={addEvent}
          className="v-btn"
          style={{
            background: theme.accent,
            color: theme.accentText,
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12.5px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
    </Card>
  );
}

function buildNetWorthSeries(accounts, accountHistory) {
  const dateSet = new Set();
  accounts.forEach((a) => (accountHistory[a.id] || []).forEach((p) => dateSet.add(p.date)));
  const dates = Array.from(dateSet).sort();
  return dates.map((d) => {
    let sum = 0;
    accounts.forEach((a) => {
      const series = accountHistory[a.id] || [];
      let last = null;
      for (const p of series) {
        if (p.date <= d) last = p;
        else break;
      }
      if (last) sum += last.value;
    });
    return { date: d, value: sum };
  }).slice(-30);
}

function FinancialAccountsSection({ theme, data, setData, accountHistory, onRecordAccount }) {
  const accounts = data.accounts && data.accounts.length ? data.accounts : DEFAULT_FINANCIAL_ACCOUNTS;
  const [name, setName] = useState("");

  function updateBalance(id, raw) {
    setData({ ...data, accounts: accounts.map((a) => (a.id === id ? { ...a, balance: raw } : a)) });
    if (raw !== "" && !Number.isNaN(Number(raw))) onRecordAccount(id, raw);
  }
  function renameAccount(id, newName) {
    setData({ ...data, accounts: accounts.map((a) => (a.id === id ? { ...a, name: newName } : a)) });
  }
  function addAccount() {
    const n = name.trim();
    if (!n) { toast.info("Name the account first."); focusField("account-name"); return; }
    const id = "acct" + Date.now();
    setData({ ...data, accounts: [...accounts, { id, name: n, balance: 0 }] });
    setName("");
  }
  function removeAccount(id) {
    const removed = accounts.find((a) => a.id === id);
    setData({ ...data, accounts: accounts.filter((a) => a.id !== id) });
    if (removed) {
      toast.show({
        message: `Deleted "${removed.name}".`,
        action: { label: "Undo", onClick: () => setData((cur) => ({ ...cur, accounts: [...(cur.accounts || []), removed] })) },
      });
    }
  }

  const total = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const netWorthSeries = useMemo(() => buildNetWorthSeries(accounts, accountHistory || {}), [accounts, accountHistory]);

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={210}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <SectionLabel theme={theme} icon={<IconTrendingUp />} style={{ marginBottom: 0 }}>Accounts</SectionLabel>
        <button
          onClick={() => {
            const rows = [];
            accounts.forEach((a) => {
              const series = (accountHistory && accountHistory[a.id]) || [];
              if (series.length) series.forEach((p) => rows.push([a.name, p.date, p.value]));
              else rows.push([a.name, new Date().toISOString().slice(0, 10), a.balance]);
            });
            const csv = rowsToCSV(["Account", "Date", "Balance"], rows);
            downloadTextFile(`vantage-accounts-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
          }}
          className="v-btn"
          style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
        >
          Export CSV
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginTop: "10px", marginBottom: "6px" }}>
        <span className="v-tabular" style={{ fontSize: "30px", fontWeight: 800, color: theme.text }}>{fmtMoney(total)}</span>
        <span style={{ fontSize: "13px", color: theme.textMuted }}>across {accounts.length} account{accounts.length === 1 ? "" : "s"}</span>
      </div>
      {netWorthSeries.length >= 2 && (
        <div style={{ marginBottom: "16px" }}>
          <Sparkline theme={theme} data={netWorthSeries} label="Total balance trend" width={220} height={40} goodDirection="up" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginTop: "14px", marginBottom: "18px" }}>
        {accounts.map((a) => {
          const series = (accountHistory && accountHistory[a.id]) || [];
          return (
            <div key={a.id} className="v-rowact" style={{ background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "14px", padding: "14px 16px" }}>
              <button
                onClick={() => removeAccount(a.id)}
                title={"Remove " + (a.name || "account")}
                aria-label={"Remove " + (a.name || "account")}
                className="v-btn v-btn--tight v-iconbtn v-rowact__btn"
                style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: theme.dangerSoft, color: theme.danger, fontSize: "12px", lineHeight: "20px", textAlign: "center", padding: 0 }}
              >
                ×
              </button>
              <input
                value={a.name}
                onChange={(e) => renameAccount(a.id, e.target.value)}
                className="v-input v-input--bare"
                style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.textMuted, border: "none", marginBottom: "6px", "--focus-ring": theme.accentSoft, "--focus-border": "transparent" }}
              />
              <div className="v-fieldpair" style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span className="v-tabular" style={{ fontSize: "16px", fontWeight: 700, color: theme.textFaint, flexShrink: 0 }}>$</span>
                <input
                  value={a.balance}
                  onChange={(e) => updateBalance(a.id, e.target.value)}
                  inputMode="decimal"
                  className="v-input v-input--bare v-tabular"
                  style={{ fontSize: "20px", fontWeight: 700, color: theme.text, border: "none", "--focus-ring": theme.accentSoft, "--focus-border": "transparent" }}
                />
              </div>
              {series.length >= 2 && (
                <div style={{ marginTop: "10px" }}>
                  <Sparkline theme={theme} data={series} width={140} height={28} goodDirection="up" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          placeholder="Add another account (e.g. HSA)"
          id="v-field-account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAccount()}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 220px" }}
        />
        <button onClick={addAccount} className="v-btn" style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
      </div>
    </Card>
  );
}

// Holdings are informational line-items under an account, not synced with
// its (manually-entered) balance — forcing those to match would mean either
// silently overwriting a number the user just typed, or a reconciliation UI
// nobody asked for. The holdings total is shown alongside as a reference.
function InvestmentHoldingsSection({ theme, data, setData }) {
  const accounts = data.accounts && data.accounts.length ? data.accounts : DEFAULT_FINANCIAL_ACCOUNTS;
  const holdings = data.holdings || [];
  const [accountId, setAccountId] = useState(accounts[0] ? accounts[0].id : "");
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  function addHolding() {
    const t = ticker.trim().toUpperCase();
    if (!t || !accountId || !shares) return;
    const h = { id: "hold" + Date.now(), accountId, ticker: t, shares: Number(shares) || 0, price: price === "" ? null : Number(price) || 0 };
    setData({ ...data, holdings: [...holdings, h] });
    setTicker(""); setShares(""); setPrice("");
  }
  function removeHolding(id) {
    const removed = holdings.find((h) => h.id === id);
    setData({ ...data, holdings: holdings.filter((h) => h.id !== id) });
    if (removed) {
      toast.show({
        message: `Deleted ${removed.ticker}.`,
        action: { label: "Undo", onClick: () => setData((cur) => ({ ...cur, holdings: [...(cur.holdings || []), removed] })) },
      });
    }
  }

  const grandTotal = holdings.reduce((sum, h) => sum + h.shares * (h.price || 0), 0);
  const byAccount = accounts.map((a) => ({ account: a, items: holdings.filter((h) => h.accountId === a.id) })).filter((g) => g.items.length);

  const inputStyle = {
    background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "8px",
    color: theme.inputText, padding: "9px 12px", fontSize: "14px", minWidth: 0,
    "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
  };

  if (accounts.length === 0) return null;

  return (
    <Card theme={theme} delay={240}>
      <SectionLabel theme={theme} icon={<IconTrendingUp size={14} />}>Investment Holdings</SectionLabel>
      {holdings.length > 0 && (
        <div style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "14px" }}>
          <span className="v-tabular" style={{ fontSize: "22px", fontWeight: 800, color: theme.text }}>{fmtMoney(grandTotal)}</span> across {holdings.length} holding{holdings.length === 1 ? "" : "s"} with a price set
        </div>
      )}
      {byAccount.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
          {byAccount.map(({ account, items }) => (
            <div key={account.id}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "6px" }}>{account.name}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {items.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text, width: "60px", flexShrink: 0 }}>{h.ticker}</span>
                    <span className="v-tabular" style={{ fontSize: "12.5px", color: theme.textMuted, flex: 1 }}>{h.shares} sh{h.price != null ? ` @ ${fmtMoney(h.price)}` : ""}</span>
                    {h.price != null && <span className="v-tabular" style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{fmtMoney(h.shares * h.price)}</span>}
                    <button onClick={() => removeHolding(h.id)} className="v-btn" title="Remove holding" style={{ fontSize: "16px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHolding()} placeholder="Ticker" className="v-input" style={inputStyle} />
        <input value={shares} onChange={(e) => setShares(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHolding()} placeholder="Shares" inputMode="decimal" className="v-input" style={inputStyle} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHolding()} placeholder="Price (optional)" inputMode="decimal" className="v-input" style={inputStyle} />
        <button onClick={addHolding} className="v-btn" style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
      </div>
    </Card>
  );
}

function FinancialSection({ theme, data, setData }) {
  const currentSavings = data.currentSavings || 0;
  const target = data.targetDownPayment || 0;
  const remaining = Math.max(0, target - currentSavings);
  return (
    <Card theme={theme} delay={180}>
      <SectionLabel theme={theme} icon={<IconTrendingUp />}>Financial</SectionLabel>
      <MetricGrid>
        <Metric
          theme={theme}
          label="Current Savings"
          value={currentSavings}
          prefix="$"
          formatDisplay={(v) => Number(v).toLocaleString()}
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, currentSavings: Number(v) || 0 })}
        />
        <Metric
          theme={theme}
          label="Target 20% Down Payment"
          value={data.targetDownPayment}
          prefix="$"
          formatDisplay={(v) => Number(v).toLocaleString()}
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, targetDownPayment: Number(v) || data.targetDownPayment })}
        />
        <Metric
          theme={theme}
          label="Timeline From"
          value={data.timelineLow}
          suffix="months"
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, timelineLow: Number(v) || data.timelineLow })}
        />
        <Metric
          theme={theme}
          label="Timeline To"
          value={data.timelineHigh}
          suffix="months"
          editable
          inputType="number"
          onChange={(v) => setData({ ...data, timelineHigh: Number(v) || data.timelineHigh })}
        />
      </MetricGrid>
      {target > 0 && <ProgressBar theme={theme} from={0} to={target} current={currentSavings} />}
      {target > 0 && (
        <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "8px" }}>
          ${remaining.toLocaleString()} to go
        </div>
      )}
    </Card>
  );
}

function CustomTrackersSection({ theme, trackers, setTrackers, trackerHistory, onRecordTracker }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [target, setTarget] = useState("");

  function addTracker() {
    const trimmedLabel = label.trim();
    const trimmedValue = value.trim();
    if (!trimmedLabel) { toast.info("Name the tracker first."); focusField("tracker-label"); return; }
    if (!trimmedValue) { toast.info("Give the tracker a starting value."); focusField("tracker-value"); return; }
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 6);
    setTrackers([...trackers, { id, label: trimmedLabel, value: trimmedValue, target: target.trim() }]);
    setLabel("");
    setValue("");
    setTarget("");
  }

  function removeTracker(id) {
    const removed = trackers.find((t) => t.id === id);
    setTrackers(trackers.filter((t) => t.id !== id));
    if (removed) {
      toast.show({
        message: `Deleted "${removed.label}".`,
        action: { label: "Undo", onClick: () => setTrackers((cur) => [...cur, removed]) },
      });
    }
  }

  function updateTrackerValue(id, newValue) {
    setTrackers(trackers.map((t) => (t.id === id ? { ...t, value: newValue } : t)));
    onRecordTracker(id, newValue);
  }

  function updateTrackerTarget(id, newTarget) {
    setTrackers(trackers.map((t) => (t.id === id ? { ...t, target: newTarget } : t)));
  }

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={240}>
      <SectionLabel theme={theme} icon={<IconSparkles />}>Custom Trackers</SectionLabel>

      {trackers.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {trackers.map((t) => {
            const progress = computeGoalProgress(t.value, t.target);
            return (
              <div
                key={t.id}
                className="v-rowact"
                style={{
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "14px",
                  padding: "14px 16px",
                }}
              >
                <button
                  onClick={() => removeTracker(t.id)}
                  title={"Remove " + (t.label || "tracker")}
                  aria-label={"Remove " + (t.label || "tracker")}
                  className="v-btn v-btn--tight v-iconbtn v-rowact__btn"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "none",
                    background: theme.dangerSoft,
                    color: theme.danger,
                    fontSize: "12px",
                    lineHeight: "20px",
                    textAlign: "center",
                    padding: 0,
                  }}
                >
                  ×
                </button>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: theme.textMuted,
                    marginBottom: "6px",
                    paddingRight: "18px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </div>
                <input
                  value={t.value}
                  onChange={(e) => updateTrackerValue(t.id, e.target.value)}
                  className="v-input v-tabular"
                  style={{
                    width: "100%",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: theme.text,
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    padding: 0,
                    "--focus-ring": theme.accentSoft,
                    "--focus-border": "transparent",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
                  <span
                    style={{
                      fontSize: "9.5px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: theme.textFaint,
                      flexShrink: 0,
                    }}
                  >
                    Goal
                  </span>
                  <input
                    value={t.target || ""}
                    onChange={(e) => updateTrackerTarget(t.id, e.target.value)}
                    placeholder="optional"
                    className="v-input v-tabular"
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: theme.textMuted,
                      background: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      padding: 0,
                      "--focus-ring": theme.accentSoft,
                      "--focus-border": "transparent",
                    }}
                  />
                </div>
                {progress !== null && (
                  <div
                    title={`${progress}% of goal`}
                    style={{
                      height: "4px",
                      borderRadius: "999px",
                      background: theme.progressTrack,
                      marginTop: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        borderRadius: "999px",
                        backgroundImage:
                          typeof theme.progressFill === "string" && theme.progressFill.includes("gradient")
                            ? theme.progressFill
                            : undefined,
                        background: theme.progressFill,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
                {!Number.isNaN(Number(t.value)) && (trackerHistory[t.id] || []).length >= 2 && (
                  <Sparkline theme={theme} data={trackerHistory[t.id]} width={140} height={28} goodDirection="up" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "20px" }}>
          No custom trackers yet — add one below.
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          placeholder="Label (e.g. Pages Read)"
          id="v-field-tracker-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTracker()}
          className="v-input"
          style={{ ...inputStyle, flex: "2 1 180px" }}
        />
        <input
          placeholder="Value (e.g. 42)"
          id="v-field-tracker-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTracker()}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 100px" }}
        />
        <input
          placeholder="Goal (optional)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTracker()}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 110px" }}
        />
        <button
          onClick={addTracker}
          className="v-btn"
          style={{
            flex: "0 0 auto",
            background: theme.accent,
            color: theme.accentText,
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Add Tracker
        </button>
      </div>
    </Card>
  );
}

function TikTokConnect({ theme, integrations, setIntegrations }) {
  const [connected, setConnected] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const backendUrl = integrations.tiktokBackendUrl.trim().replace(/\/$/, "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tiktokParam = params.get("tiktok");
    if (tiktokParam === "connected") {
      setStatusMsg({ type: "success", message: "TikTok connected." });
      setConnected(true);
    } else if (tiktokParam === "error") {
      setStatusMsg({ type: "error", message: `Connection failed (${params.get("reason") || "unknown"}).` });
    }
    if (tiktokParam) {
      params.delete("tiktok");
      params.delete("reason");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!backendUrl) {
      setConnected(false);
      return;
    }
    let cancelled = false;
    fetch(`${backendUrl}/.netlify/functions/tiktok-status`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setConnected(!!data.connected);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  function connect() {
    if (!integrations.tiktokClientKey.trim() || !backendUrl) {
      setStatusMsg({ type: "error", message: "Add your Client Key and backend URL first." });
      setShowConfig(true);
      return;
    }
    const redirectUri = `${backendUrl}/.netlify/functions/tiktok-callback`;
    const state = Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem("tiktok_oauth_state", state);
    } catch (e) {
      /* ignore — low-stakes for a single-user personal app */
    }
    const authUrl =
      "https://www.tiktok.com/v2/auth/authorize/" +
      `?client_key=${encodeURIComponent(integrations.tiktokClientKey.trim())}` +
      "&scope=video.publish" +
      "&response_type=code" +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;
    window.location.href = authUrl;
  }

  async function disconnect() {
    if (!backendUrl) return;
    try {
      await fetch(`${backendUrl}/.netlify/functions/tiktok-disconnect`, { method: "POST" });
      setConnected(false);
      setStatusMsg({ type: "success", message: "Disconnected." });
    } catch (err) {
      setStatusMsg({ type: "error", message: "Couldn't disconnect — try again." });
    }
  }

  const inputStyle = {
    width: "100%",
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "8px 10px",
    fontSize: "12.5px",
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <div
      style={{
        background: theme.accentSoft,
        border: `1px solid ${theme.divider}`,
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: connected ? theme.positive : theme.textFaint,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>
            {connected === null
              ? "Checking TikTok connection…"
              : connected
              ? "TikTok connected"
              : "TikTok not connected"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowConfig((s) => !s)}
            className="v-btn"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.textMuted,
              background: "transparent",
              border: `1px solid ${theme.divider}`,
              borderRadius: "8px",
              padding: "6px 12px",
            }}
          >
            {showConfig ? "Hide setup" : "Setup"}
          </button>
          {connected ? (
            <button
              onClick={disconnect}
              className="v-btn"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: theme.danger,
                background: "transparent",
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: "8px",
                padding: "6px 12px",
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              className="v-btn"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: theme.accentText,
                background: theme.accent,
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
              }}
            >
              Connect TikTok Account
            </button>
          )}
        </div>
      </div>

      {showConfig && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            placeholder="TikTok Client Key"
            value={integrations.tiktokClientKey}
            onChange={(e) => setIntegrations({ ...integrations, tiktokClientKey: e.target.value })}
            className="v-input"
            style={inputStyle}
          />
          <input
            placeholder="Backend URL (e.g. https://your-site.netlify.app)"
            value={integrations.tiktokBackendUrl}
            onChange={(e) => setIntegrations({ ...integrations, tiktokBackendUrl: e.target.value })}
            className="v-input"
            style={inputStyle}
          />
        </div>
      )}

      {statusMsg && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            fontWeight: 600,
            color: statusMsg.type === "error" ? theme.danger : theme.positive,
          }}
        >
          {statusMsg.message}
        </div>
      )}
    </div>
  );
}

function WatchQueueSection({ theme, watchlist, setWatchlist, genres, delay }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("movie");

  const suggestions = suggestTitles(genres, watchlist, 4);

  function addTitle(t, ty) {
    const trimmed = t.trim();
    if (!trimmed) { toast.info("Give the title a name first."); focusField("watch-title"); return; }
    if (watchlist.some((w) => w.title.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("“" + trimmed + "” is already on the watch list.");
      return;
    }
    const id = "w" + Date.now() + Math.random().toString(36).slice(2, 6);
    setWatchlist([...watchlist, { id, title: trimmed, type: ty, status: "queued" }]);
  }

  function removeTitle(id) {
    const removed = watchlist.find((w) => w.id === id);
    setWatchlist(watchlist.filter((w) => w.id !== id));
    if (removed) toastUndo(`"${removed.title || "title"}"`, () => setWatchlist((cur) => [...(cur || []), removed]));
  }

  function cycleStatus(id) {
    const order = ["queued", "watching", "done"];
    setWatchlist(
      watchlist.map((w) =>
        w.id === id ? { ...w, status: order[(order.indexOf(w.status) + 1) % order.length] } : w
      )
    );
  }

  const statusMeta = {
    queued: { label: "Queued", bg: theme.chip, color: theme.chipText },
    watching: { label: "Watching", bg: theme.accentSoft, color: theme.accent },
    done: { label: "Done", bg: theme.accentSoft, color: theme.positive },
  };

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={delay}>
      <SectionLabel theme={theme} icon={<IconFilm />}>Watch List</SectionLabel>

      {suggestions.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: theme.textMuted,
              marginBottom: "8px",
            }}
          >
            Suggested for you
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {suggestions.map((s) => (
              <button
                key={s.title}
                onClick={() => addTitle(s.title, s.type)}
                className="v-btn"
                title={`Add "${s.title}" to your queue`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.text,
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "999px",
                  padding: "6px 12px 6px 10px",
                }}
              >
                <span style={{ color: theme.accent }}>+</span>
                {s.title}
                <span style={{ color: theme.textFaint, fontWeight: 500 }}>{s.type === "show" ? "show" : "movie"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {watchlist.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
          {watchlist.map((w) => (
            <div
              key={w.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: theme.accentSoft,
                border: `1px solid ${theme.divider}`,
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: "14px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {w.title}
              </span>
              <span style={{ fontSize: "11px", color: theme.textFaint, flexShrink: 0 }}>{w.type === "show" ? "Show" : "Movie"}</span>
              <button
                onClick={() => cycleStatus(w.id)}
                className="v-btn"
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: (statusMeta[w.status] || statusMeta.queued).color,
                  background: (statusMeta[w.status] || statusMeta.queued).bg,
                  border: "none",
                  borderRadius: "999px",
                  padding: "5px 10px",
                  flexShrink: 0,
                }}
              >
                {(statusMeta[w.status] || statusMeta.queued).label}
              </button>
              <button
                onClick={() => removeTitle(w.id)}
                title="Remove"
                className="v-btn"
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  background: theme.dangerSoft,
                  color: theme.danger,
                  fontSize: "12px",
                  lineHeight: "20px",
                  textAlign: "center",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "18px" }}>
          Your queue is empty — add a suggestion above or your own pick below.
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          placeholder="Title"
          id="v-field-watch-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTitle(title, type);
              setTitle("");
            }
          }}
          className="v-input"
          style={{ ...inputStyle, flex: "2 1 140px" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 90px" }}
        >
          <option value="movie">Movie</option>
          <option value="show">Show</option>
        </select>
        <button
          onClick={() => {
            addTitle(title, type);
            setTitle("");
          }}
          className="v-btn"
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            border: "none",
            background: theme.accent,
            color: theme.accentText,
            fontSize: "13px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
    </Card>
  );
}

function AgendaStripSection({ theme, events, delay }) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      isToday: i === 0,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      items: events.filter((e) => e.date === iso),
    });
  }

  return (
    <Card theme={theme} delay={delay}>
      <SectionLabel theme={theme} icon={<IconCalendar />}>7-Day Agenda</SectionLabel>
      {/* Seven fixed 100px columns forced a 760px row, so a phone hid four
          days behind a silent clip. Below 640px it becomes a 2-up grid that
          fits; wider it keeps the single row, with a fade marking the cut. */}
      <div
        className="v-scroll v-agenda-days"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(100px, 1fr))",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "4px",
          "--scroll-thumb": theme.divider,
        }}
      >
        {days.map((d) => (
          <div
            key={d.iso}
            style={{
              background: d.isToday ? theme.accentSoft : "transparent",
              border: `1px solid ${d.isToday ? theme.accent : theme.divider}`,
              borderRadius: "10px",
              padding: "10px 10px",
              minHeight: "90px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: d.isToday ? theme.accent : theme.textMuted }}>
                {d.label}
              </div>
              <div style={{ fontSize: "12px", color: theme.textFaint }}>{d.dateLabel}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {d.items.length > 0 ? (
                d.items.map((it, i) => (
                  <div
                    key={i}
                    title={it.title}
                    style={{ fontSize: "11.5px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {it.title}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "11.5px", color: theme.textFaint }}>—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BudgetEnvelopesSection({ theme, transactions, budgets, setBudgets }) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const spendByCategory = useMemo(() => {
    const out = {};
    (transactions || []).filter((t) => t.date && t.date.startsWith(monthPrefix)).forEach((t) => {
      const c = t.category || "Uncategorized";
      out[c] = (out[c] || 0) + (Number(t.amount) || 0);
    });
    return out;
  }, [transactions, monthPrefix]);

  const entries = Object.entries(budgets || {});

  function setBudget() {
    const c = category.trim();
    const l = Number(limit);
    if (!c || !l) return;
    setBudgets({ ...(budgets || {}), [c]: l });
    setCategory(""); setLimit("");
  }
  function removeBudget(c) {
    const removed = (budgets || {})[c];
    const next = { ...(budgets || {}) };
    delete next[c];
    setBudgets(next);
    if (removed !== undefined) toastUndo(`the "${c}" budget`, () => setBudgets((cur) => ({ ...(cur || {}), [c]: removed })));
  }

  const inputStyle = {
    background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "8px",
    color: theme.inputText, padding: "9px 12px", fontSize: "14px", minWidth: 0,
    "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={20}>
      <SectionLabel theme={theme} icon={<IconCreditCard size={14} />}>Budgets this month</SectionLabel>
      {entries.length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "14px" }}>Set a monthly limit per category to track spending against it.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {entries.map(([c, l]) => {
            const spent = spendByCategory[c] || 0;
            const pct = l > 0 ? Math.min(100, Math.round((spent / l) * 100)) : 0;
            const over = spent > l;
            return (
              <div key={c}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{c}</span>
                  <span className="v-tabular" style={{ fontSize: "12px", color: over ? theme.danger : theme.textMuted, flexShrink: 0 }}>{fmtMoney(spent)} / {fmtMoney(l)}</span>
                  <button onClick={() => removeBudget(c)} className="v-btn" title="Remove budget" style={{ fontSize: "14px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 2px", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ height: "6px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: "999px", background: over ? theme.danger : theme.accent, transition: "width 0.3s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setBudget()} placeholder="Category (e.g. Dining)" className="v-input" style={{ ...inputStyle, flex: "2 1 160px" }} />
        <input value={limit} onChange={(e) => setLimit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setBudget()} placeholder="Monthly limit" inputMode="decimal" className="v-input" style={{ ...inputStyle, flex: "1 1 120px" }} />
        <button onClick={setBudget} className="v-btn" style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Set</button>
      </div>
    </Card>
  );
}

function TransactionsSection({ theme, transactions, setTransactions, categoryOptions, delay, autoFocusAdd, categoryRules, setCategoryRules }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [importStatus, setImportStatus] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const merchantRef = useRef(null);

  // Deep-link quick action (#transactions/add) jumps straight to the form.
  useEffect(() => {
    if (autoFocusAdd && merchantRef.current) merchantRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocusAdd]);

  function applyImport(parsed) {
    if (parsed.length === 0) {
      setImportStatus({ type: "error", message: "Couldn't find any transactions in that — expecting a date, description, and amount per line." });
      return;
    }
    setTransactions([...parsed, ...transactions]);
    setImportStatus({
      type: "success",
      message: `Imported ${parsed.length} transaction${parsed.length === 1 ? "" : "s"} — double-check the guessed categories (and dates, for PDF imports) below.`,
    });
    setTimeout(() => setImportStatus(null), 8000);
  }

  async function handlePdfUpload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPdfBusy(true);
    setImportStatus(null);
    try {
      const text = await extractPdfText(file);
      applyImport(parseStatementText(text, categoryRules));
    } catch (err) {
      setImportStatus({ type: "error", message: err.message || "Couldn't read that PDF." });
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImportStatus(null);
    try {
      const text = await file.text();
      applyImport(parseStatementText(text, categoryRules));
    } catch (err) {
      setImportStatus({ type: "error", message: err.message || "Couldn't read that CSV." });
    }
  }

  function addTransaction() {
    const trimmedMerchant = merchant.trim();
    if (!trimmedMerchant) { toast.info("Who was it paid to?"); focusField("tx-merchant"); return; }
    if (!amount) { toast.info("Enter an amount."); focusField("tx-amount"); return; }
    const tx = {
      id: "tx" + Date.now() + Math.random().toString(36).slice(2, 8),
      date: date || new Date().toISOString().slice(0, 10),
      merchant: trimmedMerchant,
      amount: Math.abs(Number(amount)) || 0,
      category: category.trim() || guessCategory(trimmedMerchant, categoryRules),
    };
    setTransactions([tx, ...transactions]);
    setMerchant("");
    setAmount("");
    setCategory("");
  }

  function removeTransaction(id) {
    const removed = transactions.find((t) => t.id === id);
    setTransactions(transactions.filter((t) => t.id !== id));
    if (removed) {
      toast.show({
        message: `Deleted "${removed.merchant}".`,
        action: { label: "Undo", onClick: () => setTransactions((cur) => [removed, ...cur]) },
      });
    }
  }

  function updateTransactionCategory(id, value) {
    setTransactions(transactions.map((t) => (t.id === id ? { ...t, category: value } : t)));
  }

  function importPasted() {
    applyImport(parseStatementText(pasteText, categoryRules));
    setPasteText("");
    setShowPaste(false);
  }

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthPrefix));
  const totalThisMonth = monthTransactions.reduce((s, t) => s + t.amount, 0);

  const byCategory = {};
  monthTransactions.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const categoryBreakdown = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategorySpend = categoryBreakdown.length > 0 ? categoryBreakdown[0][1] : 0;

  const spendByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const prefix = d.toISOString().slice(0, 7);
    const total = transactions.filter((t) => t.date.startsWith(prefix)).reduce((s, t) => s + t.amount, 0);
    return { month: prefix, value: total };
  });
  const monthsWithSpend = spendByMonth.filter((m) => m.value > 0).length;

  const sorted = transactions.slice().sort((a, b) => b.date.localeCompare(a.date));
  const allCategoryOptions = Array.from(new Set([...(categoryOptions || []), ...transactions.map((t) => t.category)]));

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "14px",
    minWidth: 0,
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return (
    <Card theme={theme} delay={delay}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconReceipt />} style={{ marginBottom: 0 }}>Transactions</SectionLabel>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              const csv = rowsToCSV(
                ["Date", "Merchant", "Category", "Amount"],
                transactions.map((t) => [t.date, t.merchant, t.category, t.amount])
              );
              downloadTextFile(`vantage-transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
            }}
            disabled={!transactions.length}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px", opacity: transactions.length ? 1 : 0.5 }}
          >
            Export CSV
          </button>
          <button
            onClick={() => pdfInputRef.current && pdfInputRef.current.click()}
            disabled={pdfBusy}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
          >
            {pdfBusy ? "Reading PDF…" : "Upload PDF"}
          </button>
          <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} style={{ display: "none" }} />
          <button
            onClick={() => csvInputRef.current && csvInputRef.current.click()}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
          >
            Upload CSV
          </button>
          <input ref={csvInputRef} type="file" accept="text/csv,.csv" onChange={handleCsvUpload} style={{ display: "none" }} />
          <button
            onClick={() => setShowPaste((s) => !s)}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
          >
            {showPaste ? "Cancel" : "Paste statement"}
          </button>
          <button
            onClick={() => setShowRules((s) => !s)}
            className="v-btn"
            style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
          >
            {showRules ? "Hide rules" : `Rules${categoryRules && categoryRules.length ? ` (${categoryRules.length})` : ""}`}
          </button>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: theme.textFaint, marginBottom: "12px", lineHeight: 1.4 }}>
        PDF parsing runs entirely in your browser — the file is never uploaded anywhere.
      </div>
      {showRules && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", background: theme.accentSoft, marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "10px", lineHeight: 1.4 }}>
            New transactions and statement imports check these first — if a merchant contains the text below, it gets your category instead of the built-in guess.
          </div>
          {(categoryRules || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {categoryRules.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                  <span style={{ color: theme.textMuted }}>Merchant contains</span>
                  <span style={{ fontWeight: 700, color: theme.text }}>"{r.pattern}"</span>
                  <span style={{ color: theme.textMuted }}>→</span>
                  <span style={{ fontWeight: 700, color: theme.text }}>{r.category}</span>
                  <button
                    onClick={() => setCategoryRules(categoryRules.filter((x) => x.id !== r.id))}
                    className="v-btn"
                    style={{ marginLeft: "auto", fontSize: "15px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              value={rulePattern}
              onChange={(e) => setRulePattern(e.target.value)}
              placeholder="Merchant contains (e.g. amazon)"
              className="v-input"
              style={{ ...inputStyle, flex: "2 1 160px" }}
            />
            <input
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
              placeholder="Category"
              className="v-input"
              style={{ ...inputStyle, flex: "1 1 120px" }}
            />
            <button
              onClick={() => {
                const p = rulePattern.trim();
                const c = ruleCategory.trim();
                if (!p || !c) return;
                setCategoryRules([...(categoryRules || []), { id: "rule" + Date.now(), pattern: p, category: c }]);
                setRulePattern("");
                setRuleCategory("");
              }}
              className="v-btn"
              style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}
            >
              Add rule
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: theme.textFaint, marginBottom: "16px" }}>
        <span>
          <span className="v-tabular" style={{ color: theme.text, fontWeight: 700 }}>${totalThisMonth.toLocaleString()}</span> this month
        </span>
        <span>{monthTransactions.length} transaction{monthTransactions.length === 1 ? "" : "s"}</span>
      </div>

      {showPaste && (
        <div style={{ marginBottom: "16px" }}>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Paste rows copied from your bank or card statement export — one transaction per line, e.g.\n08/03/2026, STARBUCKS #4521, 5.40\n08/04/2026, AMAZON.COM, 32.10"}
            className="v-input"
            style={{
              width: "100%",
              minHeight: "90px",
              resize: "vertical",
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: "10px",
              color: theme.inputText,
              padding: "12px",
              fontSize: "12.5px",
              lineHeight: 1.5,
              fontFamily: "monospace",
              marginBottom: "10px",
              "--focus-ring": theme.accentSoft,
              "--focus-border": theme.accent,
            }}
          />
          <button
            onClick={importPasted}
            className="v-btn"
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: theme.accent, color: theme.accentText, fontSize: "13px", fontWeight: 700 }}
          >
            Import
          </button>
        </div>
      )}
      {importStatus && (
        <div style={{ fontSize: "12px", fontWeight: 600, color: importStatus.type === "error" ? theme.danger : theme.positive, marginBottom: "14px" }}>
          {importStatus.message}
        </div>
      )}

      {monthsWithSpend >= 2 && (
        <Sparkline theme={theme} data={spendByMonth} label="Monthly spend trend (6 mo)" goodDirection="down" />
      )}

      {categoryBreakdown.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: monthsWithSpend >= 2 ? "18px" : 0, marginBottom: "18px" }}>
          {categoryBreakdown.map(([cat, amt]) => (
            <div key={cat}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.textMuted, marginBottom: "3px" }}>
                <span>{cat}</span>
                <span className="v-tabular">${amt.toLocaleString()}</span>
              </div>
              <div style={{ height: "5px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${maxCategorySpend ? Math.round((amt / maxCategorySpend) * 100) : 0}%`,
                    borderRadius: "999px",
                    background: theme.progressFill,
                    backgroundImage: typeof theme.progressFill === "string" && theme.progressFill.includes("gradient") ? theme.progressFill : undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="v-scroll" style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "min(62vh, 900px)", overflowY: "auto", marginBottom: "18px" }}>
          {sorted.map((t) => (
            <div
              key={t.id}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px", padding: "8px 10px" }}
            >
              <span style={{ fontSize: "11px", color: theme.textFaint, flexShrink: 0, width: "44px" }}>
                {t.date.slice(5).replace("-", "/")}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: "13px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.merchant}
              </span>
              <input
                value={t.category}
                onChange={(e) => updateTransactionCategory(t.id, e.target.value)}
                list="v-tx-categories"
                className="v-input"
                style={{ width: "100px", fontSize: "11.5px", color: theme.textMuted, background: "transparent", border: "none", padding: "2px 0", flexShrink: 0, "--focus-ring": theme.accentSoft, "--focus-border": "transparent" }}
              />
              <span className="v-tabular" style={{ fontSize: "13px", fontWeight: 700, color: theme.text, flexShrink: 0 }}>
                ${t.amount.toLocaleString()}
              </span>
              <button
                onClick={() => removeTransaction(t.id)}
                title="Remove"
                className="v-btn"
                style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: theme.dangerSoft, color: theme.danger, fontSize: "11px", lineHeight: "18px", textAlign: "center", padding: 0, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "18px" }}>
          No transactions yet — add one below or paste in a statement.
        </div>
      )}

      <datalist id="v-tx-categories">
        {allCategoryOptions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 130px" }}
        />
        <input
          id="v-field-tx-merchant"
          ref={merchantRef}
          placeholder="Merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTransaction()}
          className="v-input"
          style={{ ...inputStyle, flex: "2 1 140px" }}
        />
        <input
          id="v-field-tx-amount"
          placeholder="Amount $"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTransaction()}
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 90px" }}
        />
        <input
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTransaction()}
          list="v-tx-categories"
          className="v-input"
          style={{ ...inputStyle, flex: "1 1 130px" }}
        />
        <button
          onClick={addTransaction}
          className="v-btn"
          style={{ padding: "9px 16px", borderRadius: "8px", border: "none", background: theme.accent, color: theme.accentText, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}
        >
          Add
        </button>
      </div>
    </Card>
  );
}

function JournalSection({ theme, data, setData, delay }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = data.find((e) => e.date === today);
  const past = data.filter((e) => e.date !== today).sort((a, b) => b.date.localeCompare(a.date));

  function updateToday(text) {
    const idx = data.findIndex((e) => e.date === today);
    if (idx === -1) {
      setData([...data, { date: today, text }]);
    } else {
      setData(data.map((e) => (e.date === today ? { ...e, text } : e)));
    }
  }

  function removeEntry(date) {
    const removed = data.find((e) => e.date === date);
    setData(data.filter((e) => e.date !== date));
    if (removed) {
      toast.show({
        message: "Deleted journal entry.",
        action: { label: "Undo", onClick: () => setData((cur) => [...cur, removed]) },
      });
    }
  }

  return (
    <Card theme={theme} delay={delay}>
      <SectionLabel theme={theme} icon={<IconBookOpen />}>Journal</SectionLabel>
      <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px" }}>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <textarea
        value={todayEntry ? todayEntry.text : ""}
        onChange={(e) => updateToday(e.target.value)}
        placeholder="What's on your mind today?"
        className="v-input"
        style={{
          width: "100%",
          minHeight: "80px",
          resize: "vertical",
          background: theme.inputBg,
          border: `1px solid ${theme.inputBorder}`,
          borderRadius: "10px",
          color: theme.inputText,
          padding: "12px",
          fontSize: "13.5px",
          lineHeight: 1.5,
          marginBottom: "16px",
          "--focus-ring": theme.accentSoft,
          "--focus-border": theme.accent,
        }}
      />

      {past.length > 0 ? (
        <div className="v-scroll" style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "min(62vh, 900px)", overflowY: "auto" }}>
          {past.map((e) => (
            <div key={e.date} style={{ background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: theme.textMuted }}>
                  {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() => removeEntry(e.date)}
                  title="Delete entry"
                  className="v-btn"
                  style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: theme.dangerSoft, color: theme.danger, fontSize: "11px", lineHeight: "18px", textAlign: "center", padding: 0 }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: "13px", color: theme.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{e.text}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "12.5px", color: theme.textFaint }}>Past entries will show up here.</div>
      )}
    </Card>
  );
}

function GoalsBoardSection({ theme, data, setData, delay }) {
  const [label, setLabel] = useState("");

  function addGoal() {
    const trimmed = label.trim();
    if (!trimmed) { toast.info("Name the goal first."); focusField("goal-label"); return; }
    const id = "g" + Date.now() + Math.random().toString(36).slice(2, 6);
    setData([...data, { id, label: trimmed, status: "not-started" }]);
    setLabel("");
  }

  function advanceStatus(id) {
    setData(
      data.map((g) =>
        g.id === id ? { ...g, status: GOAL_STATUSES[(GOAL_STATUSES.indexOf(g.status) + 1) % GOAL_STATUSES.length] } : g
      )
    );
  }

  function removeGoal(id) {
    const removed = data.find((g) => g.id === id);
    setData(data.filter((g) => g.id !== id));
    if (removed) {
      toast.show({
        message: `Deleted "${removed.label}".`,
        action: { label: "Undo", onClick: () => setData((cur) => [...cur, removed]) },
      });
    }
  }

  return (
    <Card theme={theme} delay={delay}>
      <SectionLabel theme={theme} icon={<IconFlag />}>Life Goals</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "16px" }}>
        {GOAL_STATUSES.map((status) => (
          <div key={status}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "8px" }}>
              {GOAL_STATUS_LABELS[status]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.filter((g) => g.status === status).map((g) => (
                <div
                  key={g.id}
                  style={{ background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "8px", padding: "8px 8px" }}
                >
                  <div style={{ fontSize: "12px", color: theme.text, lineHeight: 1.4, wordBreak: "break-word", marginBottom: "6px" }}>{g.label}</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => advanceStatus(g.id)}
                      title="Advance status"
                      className="v-btn"
                      style={{ fontSize: "10.5px", fontWeight: 700, color: theme.accent, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "2px 8px" }}
                    >
                      &rarr;
                    </button>
                    <button
                      onClick={() => removeGoal(g.id)}
                      title="Remove"
                      className="v-btn"
                      style={{ fontSize: "10.5px", fontWeight: 700, color: theme.danger, background: "transparent", border: "none", padding: "2px 4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          placeholder="New goal"
          id="v-field-goal-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          className="v-input"
          style={{
            flex: 1,
            minWidth: 0,
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: "8px",
            color: theme.inputText,
            padding: "9px 12px",
            fontSize: "14px",
            "--focus-ring": theme.accentSoft,
            "--focus-border": theme.accent,
          }}
        />
        <button
          onClick={addGoal}
          className="v-btn"
          style={{ padding: "9px 16px", borderRadius: "8px", border: "none", background: theme.accent, color: theme.accentText, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}
        >
          Add
        </button>
      </div>
    </Card>
  );
}

function VideoLibrarySection({ theme, integrations, setIntegrations }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusById, setStatusById] = useState({});
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [storageSupported, setStorageSupported] = useState(true);
  const fileInputRef = useRef(null);

  function refreshStorageEstimate() {
    if (!navigator.storage || !navigator.storage.estimate) {
      setStorageSupported(false);
      return;
    }
    navigator.storage
      .estimate()
      .then((est) => setStorageEstimate({ usage: est.usage || 0, quota: est.quota || 0 }))
      .catch(() => setStorageSupported(false));
  }

  useEffect(() => {
    let cancelled = false;
    dbGetAllVideos()
      .then((records) => {
        if (cancelled) return;
        const withUrls = records
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((r) => ({ ...r, url: URL.createObjectURL(r.blob) }));
        setVideos(withUrls);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setDbError(err.message || "Couldn't open local video storage.");
        setLoading(false);
      });
    refreshStorageEstimate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      videos.forEach((v) => URL.revokeObjectURL(v.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setStatus(id, status) {
    setStatusById((prev) => ({ ...prev, [id]: status }));
    if (status) {
      setTimeout(() => setStatusById((prev) => ({ ...prev, [id]: null })), 5000);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const id = "v" + Date.now() + Math.random().toString(36).slice(2, 6);
      const record = { id, title: file.name.replace(/\.[^.]+$/, ""), type: file.type, size: file.size, createdAt: Date.now(), blob: file };
      await dbPutVideo(record);
      setVideos((prev) => [{ ...record, url: URL.createObjectURL(file) }, ...prev]);
      refreshStorageEstimate();
    } catch (err) {
      setDbError(err.message || "Couldn't save that video.");
    } finally {
      setUploading(false);
    }
  }

  async function renameVideo(id, title) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, title } : v)));
    const video = videos.find((v) => v.id === id);
    if (video) {
      await dbPutVideo({ id: video.id, title, type: video.type, size: video.size, createdAt: video.createdAt, blob: video.blob });
    }
  }

  async function deleteVideo(id) {
    const video = videos.find((v) => v.id === id);
    if (video) URL.revokeObjectURL(video.url);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    await dbDeleteVideo(id);
    refreshStorageEstimate();
  }

  const totalVideoBytes = videos.reduce((s, v) => s + (v.size || 0), 0);
  const avgVideoBytes = videos.length > 0 ? totalVideoBytes / videos.length : 75 * 1024 * 1024;
  const usagePct = storageEstimate && storageEstimate.quota ? Math.min(100, Math.round((storageEstimate.usage / storageEstimate.quota) * 100)) : null;
  const remainingBytes = storageEstimate ? Math.max(0, storageEstimate.quota - storageEstimate.usage) : null;
  const estRemainingVideos = remainingBytes !== null ? Math.floor(remainingBytes / avgVideoBytes) : null;

  return (
    <Card theme={theme} delay={260}>
      <SectionLabel theme={theme} icon={<IconVideo />}>Fitness Videos</SectionLabel>
      <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "16px", lineHeight: 1.4 }}>
        Stored locally in this browser only — not backed up or synced.
      </div>

      {storageSupported && storageEstimate && (
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "11.5px",
              color: theme.textMuted,
              marginBottom: "6px",
              gap: "8px",
            }}
          >
            <span>
              {formatBytes(storageEstimate.usage)} used of {formatBytes(storageEstimate.quota)}
            </span>
            {estRemainingVideos !== null && (
              <span style={{ color: theme.textFaint, flexShrink: 0 }}>
                ~{estRemainingVideos.toLocaleString()} more 1-min video{estRemainingVideos === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${usagePct || 0}%`,
                borderRadius: "999px",
                background: theme.progressFill,
                backgroundImage: typeof theme.progressFill === "string" && theme.progressFill.includes("gradient") ? theme.progressFill : undefined,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      <TikTokConnect theme={theme} integrations={integrations} setIntegrations={setIntegrations} />

      {dbError && (
        <div style={{ fontSize: "13px", color: theme.danger, marginBottom: "14px" }}>{dbError}</div>
      )}

      {loading ? (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>Loading videos…</div>
      ) : videos.length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "18px" }}>
          No videos yet — upload one below.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {videos.map((v) => {
            const status = statusById[v.id];
            return (
              <div
                key={v.id}
                style={{
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <video
                  src={v.url}
                  controls
                  style={{ width: "100%", borderRadius: "8px", background: "#000", display: "block", maxHeight: "220px" }}
                />
                <input
                  value={v.title}
                  onChange={(e) => renameVideo(v.id, e.target.value)}
                  className="v-input"
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: theme.text,
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    padding: "2px 0",
                    "--focus-ring": theme.accentSoft,
                    "--focus-border": "transparent",
                  }}
                />
                <div style={{ fontSize: "11px", color: theme.textFaint }}>{formatBytes(v.size)}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => shareVideoFile(v, (s) => setStatus(v.id, s))}
                    className="v-btn"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      background: theme.accent,
                      color: theme.accentText,
                      border: "none",
                      borderRadius: "8px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <IconShare />
                    Share to TikTok
                  </button>
                  <button
                    onClick={() => deleteVideo(v.id)}
                    title="Delete"
                    className="v-btn"
                    style={{
                      border: `1px solid ${theme.inputBorder}`,
                      background: "transparent",
                      color: theme.danger,
                      borderRadius: "8px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <IconClose size={13} />
                  </button>
                </div>
                {status && (
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: status.type === "error" ? theme.danger : theme.positive,
                    }}
                  >
                    {status.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        disabled={uploading}
        className="v-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: theme.accent,
          color: theme.accentText,
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "13.5px",
          fontWeight: 700,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <IconUpload />
        {uploading ? "Saving…" : "Upload Video"}
      </button>
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />
    </Card>
  );
}

const QUIZ_STEPS = ["Genres", "Activities", "Top 3", "Anything else?"];

function QuizModal({ theme, profile, setProfile, onClose }) {
  const [step, setStep] = useState(0);

  const genres = profile.genres;
  const activities = profile.activities;
  const topPicks = profile.topPicks;
  const notes = profile.notes;

  const likedActivities = Object.keys(activities).filter((a) => activities[a] === "like");

  function toggleGenre(g) {
    const next = genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g];
    setProfile({ ...profile, genres: next });
  }

  function cycleActivity(a) {
    const current = activities[a] || "neutral";
    const next = current === "neutral" ? "like" : current === "like" ? "dislike" : "neutral";
    const nextActivities = { ...activities, [a]: next };
    const nextTopPicks = next !== "like" ? topPicks.filter((x) => x !== a) : topPicks;
    setProfile({ ...profile, activities: nextActivities, topPicks: nextTopPicks });
  }

  function toggleTopPick(a) {
    let next;
    if (topPicks.includes(a)) {
      next = topPicks.filter((x) => x !== a);
    } else if (topPicks.length >= 3) {
      return;
    } else {
      next = [...topPicks, a];
    }
    setProfile({ ...profile, topPicks: next });
  }

  function updateNotes(value) {
    setProfile({ ...profile, notes: value });
  }

  function finish() {
    setProfile({ ...profile, notes: notes.trim() });
    onClose();
  }

  const chipBase = {
    fontSize: "12.5px",
    fontWeight: 600,
    padding: "7px 12px",
    borderRadius: "999px",
    border: "1px solid transparent",
    cursor: "pointer",
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div
        className="v-scroll"
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "85vh",
          overflowY: "auto",
          "--scroll-thumb": theme.divider,
          ...cardBackgroundStyle(theme),
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.sectionLabelColor,
                marginBottom: "6px",
              }}
            >
              Taste Quiz &middot; Step {step + 1} of {QUIZ_STEPS.length}
            </div>
            <div style={{ fontSize: "19px", fontWeight: 800, color: theme.text }}>{QUIZ_STEPS[step]}</div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="v-btn"
            style={{
              border: "none",
              background: theme.accentSoft,
              color: theme.text,
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ display: "flex", gap: "5px", marginBottom: "20px" }}>
          {QUIZ_STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                height: "3px",
                flex: 1,
                borderRadius: "999px",
                background: i <= step ? theme.accent : theme.progressTrack,
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <div>
            <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: 0, marginBottom: "16px", lineHeight: 1.5 }}>
              Pick every genre you enjoy in movies or TV — as many as apply.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUIZ_GENRES.map((g) => {
                const active = genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className="v-btn"
                    style={{
                      ...chipBase,
                      background: active ? theme.accentSoft : theme.chip,
                      color: active ? theme.accent : theme.chipText,
                      borderColor: active ? theme.accent : "transparent",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: 0, marginBottom: "16px", lineHeight: 1.5 }}>
              Tap each activity to cycle through: skip &rarr; like &rarr; dislike &rarr; skip.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUIZ_ACTIVITIES.map((a) => {
                const state = activities[a] || "neutral";
                const style =
                  state === "like"
                    ? { background: theme.chip, color: theme.positive, borderColor: theme.positive }
                    : state === "dislike"
                    ? { background: theme.dangerSoft, color: theme.danger, borderColor: theme.danger }
                    : { background: theme.chip, color: theme.chipText, borderColor: "transparent" };
                return (
                  <button key={a} onClick={() => cycleActivity(a)} className="v-btn" style={{ ...chipBase, ...style }}>
                    {state === "like" ? "✓ " : state === "dislike" ? "✕ " : ""}
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: 0, marginBottom: "16px", lineHeight: 1.5 }}>
              Of the ones you liked, pick up to 3 you'd actually want to make time for. Suggestions will
              prioritize these.
            </p>
            {likedActivities.length === 0 ? (
              <div style={{ fontSize: "13px", color: theme.textFaint }}>
                Go back and mark a few activities as liked first.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {likedActivities.map((a) => {
                  const rank = topPicks.indexOf(a);
                  const active = rank !== -1;
                  return (
                    <button
                      key={a}
                      onClick={() => toggleTopPick(a)}
                      className="v-btn"
                      style={{
                        ...chipBase,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: active ? theme.accentSoft : theme.chip,
                        color: active ? theme.accent : theme.chipText,
                        borderColor: active ? theme.accent : "transparent",
                      }}
                    >
                      {active && (
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: theme.accent,
                            color: theme.accentText,
                            fontSize: "10px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {rank + 1}
                        </span>
                      )}
                      {a}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: 0, marginBottom: "12px", lineHeight: 1.5 }}>
              Favorite movie, show, hobby, anything — free text, totally optional.
            </p>
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="e.g. Big fan of heist movies, just got into pottery..."
              className="v-input"
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: "8px",
                color: theme.inputText,
                padding: "10px 12px",
                fontSize: "13.5px",
                fontFamily: "inherit",
                "--focus-ring": theme.accentSoft,
                "--focus-border": theme.accent,
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", gap: "10px" }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="v-btn"
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: `1px solid ${theme.inputBorder}`,
              background: "transparent",
              color: theme.text,
              fontSize: "13px",
              fontWeight: 700,
              opacity: step === 0 ? 0.4 : 1,
              cursor: step === 0 ? "default" : "pointer",
            }}
          >
            Back
          </button>
          {step < QUIZ_STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(QUIZ_STEPS.length - 1, s + 1))}
              className="v-btn"
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background: theme.accent,
                color: theme.accentText,
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              className="v-btn"
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background: theme.accent,
                color: theme.accentText,
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProfileSection({ theme, profile, setProfile }) {
  const [tag, setTag] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);

  const quizTaken = profile.genres.length > 0 || Object.keys(profile.activities).length > 0;
  const likedCount = Object.values(profile.activities).filter((v) => v === "like").length;

  function addInterest() {
    const trimmed = tag.trim();
    if (!trimmed) { toast.info("Type an interest first."); focusField("interest"); return; }
    if (profile.interests.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      // Clearing the box silently read as success; it was a duplicate.
      toast.info("“" + trimmed + "” is already listed.");
      setTag("");
      return;
    }
    setProfile({ ...profile, interests: [...profile.interests, trimmed] });
    setTag("");
  }

  function removeInterest(interest) {
    setProfile({ ...profile, interests: profile.interests.filter((i) => i !== interest) });
  }

  return (
    <Card theme={theme} delay={200}>
      <SectionLabel theme={theme} icon={<IconUser />}>About Me</SectionLabel>
      <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "14px", lineHeight: 1.4 }}>
        Interests power the suggestions above — add what you're into.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
        {profile.interests.map((interest) => (
          <span
            key={interest}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: theme.chipText,
              background: theme.chip,
              padding: "6px 10px",
              borderRadius: "999px",
            }}
          >
            {interest}
            <button
              onClick={() => removeInterest(interest)}
              className="v-btn"
              title="Remove"
              style={{
                border: "none",
                background: "transparent",
                color: theme.chipText,
                fontSize: "12px",
                lineHeight: 1,
                padding: 0,
                opacity: 0.7,
              }}
            >
              ×
            </button>
          </span>
        ))}
        {profile.interests.length === 0 && (
          <span style={{ fontSize: "13px", color: theme.textFaint }}>No interests added yet.</span>
        )}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          id="v-field-interest"
          placeholder="Add an interest (e.g. Cooking)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addInterest()}
          className="v-input"
          style={{
            flex: 1,
            minWidth: 0,
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: "8px",
            color: theme.inputText,
            padding: "9px 12px",
            fontSize: "14px",
            "--focus-ring": theme.accentSoft,
            "--focus-border": theme.accent,
          }}
        />
        <button
          onClick={addInterest}
          className="v-btn"
          style={{
            background: theme.accent,
            color: theme.accentText,
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Add
        </button>
      </div>

      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: `1px solid ${theme.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "12px", color: theme.textMuted, lineHeight: 1.4 }}>
          {quizTaken ? (
            <>
              Taste quiz: {profile.genres.length} genre{profile.genres.length === 1 ? "" : "s"}, {likedCount} liked
              activit{likedCount === 1 ? "y" : "ies"}.
            </>
          ) : (
            "Take the taste quiz to power richer, more specific suggestions."
          )}
        </div>
        <button
          onClick={() => setQuizOpen(true)}
          className="v-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flexShrink: 0,
            background: theme.accentSoft,
            color: theme.text,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: "8px",
            padding: "7px 14px",
            fontSize: "12.5px",
            fontWeight: 700,
          }}
        >
          <IconChecklist />
          {quizTaken ? "Retake Quiz" : "Take the Quiz"}
        </button>
      </div>

      {quizOpen && <QuizModal theme={theme} profile={profile} setProfile={setProfile} onClose={() => setQuizOpen(false)} />}
    </Card>
  );
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function BriefingModal({ theme, suggestions, weather, onClose }) {
  // This is the first thing the app shows each morning, so it has to behave
  // like every other overlay: Escape closes it, clicking the backdrop closes
  // it, focus moves in and comes back out.
  const panelRef = useRef(null);
  const titleId = useRef("briefing-" + Math.random().toString(36).slice(2, 9)).current;
  useOverlayBehaviour(onClose, panelRef);
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayWeather = weather && weather.days ? weather.days.find((d) => d.date === todayIso) : null;
  const todayInfo = todayWeather ? weatherInfo(todayWeather.code) : null;

  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="v-scroll"
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "85vh",
          overflowY: "auto",
          "--scroll-thumb": theme.divider,
          ...cardBackgroundStyle(theme),
          padding: "30px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.sectionLabelColor,
            marginBottom: "8px",
          }}
        >
          {dateLabel}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "6px",
          }}
        >
          <div id={titleId} style={{ fontSize: "26px", fontWeight: 800, color: theme.text }}>{greetingForNow()}</div>
          {todayInfo && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: theme.textMuted,
                background: theme.accentSoft,
                border: `1px solid ${theme.divider}`,
                borderRadius: "999px",
                padding: "4px 12px",
              }}
            >
              <span>{todayInfo.icon}</span>
              {todayWeather.tempMax}&deg;/{todayWeather.tempMin}&deg; {todayInfo.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: "14px", color: theme.textMuted, marginBottom: "24px" }}>
          {suggestions.length > 0
            ? "Here's what's worth knowing for your day."
            : "Nothing urgent on deck — clean slate today."}
        </div>

        {suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "26px" }}>
            {suggestions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <span style={{ color: theme.accent, flexShrink: 0, marginTop: "2px" }}>
                  <IconBulb size={18} />
                </span>
                <span style={{ fontSize: "14.5px", color: theme.text, lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="v-btn"
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            background: theme.accent,
            color: theme.accentText,
            fontSize: "14.5px",
            fontWeight: 700,
          }}
        >
          Let's go
        </button>
      </div>
    </div>,
    document.body
  );
}

const PRIORITY_AMBER = "#e8a33d";

function priorityDotColor(theme, priority) {
  if (priority === "urgent") return theme.danger;
  if (priority === "attention") return PRIORITY_AMBER;
  if (priority === "positive") return theme.positive;
  return theme.accent;
}

function SuggestionsSection({ theme, suggestions, onOpenBriefing, weather, weatherStatus, onEnableWeather }) {
  const weatherEnabled = weather && weather.lat != null;
  return (
    <Card theme={theme} delay={0}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "6px",
          flexWrap: "wrap",
        }}
      >
        <SectionLabel theme={theme} icon={<IconBulb size={16} />} style={{ marginBottom: 0 }}>
          For You
        </SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            onClick={onOpenBriefing}
            className="v-btn"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.accent,
              background: "transparent",
              border: "none",
              padding: "4px 6px",
              flexShrink: 0,
            }}
          >
            View briefing
          </button>
        </div>
      </div>
      {weatherStatus && weatherStatus.type === "error" && (
        <div style={{ fontSize: "12px", color: theme.danger, marginBottom: "14px" }}>{weatherStatus.message}</div>
      )}
      {suggestions.length > 0 ? (
        <div style={{ "--stream-divider": theme.divider }}>
          {suggestions.map((s) => (
            <div key={s.id} className="v-stream-item">
              <span
                style={{
                  flexShrink: 0,
                  marginTop: "7px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: priorityDotColor(theme, s.priority),
                  boxShadow: `0 0 0 3px ${theme.accentSoft}`,
                }}
              />
              <span style={{ fontSize: "15px", color: theme.text, lineHeight: 1.55 }}>{s.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "14px", color: theme.textFaint }}>
          Nothing urgent right now — keep up the good work.
        </div>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------------
   THEME SWITCHER
---------------------------------------------------------------------- */

const THEME_GROUPS = [
  { label: "Light", keys: ["minimal", "blossom", "citrus", "latte", "sky", "sunset", "forest", "pastel", "glass", "auroraGlass"] },
  {
    label: "Dark",
    keys: [
      "navyGold",
      "darkModern",
      "cyberpunk",
      "obsidian",
      "crimsonNoir",
      "emeraldMidnight",
      "amberTerminal",
      "amethyst",
      "oceanAbyss",
      "roseGold",
      "aurora",
      "electric",
      "neonMint",
      "slateSteel",
      "nord",
      "tokyoNight",
      "dracula",
      "gruvbox",
    ],
  },
];

function swatchFill(t) {
  const bg = t.pageBgGradient && t.pageBgGradient !== "none" ? t.pageBgGradient : t.pageBg;
  const isGradient = typeof bg === "string" && bg.includes("gradient");
  return isGradient ? { backgroundImage: bg } : { background: bg };
}

function ThemeSwatch({ theme, themeKey: key, t, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      title={t.name}
      className="v-swatch"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "7px",
        padding: "6px",
        border: "none",
        background: "transparent",
      }}
    >
      <span
        className="v-swatch-box"
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "13px",
          display: "block",
          position: "relative",
          border: active ? `2px solid ${theme.accent}` : `1px solid ${theme.divider}`,
          boxShadow: active ? `0 0 0 3px ${theme.accentSoft}` : "none",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          ...swatchFill(t),
        }}
      >
        <span
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            width: "11px",
            height: "11px",
            borderRadius: "50%",
            background: t.accent,
            boxShadow: "0 0 0 2px rgba(0,0,0,0.28)",
          }}
        />
        {active && (
          <span
            style={{
              position: "absolute",
              top: "5px",
              left: "5px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: theme.accent,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.28)",
            }}
          />
        )}
      </span>
      <span
        style={{
          fontSize: "10.5px",
          fontWeight: active ? 700 : 500,
          color: active ? theme.text : theme.textMuted,
          textAlign: "center",
          lineHeight: 1.15,
          maxWidth: "62px",
        }}
      >
        {t.name}
      </span>
    </button>
  );
}

function ThemePopover({ theme, themeKey, setThemeKey, onClose }) {
  return (
    <div
      className="v-scroll"
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        width: "300px",
        maxWidth: "min(92vw, 320px)",
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 50,
        padding: "18px 16px",
        "--scroll-thumb": theme.divider,
        ...cardBackgroundStyle(theme),
      }}
    >
      {THEME_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: group.label === "Dark" ? 0 : "18px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.sectionLabelColor,
              marginBottom: "10px",
              paddingLeft: "2px",
            }}
          >
            {group.label}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "2px",
            }}
          >
            {group.keys.map((key) => (
              <ThemeSwatch
                key={key}
                theme={theme}
                themeKey={key}
                t={THEMES[key]}
                active={key === themeKey}
                onSelect={() => {
                  setThemeKey(key);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemePicker({ theme, themeKey, setThemeKey }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = THEMES[themeKey];

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={wrapRef} className="v-themewrap" style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="v-btn v-themebtn"
        title={current.name + " theme"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "6px 14px 6px 6px",
          borderRadius: "999px",
          border: `1px solid ${theme.cardBorder}`,
          background: theme.accentSoft,
          color: theme.text,
          fontSize: "13px",
          fontWeight: 600,
          maxWidth: "min(40vw, 160px)",
        }}
      >
        <span
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            flexShrink: 0,
            display: "inline-block",
            border: `1px solid ${theme.divider}`,
            ...swatchFill(current),
          }}
        />
        <span
          className="v-railonly"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {current.name}
        </span>
        <span
          className="v-railonly"
          style={{
            fontSize: "9px",
            color: theme.textMuted,
            display: "inline-block",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        >
          &#9662;
        </span>
      </button>

      {open && (
        <ThemePopover theme={theme} themeKey={themeKey} setThemeKey={setThemeKey} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   SHARED WITH LAZY-LOADED CHUNKS

   These used to live inside the Raven's Eye section below, but Raven's Eye
   is now compiled separately (app.ravenseye.jsx -> chunk-ravenseye.js) and
   only loaded when that page is actually opened — see loadChunk()/window.__v
   near the bottom of this file. Everything here is needed by code that runs
   unconditionally (backup/restore, the digest PDF buttons, Fantasy/SecurityX
   theme bridges), so it stays in the core bundle instead of the chunk.
---------------------------------------------------------------------- */

// Rough luminance check on the active Vantage theme's page background —
// used to set color-scheme (native form control theming: date pickers,
// scrollbars) for the ported tabs below, since Vantage has many named
// themes rather than a single light/dark switch.
function vantageIsDarkTheme(theme) {
  const hex = String(theme?.pageBg || "#ffffff").replace("#", "");
  if (hex.length !== 6) return true;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function IconRavenEye({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7-10.5-7-10.5-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}

const RAVEN_THREAT_MODEL_STATUS = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "info" },
  needs_review: { label: "Needs review", tone: "warning" },
  complete: { label: "Complete", tone: "good" },
};

const RAVEN_PENTEST_STATUS = {
  not_started: { label: "Not started", tone: "muted" },
  scheduled: { label: "Scheduled", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  needs_retest: { label: "Needs retest", tone: "warning" },
  complete: { label: "Complete", tone: "good" },
};

const RAVEN_FINDING_STATUS = {
  open: { label: "Open", tone: "critical" },
  in_progress: { label: "In progress", tone: "warning" },
  fixed: { label: "Fixed", tone: "good" },
  accepted_risk: { label: "Accepted risk", tone: "muted" },
  wont_fix: { label: "Won't fix", tone: "muted" },
};

const RAVEN_SEVERITY = {
  critical: { label: "Critical", tone: "critical" },
  high: { label: "High", tone: "serious" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "good" },
  info: { label: "Info", tone: "muted" },
};

function ravenEmptyThreatModel() {
  return {
    status: "not_started",
    version: "",
    lastReviewed: null,
    reviewedBy: "",
    reportRef: "",
    reportFileId: null,
    nextRetestDue: null,
    risks: [],
  };
}

function ravenEmptyPenTest() {
  return {
    status: "not_started",
    lastEngagementDate: null,
    tester: "",
    reportRef: "",
    reportFileId: null,
    nextRetestDue: null,
    findings: [],
  };
}

// Lazily pulls pdfmake + its font virtual filesystem from CDN — vfs_fonts.js
// self-registers onto window.pdfMake once loaded after the core script, so
// no manual addVirtualFileSystem() call is needed here. Shared by the weekly
///annual digest buttons below and (via the chunk bridge) Raven's Eye's own
// PDF report export.
function ravenLoadPdfMake() {
  if (window.pdfMake && window.pdfMake.fonts && window.pdfMake.fonts.Roboto) return Promise.resolve(window.pdfMake);
  if (window.__ravenPdfMakePromise) return window.__ravenPdfMakePromise;
  window.__ravenPdfMakePromise = new Promise((resolve, reject) => {
    const core = document.createElement("script");
    core.src = "https://cdn.jsdelivr.net/npm/pdfmake@0.3.11/build/pdfmake.min.js";
    core.integrity = "sha384-vsaIaEjAOZA6uoCQ2pryCKIc8YGpQ/0HK5krdezL4PYvnmLzrizBMDJCZulvIomS";
    core.crossOrigin = "anonymous";
    core.onload = () => {
      const fonts = document.createElement("script");
      fonts.src = "https://cdn.jsdelivr.net/npm/pdfmake@0.3.11/build/vfs_fonts.js";
      fonts.integrity = "sha384-pkBUW1wxcm6m7ZjKDxADnNHqnz+Sx9sAL1ndsLNv/GZnWZgodPYsju1yxeyQnn0c";
      fonts.crossOrigin = "anonymous";
      fonts.onload = () =>
        window.pdfMake && window.pdfMake.fonts && window.pdfMake.fonts.Roboto
          ? resolve(window.pdfMake)
          : reject(new Error("PDF library failed to initialize."));
      fonts.onerror = () => {
        window.__ravenPdfMakePromise = null;
        reject(new Error("Couldn't load the PDF library's fonts (are you offline?)."));
      };
      document.head.appendChild(fonts);
    };
    core.onerror = () => {
      window.__ravenPdfMakePromise = null;
      reject(new Error("Couldn't load the PDF library (are you offline?)."));
    };
    document.head.appendChild(core);
  });
  return window.__ravenPdfMakePromise;
}

// The following were relocated out of the Mechanical Orchard section when it
// moved to its own chunk (see loadChunk()/window.__v near the bottom of this
// file): each is used by something outside MO that has to work whether or
// not that chunk is ever loaded (Resume's download button, the always-on
// Reminders list, BriefingModal, the Music page's Last.fm connect button,
// PAGE_META's nav icons, and App()'s own default-state initializers).
const DEFAULT_MO_LINKS = [
  { id: "pondurance", label: "Pondurance", url: "" },
  { id: "s1", label: "SentinelOne (S1)", url: "" },
  { id: "iru", label: "IRU", url: "" },
  { id: "ravenna", label: "Ravenna", url: "" },
];

function moDownload(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function moFormatTs(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch (e) {
    return ts;
  }
}

// ~20 policies/procedures a security program is commonly expected to maintain
// (mapped loosely to ISO 27001 / NIST CSF / SOC 2 themes). Seeded on first run;
// fully editable — add your own, delete what doesn't apply.
const DEFAULT_MO_POLICIES = [
  { id: "pol-infosec", name: "Information Security Policy (master)", category: "Governance" },
  { id: "pol-risk", name: "Risk Management Policy", category: "Governance" },
  { id: "pol-aup", name: "Acceptable Use Policy", category: "Governance" },
  { id: "pol-awareness", name: "Security Awareness & Training Policy", category: "Governance" },
  { id: "pol-vendor", name: "Third-Party / Vendor Risk Management Policy", category: "Governance" },
  { id: "pol-access", name: "Access Control Policy", category: "Access & Identity" },
  { id: "pol-iam", name: "Identity & Access Management (Provisioning/Deprovisioning) Procedure", category: "Access & Identity" },
  { id: "pol-password", name: "Password & Authentication Policy", category: "Access & Identity" },
  { id: "pol-dataclass", name: "Data Classification & Handling Policy", category: "Data Protection" },
  { id: "pol-retention", name: "Data Retention & Disposal Policy", category: "Data Protection" },
  { id: "pol-crypto", name: "Encryption & Key Management Policy", category: "Data Protection" },
  { id: "pol-vuln", name: "Vulnerability Management Policy", category: "Operations" },
  { id: "pol-patch", name: "Patch Management Procedure", category: "Operations" },
  { id: "pol-change", name: "Change Management Policy", category: "Operations" },
  { id: "pol-logging", name: "Logging & Monitoring Policy", category: "Operations" },
  { id: "pol-backup", name: "Backup & Recovery Policy", category: "Operations" },
  { id: "pol-ir", name: "Incident Response Plan & Procedure", category: "Resilience" },
  { id: "pol-bcdr", name: "Business Continuity & Disaster Recovery Plan", category: "Resilience" },
  { id: "pol-endpoint", name: "Endpoint Security & Malware Protection Policy", category: "Infrastructure" },
  { id: "pol-network", name: "Network Security Policy", category: "Infrastructure" },
];

function moDefaultPolicies() {
  return DEFAULT_MO_POLICIES.map((p) => ({ ...p, status: "todo", owner: "", notes: "", hasFile: false, fileName: "", fileType: "", fileSize: 0, updatedAt: null }));
}

/* ---- Icons for the Mechanical Orchard hub ---- */
function IconOrchard({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-6" />
      <path d="M12 16a6 6 0 0 0 6-6c0-3-2.5-6-6-6S6 7 6 10a6 6 0 0 0 6 6z" />
      <path d="M12 10.5l2-2M12 12.5l-2-2" />
    </svg>
  );
}

function IconShield({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function IconCertificate({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L8 21l4-2 4 2-1-7.5" />
      <path d="M12 7.2l.8 1.5 1.7.2-1.2 1.2.3 1.7-1.6-.9-1.6.9.3-1.7L9.5 8.9l1.7-.2z" />
    </svg>
  );
}

function IconExternal({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

function IconAcademic({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4L2 9l10 5 10-5-10-5z" />
      <path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
      <path d="M22 9v5" />
    </svg>
  );
}

function IconClipboard({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

function IconDeck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v3M8 21h8" />
    </svg>
  );
}

const DEFAULT_APP_NOTICE = { sender: "", team: "Mechanical Orchard Security", tone: "friendly", history: [] };

function IconMegaphone({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l14-6v13L3 13z" />
      <path d="M3 11v2a2 2 0 0 0 2 2h1" />
      <path d="M8 15.6V19a1.6 1.6 0 0 0 3.2 0v-1.6" />
      <path d="M17 8a3 3 0 0 1 0 5" />
    </svg>
  );
}

// Shared overlay behaviour: Escape, background scroll lock, focus move+restore.
// Context flag: true when a MoModal is rendering embedded inside the
// Mechanical Orchard page rather than as a portal-backed dialog. Created once
// here in core and bridged into the chunk, so both sides see the same
// Provider — a second createContext() call in the chunk would make its own
// useContext() see only the default value, never the value set by App().
const MoEmbedContext = createContext(false);

function useOverlayBehaviour(onClose, panelRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const opener = typeof document !== "undefined" ? document.activeElement : null;
    const FOCUSABLE = [
      "a[href]", "button:not([disabled])", "input:not([disabled]):not([type=\"hidden\"])",
      "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex=\"-1\"])",
    ].join(", ");
    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      // Keep Tab inside the dialog. Without this, focus walks out to the page
      // behind the backdrop and those controls are still operable.
      if (e.key !== "Tab") return;
      const panel = panelRef && panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!items.length) { e.preventDefault(); panel.focus && panel.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);

    const releaseScroll = lockBodyScroll();

    const focusTimer = setTimeout(() => {
      const panel = panelRef && panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(
        'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (first && typeof first.focus === "function") first.focus({ preventScroll: true });
    }, 0);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      releaseScroll();
      if (opener && typeof opener.focus === "function") opener.focus({ preventScroll: true });
    };
  }, [onClose, panelRef, enabled]);
}

function MoButton({ theme, onClick, children, variant, disabled, style }) {
  const primary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="v-btn"
      style={{
        display: "inline-flex", alignItems: "center", gap: "7px",
        padding: "9px 15px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
        border: `1px solid ${primary ? theme.accent : theme.cardBorder}`,
        background: primary ? theme.accent : theme.accentSoft,
        color: primary ? theme.accentText : theme.text,
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const DEFAULT_DAILY_LOG = { notes: "", entries: [] };

const DEFAULT_KEV = { entries: null, catalogVersion: null, dateReleased: null, count: 0, fetchedAt: null };

function IconWrench({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.6-.7-.7-2.6 2.4-2.4z" />
    </svg>
  );
}

function IconEnvelope({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

/* ----------------------------------------------------------------------
   BACKUP & RESTORE
---------------------------------------------------------------------- */

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function sanitizeHistorySeries(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((p) => isPlainObject(p) && typeof p.date === "string" && Number.isFinite(Number(p.value)))
    .map((p) => ({ date: p.date, value: Number(p.value) }))
    .slice(-30);
}

// The original export listed data sets by hand, so everything added after it
// was written — habits, reading, games, birthdays, movies, subscriptions, news,
// sports, golf scorecards, the app lock, reminders and every Mechanical Orchard
// tool — was silently absent from backups. Snapshot the registry instead, so a
// new feature is covered the moment it registers a storage key.
function snapshotAllStorage() {
  const data = {};
  if (typeof localStorage === "undefined") return data;
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return;
      data[key] = JSON.parse(raw);
    } catch (e) {
      /* unparseable entry — skip it rather than abort the whole backup */
    }
  });
  return data;
}

// Returns the number of restored data sets, or -1 if the payload has no
// full-snapshot section (a v1 file, which the legacy path handles).
function restoreAllStorage(data) {
  if (!isPlainObject(data) || typeof localStorage === "undefined") return -1;
  const known = new Set(Object.values(STORAGE_KEYS));
  let n = 0;
  Object.keys(data).forEach((key) => {
    if (!known.has(key)) return; // ignore anything not ours
    try {
      localStorage.setItem(key, JSON.stringify(data[key]));
      n += 1;
    } catch (e) {
      /* quota or private-mode failure — keep going, report the count we managed */
    }
  });
  return n;
}

function sanitizeBackup(parsed) {
  const out = {};
  if (!isPlainObject(parsed)) return out;

  if (typeof parsed.theme === "string" && THEMES[parsed.theme]) {
    out.theme = parsed.theme;
  }
  if (isPlainObject(parsed.fitness)) {
    const f = parsed.fitness;
    out.fitness = {
      benchLbs: Number(f.benchLbs) || DEFAULT_FITNESS.benchLbs,
      benchReps: Number(f.benchReps) || DEFAULT_FITNESS.benchReps,
      currentWeight: Number(f.currentWeight) || DEFAULT_FITNESS.currentWeight,
      targetWeight: Number(f.targetWeight) || DEFAULT_FITNESS.targetWeight,
    };
  }
  if (isPlainObject(parsed.golf)) {
    const g = parsed.golf;
    out.golf = {
      roundsYtd: Number(g.roundsYtd) || DEFAULT_GOLF.roundsYtd,
      handicap: Number.isFinite(Number(g.handicap)) ? Number(g.handicap) : DEFAULT_GOLF.handicap,
    };
  }
  if (Array.isArray(parsed.trackers)) {
    out.trackers = parsed.trackers
      .filter((t) => isPlainObject(t) && typeof t.label === "string" && t.label.trim())
      .map((t, i) => ({
        id: typeof t.id === "string" && t.id ? t.id : "t" + Date.now() + i,
        label: String(t.label),
        value: String(t.value ?? ""),
        target: String(t.target ?? ""),
      }));
  }
  if (isPlainObject(parsed.profile) && Array.isArray(parsed.profile.interests)) {
    const p = parsed.profile;
    const activities = isPlainObject(p.activities) ? p.activities : {};
    const validActivityStates = new Set(["like", "dislike", "neutral"]);
    out.profile = {
      interests: p.interests.filter((i) => typeof i === "string" && i.trim()).map(String),
      genres: Array.isArray(p.genres) ? p.genres.filter((g) => typeof g === "string" && g.trim()).map(String) : [],
      activities: Object.fromEntries(
        Object.entries(activities).filter(([, v]) => validActivityStates.has(v))
      ),
      topPicks: Array.isArray(p.topPicks)
        ? p.topPicks.filter((t) => typeof t === "string" && t.trim()).map(String).slice(0, 3)
        : [],
      notes: typeof p.notes === "string" ? p.notes : "",
    };
  }
  if (isPlainObject(parsed.financial)) {
    const fi = parsed.financial;
    out.financial = {
      targetDownPayment: Number(fi.targetDownPayment) || DEFAULT_FINANCIAL.targetDownPayment,
      timelineLow: Number(fi.timelineLow) || DEFAULT_FINANCIAL.timelineLow,
      timelineHigh: Number(fi.timelineHigh) || DEFAULT_FINANCIAL.timelineHigh,
      currentSavings: Number.isFinite(Number(fi.currentSavings)) ? Number(fi.currentSavings) : DEFAULT_FINANCIAL.currentSavings,
    };
  }
  if (Array.isArray(parsed.events)) {
    out.events = parsed.events
      .filter((e) => isPlainObject(e) && typeof e.title === "string" && e.title.trim() && typeof e.date === "string")
      .map((e, i) => ({
        id: typeof e.id === "string" && e.id ? e.id : "pe" + Date.now() + i,
        title: String(e.title),
        date: String(e.date),
        detail: String(e.detail ?? ""),
      }));
  }
  if (isPlainObject(parsed.history)) {
    const h = parsed.history;
    out.history = {
      fitness: sanitizeHistorySeries(h.fitness),
      golf: sanitizeHistorySeries(h.golf),
      trackers: isPlainObject(h.trackers)
        ? Object.fromEntries(Object.entries(h.trackers).map(([k, v]) => [k, sanitizeHistorySeries(v)]))
        : {},
    };
  }
  if (Array.isArray(parsed.watchlist)) {
    const validStatuses = new Set(["queued", "watching", "done"]);
    out.watchlist = parsed.watchlist
      .filter((w) => isPlainObject(w) && typeof w.title === "string" && w.title.trim())
      .map((w, i) => ({
        id: typeof w.id === "string" && w.id ? w.id : "w" + Date.now() + i,
        title: String(w.title),
        type: w.type === "show" ? "show" : "movie",
        status: validStatuses.has(w.status) ? w.status : "queued",
      }));
  }
  if (Array.isArray(parsed.journal)) {
    out.journal = parsed.journal
      .filter((e) => isPlainObject(e) && typeof e.date === "string" && e.date.trim())
      .map((e) => ({ date: String(e.date), text: typeof e.text === "string" ? e.text : "" }));
  }
  if (Array.isArray(parsed.goals)) {
    out.goals = parsed.goals
      .filter((g) => isPlainObject(g) && typeof g.label === "string" && g.label.trim())
      .map((g, i) => ({
        id: typeof g.id === "string" && g.id ? g.id : "g" + Date.now() + i,
        label: String(g.label),
        status: GOAL_STATUSES.includes(g.status) ? g.status : "not-started",
      }));
  }
  if (Array.isArray(parsed.transactions)) {
    out.transactions = parsed.transactions
      .filter((t) => isPlainObject(t) && typeof t.merchant === "string" && t.merchant.trim() && Number.isFinite(Number(t.amount)))
      .map((t, i) => ({
        id: typeof t.id === "string" && t.id ? t.id : "tx" + Date.now() + i,
        date: typeof t.date === "string" && t.date.trim() ? t.date : new Date().toISOString().slice(0, 10),
        merchant: String(t.merchant),
        amount: Math.abs(Number(t.amount)) || 0,
        category: typeof t.category === "string" && t.category.trim() ? t.category : "Uncategorized",
      }));
  }
  if (isPlainObject(parsed.youtube)) {
    out.youtube = {
      lastSeenAt: Number.isFinite(Number(parsed.youtube.lastSeenAt)) ? Number(parsed.youtube.lastSeenAt) : null,
    };
  }
  // Round metadata backs up; the scorecard photos themselves stay local
  // (IndexedDB, same as the video library) so a restored backup keeps the
  // numbers but not the images — same trade-off already made for videos.
  function sanitizeGolfRounds(arr) {
    if (!Array.isArray(arr)) return null;
    const numOrNull = (v) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);
    return arr
      .filter((r) => isPlainObject(r) && typeof r.course === "string" && r.course.trim() && typeof r.date === "string")
      .map((r, i) => ({
        id: typeof r.id === "string" && r.id ? r.id : "gr" + Date.now() + i,
        date: r.date,
        course: String(r.course),
        par: Number(r.par) || 72,
        front9: Number(r.front9) || 0,
        back9: Number(r.back9) || 0,
        fairwayHits: numOrNull(r.fairwayHits),
        gir: numOrNull(r.gir),
        avgDrivingDistance: numOrNull(r.avgDrivingDistance),
        totalPutts: numOrNull(r.totalPutts),
        scrambling: numOrNull(r.scrambling),
        sandSaves: numOrNull(r.sandSaves),
        photoIds: [],
      }));
  }
  if (Array.isArray(parsed.golfSimRounds)) {
    const sanitized = sanitizeGolfRounds(parsed.golfSimRounds);
    if (sanitized) out.golfSimRounds = sanitized;
  }
  if (Array.isArray(parsed.golfOutdoorRounds)) {
    const sanitized = sanitizeGolfRounds(parsed.golfOutdoorRounds);
    if (sanitized) out.golfOutdoorRounds = sanitized;
  }
  // Fantasy tab — cheat sheets, custom rankings, watchlist, and linked
  // league IDs/keys are all localStorage-backed (see STORAGE_KEYS.fantasy*);
  // Yahoo's actual OAuth tokens never touch the browser, so there's nothing
  // Yahoo-specific to sanitize beyond the league keys themselves.
  if (isPlainObject(parsed.fantasyCheatSheets)) {
    const sheets = {};
    for (const [id, sheet] of Object.entries(parsed.fantasyCheatSheets)) {
      if (!isPlainObject(sheet) || typeof sheet.id !== "string" || !sheet.id.trim()) continue;
      const players = Array.isArray(sheet.players)
        ? sheet.players
            .filter((p) => isPlainObject(p) && typeof p.playerId === "string" && p.playerId.trim())
            .map((p) => ({
              playerId: p.playerId,
              round: Number.isFinite(Number(p.round)) ? Number(p.round) : null,
              note: typeof p.note === "string" ? p.note : "",
              drafted: Boolean(p.drafted),
            }))
        : [];
      sheets[id] = {
        id: sheet.id,
        name: typeof sheet.name === "string" ? sheet.name : "",
        scoringFormat: FF_FORMAT_PARAMS[sheet.scoringFormat] ? sheet.scoringFormat : "full",
        numTeams: Number(sheet.numTeams) || 12,
        notes: typeof sheet.notes === "string" ? sheet.notes : "",
        players,
        updatedAt: Number.isFinite(Number(sheet.updatedAt)) ? Number(sheet.updatedAt) : Date.now(),
      };
    }
    out.fantasyCheatSheets = sheets;
  }
  if (isPlainObject(parsed.fantasyCustomRankings)) {
    const sets = {};
    for (const [name, set] of Object.entries(parsed.fantasyCustomRankings)) {
      if (!isPlainObject(set) || !isPlainObject(set.entries)) continue;
      const entries = {};
      for (const [playerId, entry] of Object.entries(set.entries)) {
        if (!isPlainObject(entry)) continue;
        entries[playerId] = {
          sleeperId: typeof entry.sleeperId === "string" ? entry.sleeperId : playerId,
          value: Number(entry.value) || 0,
          overallRank: Number(entry.overallRank) || 0,
          positionRank: Number(entry.positionRank) || 0,
          trend30Day: Number(entry.trend30Day) || 0,
        };
      }
      sets[name] = { name, entries, createdAt: Number.isFinite(Number(set.createdAt)) ? Number(set.createdAt) : Date.now() };
    }
    out.fantasyCustomRankings = sets;
  }
  if (Array.isArray(parsed.fantasyWatchlist)) {
    out.fantasyWatchlist = parsed.fantasyWatchlist.filter((id) => typeof id === "string" && id.trim());
  }
  if (isPlainObject(parsed.fantasySleeper)) {
    const s = parsed.fantasySleeper;
    out.fantasySleeper = {
      username: typeof s.username === "string" ? s.username : "",
      userId: typeof s.userId === "string" ? s.userId : "",
      linkedLeagueIds: Array.isArray(s.linkedLeagueIds) ? s.linkedLeagueIds.filter((id) => typeof id === "string" && id.trim()) : [],
    };
  }
  if (isPlainObject(parsed.fantasyYahoo)) {
    const y = parsed.fantasyYahoo;
    out.fantasyYahoo = {
      linkedLeagueKeys: Array.isArray(y.linkedLeagueKeys) ? y.linkedLeagueKeys.filter((k) => typeof k === "string" && k.trim()) : [],
    };
  }
  // Raven's Eye — product tracking data backs up; uploaded report file blobs
  // stay local (IndexedDB, see RAVEN_DB_NAME), same photos/videos trade-off
  // made elsewhere: a restored backup keeps the findings but not the files.
  function sanitizeRavenFindingItem(item) {
    if (!isPlainObject(item) || typeof item.title !== "string" || !item.title.trim()) return null;
    const out = {
      id: typeof item.id === "string" && item.id ? item.id : "rf" + Date.now() + Math.random().toString(36).slice(2, 6),
      title: String(item.title),
      description: typeof item.description === "string" ? item.description : "",
      severity: RAVEN_SEVERITY[item.severity] ? item.severity : "medium",
      status: RAVEN_FINDING_STATUS[item.status] ? item.status : "open",
      fix: typeof item.fix === "string" ? item.fix : "",
      fixedDate: typeof item.fixedDate === "string" ? item.fixedDate : null,
      retestDate: typeof item.retestDate === "string" ? item.retestDate : null,
      retestStatus: typeof item.retestStatus === "string" ? item.retestStatus : "not_scheduled",
      source: typeof item.source === "string" ? item.source : "",
    };
    if (typeof item.identifiedDate === "string") out.identifiedDate = item.identifiedDate;
    if (typeof item.discoveredDate === "string") out.discoveredDate = item.discoveredDate;
    return out;
  }
  function sanitizeRavenThreatModel(tm) {
    if (!isPlainObject(tm)) return ravenEmptyThreatModel();
    return {
      status: RAVEN_THREAT_MODEL_STATUS[tm.status] ? tm.status : "not_started",
      version: typeof tm.version === "string" ? tm.version : "",
      lastReviewed: typeof tm.lastReviewed === "string" ? tm.lastReviewed : null,
      reviewedBy: typeof tm.reviewedBy === "string" ? tm.reviewedBy : "",
      reportRef: typeof tm.reportRef === "string" ? tm.reportRef : "",
      reportFileId: typeof tm.reportFileId === "string" ? tm.reportFileId : null,
      nextRetestDue: typeof tm.nextRetestDue === "string" ? tm.nextRetestDue : null,
      risks: Array.isArray(tm.risks) ? tm.risks.map(sanitizeRavenFindingItem).filter(Boolean) : [],
    };
  }
  function sanitizeRavenPenTest(pt) {
    if (!isPlainObject(pt)) return ravenEmptyPenTest();
    return {
      status: RAVEN_PENTEST_STATUS[pt.status] ? pt.status : "not_started",
      lastEngagementDate: typeof pt.lastEngagementDate === "string" ? pt.lastEngagementDate : null,
      tester: typeof pt.tester === "string" ? pt.tester : "",
      reportRef: typeof pt.reportRef === "string" ? pt.reportRef : "",
      reportFileId: typeof pt.reportFileId === "string" ? pt.reportFileId : null,
      nextRetestDue: typeof pt.nextRetestDue === "string" ? pt.nextRetestDue : null,
      findings: Array.isArray(pt.findings) ? pt.findings.map(sanitizeRavenFindingItem).filter(Boolean) : [],
    };
  }
  if (Array.isArray(parsed.ravenProducts)) {
    out.ravenProducts = parsed.ravenProducts
      .filter((p) => isPlainObject(p) && typeof p.id === "string" && p.id.trim() && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        id: String(p.id),
        name: String(p.name),
        owner: typeof p.owner === "string" ? p.owner : "",
        threatModel: sanitizeRavenThreatModel(p.threatModel),
        penTest: sanitizeRavenPenTest(p.penTest),
      }));
  }
  return out;
}

function IconBackup() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

function BackupMenu({
  theme,
  themeKey,
  fitness,
  golf,
  trackers,
  profile,
  financial,
  events,
  history,
  watchlist,
  journal,
  goals,
  transactions,
  youtube,
  golfSimRounds,
  golfOutdoorRounds,
  fantasyCheatSheets,
  fantasyCustomRankings,
  fantasyWatchlist,
  fantasySleeper,
  fantasyYahoo,
  ravenProducts,
  setThemeKey,
  setFitness,
  setGolf,
  setTrackers,
  setProfile,
  setFinancial,
  setEvents,
  setHistory,
  setWatchlist,
  setJournal,
  setGoals,
  setTransactions,
  setYoutube,
  setGolfSimRounds,
  setGolfOutdoorRounds,
  setFantasyCheatSheets,
  setFantasyCustomRankings,
  setFantasyWatchlist,
  setFantasySleeper,
  setFantasyYahoo,
  setRavenProducts,
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const wrapRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleExport() {
    const payload = {
      app: "personal-dashboard",
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: themeKey,
      fitness,
      golf,
      trackers,
      profile,
      financial,
      events,
      history,
      watchlist,
      journal,
      goals,
      transactions,
      youtube,
      golfSimRounds,
      golfOutdoorRounds,
      fantasyCheatSheets,
      fantasyCustomRankings,
      fantasyWatchlist,
      fantasySleeper,
      fantasyYahoo,
      ravenProducts,
      // Complete snapshot. The fields above are kept so an older build can
      // still read this file; anything new lives here.
      data: snapshotAllStorage(),
    };
    payload.version = 2;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const n = Object.keys(payload.data || {}).length;
    // Only data sets you have actually used are stored, so this count is
    // usually well below the number of features — an untouched feature has
    // nothing to back up and restores to its default either way.
    const msg = `Backup downloaded — ${n} data set${n === 1 ? "" : "s"} in use.`;
    setStatus({ type: "success", message: msg });
    toast.success(msg, { title: "Backup" });
  }

  function handleImportClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        // v2 files carry a full snapshot. Write it straight to storage and
        // reload: there are far more storage keys than this component holds
        // setters for, and a reload guarantees every screen re-reads its data.
        const restored = isPlainObject(parsed) ? restoreAllStorage(parsed.data) : -1;
        if (restored > 0) {
          const restoredMsg = `Restored ${restored} data set${restored === 1 ? "" : "s"} — reloading…`;
          setStatus({ type: "success", message: restoredMsg });
          toast.success(restoredMsg, { title: "Backup" });
          setTimeout(() => window.location.reload(), 700);
          return;
        }

        const sanitized = sanitizeBackup(parsed);
        if (Object.keys(sanitized).length === 0) {
          setStatus({ type: "error", message: "No recognizable dashboard data in that file." });
          return;
        }
        if (sanitized.theme) setThemeKey(sanitized.theme);
        if (sanitized.fitness) setFitness(sanitized.fitness);
        if (sanitized.golf) setGolf(sanitized.golf);
        if (sanitized.trackers) setTrackers(sanitized.trackers);
        if (sanitized.profile) setProfile(sanitized.profile);
        if (sanitized.financial) setFinancial(sanitized.financial);
        if (sanitized.events) setEvents(sanitized.events);
        if (sanitized.history) setHistory(sanitized.history);
        if (sanitized.watchlist) setWatchlist(sanitized.watchlist);
        if (sanitized.journal) setJournal(sanitized.journal);
        if (sanitized.goals) setGoals(sanitized.goals);
        if (sanitized.transactions) setTransactions(sanitized.transactions);
        if (sanitized.youtube) setYoutube(sanitized.youtube);
        if (sanitized.golfSimRounds) setGolfSimRounds(sanitized.golfSimRounds);
        if (sanitized.golfOutdoorRounds) setGolfOutdoorRounds(sanitized.golfOutdoorRounds);
        if (sanitized.fantasyCheatSheets) setFantasyCheatSheets(sanitized.fantasyCheatSheets);
        if (sanitized.fantasyCustomRankings) setFantasyCustomRankings(sanitized.fantasyCustomRankings);
        if (sanitized.fantasyWatchlist) setFantasyWatchlist(sanitized.fantasyWatchlist);
        if (sanitized.fantasySleeper) setFantasySleeper(sanitized.fantasySleeper);
        if (sanitized.fantasyYahoo) setFantasyYahoo(sanitized.fantasyYahoo);
        if (sanitized.ravenProducts) setRavenProducts(sanitized.ravenProducts);
        setStatus({ type: "success", message: "Backup restored." });
      } catch (err) {
        setStatus({ type: "error", message: "Couldn't parse that file as JSON." });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setStatus(null);
        }}
        title="Backup & restore"
        className="v-btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: `1px solid ${theme.cardBorder}`,
          background: theme.accentSoft,
          color: theme.text,
        }}
      >
        <IconBackup />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: "64px",
            right: "16px",
            width: "260px",
            maxWidth: "min(92vw, 260px)",
            zIndex: 50,
            padding: "16px",
            ...cardBackgroundStyle(theme),
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.sectionLabelColor,
              marginBottom: "6px",
            }}
          >
            Backup & Restore
          </div>
          <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "14px", lineHeight: 1.4 }}>
            Your data lives only in this browser. Export a copy, or restore from a previous export. Covers every tab; uploaded files (policy documents, videos) stay on this device.
          </div>

          <button
            onClick={handleExport}
            className="v-btn"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "none",
              background: theme.accent,
              color: theme.accentText,
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Export Backup
          </button>
          <button
            onClick={handleImportClick}
            className="v-btn"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: `1px solid ${theme.inputBorder}`,
              background: "transparent",
              color: theme.text,
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {status && (
            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                fontWeight: 600,
                color: status.type === "error" ? theme.danger : theme.positive,
              }}
            >
              {status.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   CALENDAR INTEGRATION
   Client-side OAuth against Google Calendar and Microsoft Graph. Needs:
   1. The page served over http/https (OAuth providers reject file://).
   2. Your own OAuth client IDs from Google Cloud Console / Microsoft Entra,
      pasted into the fields below — nothing is hardcoded or sent anywhere
      but Google/Microsoft's own APIs.
---------------------------------------------------------------------- */

function normalizeGoogleEvents(items) {
  return (items || []).map((it) => {
    const start = (it.start && (it.start.dateTime || it.start.date)) || new Date().toISOString();
    return {
      id: `g-${it.id}`,
      title: it.summary || "(untitled event)",
      detail: new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      date: start.slice(0, 10),
      source: "Google",
    };
  });
}

function normalizeMicrosoftEvents(items) {
  return (items || []).map((it) => {
    const start = (it.start && it.start.dateTime) || new Date().toISOString();
    return {
      id: `ms-${it.id}`,
      title: it.subject || "(untitled event)",
      detail: new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      date: start.slice(0, 10),
      source: "Outlook",
    };
  });
}

// Fetches the latest upload from every channel the signed-in user is
// subscribed to. subscriptions.list only returns the channel IDs, so this is
// a 3-step pipeline: list subscriptions (paginated) -> batch-resolve each
// channel's "uploads" playlist ID (up to 50 per call) -> pull the newest item
// from each of those playlists. Kept quota-cheap (~1 unit per channel) and
// capped so a very large subscription list can't run away.
const YOUTUBE_MAX_CHANNELS = 150;
const YOUTUBE_FETCH_CONCURRENCY = 8;

async function fetchYoutubeUploads(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  let channelIds = [];
  let pageToken = "";
  do {
    const url =
      "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50" +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`YouTube API returned ${r.status} while listing subscriptions`);
    const data = await r.json();
    channelIds.push(...(data.items || []).map((it) => it.snippet.resourceId.channelId));
    pageToken = data.nextPageToken;
  } while (pageToken && channelIds.length < YOUTUBE_MAX_CHANNELS);
  channelIds = channelIds.slice(0, YOUTUBE_MAX_CHANNELS);
  if (channelIds.length === 0) return [];

  const channelInfo = {};
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${batch.join(",")}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`YouTube API returned ${r.status} while looking up channels`);
    const data = await r.json();
    (data.items || []).forEach((ch) => {
      const uploadsPlaylist = ch.contentDetails && ch.contentDetails.relatedPlaylists && ch.contentDetails.relatedPlaylists.uploads;
      if (uploadsPlaylist) {
        channelInfo[ch.id] = { playlistId: uploadsPlaylist, title: ch.snippet.title };
      }
    });
  }

  const entries = Object.entries(channelInfo);
  const videos = [];
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const [channelId, info] = entries[cursor++];
      try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${info.playlistId}&maxResults=1`;
        const r = await fetch(url, { headers });
        if (!r.ok) continue;
        const data = await r.json();
        const item = data.items && data.items[0];
        if (item) {
          const thumb = item.snippet.thumbnails || {};
          videos.push({
            id: item.contentDetails.videoId,
            title: item.snippet.title,
            channelTitle: info.title,
            channelId,
            publishedAt: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
            thumbnail: (thumb.medium || thumb.default || {}).url || "",
          });
        }
      } catch (err) {
        // Skip channels that fail (deleted/private/etc.) rather than failing the whole refresh.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(YOUTUBE_FETCH_CONCURRENCY, entries.length) }, worker));

  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return videos.slice(0, 40);
}

// Lazily pull msal-browser from its CDN only when the user actually clicks
// "Connect Outlook" — most sessions never touch this integration, so it no
// longer has to load on every page view to sit unused.
function loadMsal() {
  if (window.msal) return Promise.resolve(window.msal);
  if (window.__msalPromise) return window.__msalPromise;
  window.__msalPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@azure/msal-browser@5.18.0/lib/msal-browser.min.js";
    s.integrity = "sha384-FQfSZjxaWBhzqI7u0+3M2/K/kFajbcK45G1GMnQdDzVZszPTSjjvWY9YEnJ9tEia";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.msal ? resolve(window.msal) : reject(new Error("Microsoft's auth library failed to initialize.")));
    s.onerror = () => {
      window.__msalPromise = null;
      reject(new Error("Couldn't load Microsoft's auth library (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__msalPromise;
}

function CalendarMenu({ theme, integrations, setIntegrations, googleAccounts, onAddGoogleAccount, onRemoveGoogleAccount, microsoftEvents, onMicrosoftEvents }) {
  const [open, setOpen] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [msStatus, setMsStatus] = useState(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [msBusy, setMsBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function connectGoogle() {
    const clientId = integrations.googleClientId.trim();
    if (!clientId) {
      setGoogleStatus({ type: "error", message: "Add your Google Client ID first." });
      return;
    }
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setGoogleStatus({ type: "error", message: "Google's sign-in script hasn't loaded yet — try again in a moment." });
      return;
    }
    setGoogleBusy(true);
    setGoogleStatus(null);
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        // "email" is a basic (non-sensitive) scope, just used to label which
        // account got connected — doesn't add any extra consent friction.
        scope: "https://www.googleapis.com/auth/calendar.readonly email",
        // Explicit even though this is already the default: always show the
        // account chooser so connecting "another" account doesn't silently
        // re-auth whichever one is already signed in.
        prompt: "select_account",
        callback: async (resp) => {
          setGoogleBusy(false);
          if (resp.error) {
            setGoogleStatus({ type: "error", message: `Google sign-in failed: ${resp.error}` });
            return;
          }
          try {
            const now = new Date();
            const in30 = new Date(now.getTime() + 30 * 86400000);
            const url =
              "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
              `?timeMin=${encodeURIComponent(now.toISOString())}` +
              `&timeMax=${encodeURIComponent(in30.toISOString())}` +
              "&singleEvents=true&orderBy=startTime&maxResults=15";
            const [eventsRes, profileRes] = await Promise.all([
              fetch(url, { headers: { Authorization: `Bearer ${resp.access_token}` } }),
              fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${resp.access_token}` } }).catch(
                () => null
              ),
            ]);
            if (!eventsRes.ok) throw new Error(`Google Calendar API returned ${eventsRes.status}`);
            const data = await eventsRes.json();
            const events = normalizeGoogleEvents(data.items);
            let label = `Google account ${googleAccounts.length + 1}`;
            if (profileRes && profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.email) label = profileData.email;
            }
            if (googleAccounts.some((a) => a.label === label)) {
              setGoogleStatus({ type: "error", message: `${label} is already connected.` });
              return;
            }
            onAddGoogleAccount({ id: "ga" + Date.now(), label, events });
            setGoogleStatus({ type: "success", message: `Connected ${label} — pulled ${events.length} events.` });
          } catch (err) {
            setGoogleStatus({ type: "error", message: err.message || "Failed to fetch Google Calendar events." });
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      setGoogleBusy(false);
      setGoogleStatus({ type: "error", message: err.message || "Couldn't start Google sign-in." });
    }
  }

  async function connectMicrosoft() {
    const clientId = integrations.msClientId.trim();
    if (!clientId) {
      setMsStatus({ type: "error", message: "Add your Microsoft Client ID first." });
      return;
    }
    setMsBusy(true);
    setMsStatus(null);
    try {
      await loadMsal();
      const msalApp = new window.msal.PublicClientApplication({
        auth: { clientId, redirectUri: window.location.origin + window.location.pathname },
      });
      await msalApp.initialize();
      const loginResp = await msalApp.loginPopup({ scopes: ["Calendars.Read"] });
      let tokenResp;
      try {
        tokenResp = await msalApp.acquireTokenSilent({ scopes: ["Calendars.Read"], account: loginResp.account });
      } catch (silentErr) {
        tokenResp = await msalApp.acquireTokenPopup({ scopes: ["Calendars.Read"], account: loginResp.account });
      }
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 86400000);
      const url =
        "https://graph.microsoft.com/v1.0/me/calendarview" +
        `?startDateTime=${encodeURIComponent(now.toISOString())}` +
        `&endDateTime=${encodeURIComponent(in30.toISOString())}` +
        "&$orderby=start/dateTime&$top=15";
      const r = await fetch(url, { headers: { Authorization: `Bearer ${tokenResp.accessToken}` } });
      if (!r.ok) throw new Error(`Microsoft Graph API returned ${r.status}`);
      const data = await r.json();
      const events = normalizeMicrosoftEvents(data.value);
      onMicrosoftEvents(events);
      setMsStatus({ type: "success", message: `Connected — pulled ${events.length} events.` });
    } catch (err) {
      setMsStatus({ type: "error", message: err.message || "Failed to connect to Outlook." });
    } finally {
      setMsBusy(false);
    }
  }

  function disconnectMicrosoft() {
    onMicrosoftEvents([]);
    setMsStatus({ type: "success", message: "Disconnected." });
  }

  const smallInputStyle = {
    width: "100%",
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "6px",
    color: theme.inputText,
    padding: "7px 9px",
    fontSize: "12px",
    marginBottom: "8px",
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  const connectBtnStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: theme.accent,
    color: theme.accentText,
    fontSize: "12.5px",
    fontWeight: 700,
  };

  const disconnectBtnStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${theme.inputBorder}`,
    background: "transparent",
    color: theme.text,
    fontSize: "12.5px",
    fontWeight: 700,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Connect calendars"
        className="v-btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: `1px solid ${theme.cardBorder}`,
          background: theme.accentSoft,
          color: theme.text,
        }}
      >
        <IconLink />
      </button>

      {open && (
        <div
          className="v-scroll"
          style={{
            position: "fixed",
            top: "64px",
            right: "16px",
            width: "280px",
            maxWidth: "min(92vw, 280px)",
            maxHeight: "80vh",
            overflowY: "auto",
            zIndex: 50,
            padding: "16px",
            "--scroll-thumb": theme.divider,
            ...cardBackgroundStyle(theme),
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.sectionLabelColor,
              marginBottom: "6px",
            }}
          >
            Connect Calendars
          </div>
          <div style={{ fontSize: "11.5px", color: theme.textMuted, marginBottom: "14px", lineHeight: 1.4 }}>
            Needs an https:// URL and your own OAuth client ID (Google Cloud Console / Microsoft Entra). Ask for
            setup steps if you haven't done this yet.
          </div>

          <div style={{ fontSize: "12px", fontWeight: 700, color: theme.text, marginBottom: "6px" }}>Google Calendar</div>
          {googleAccounts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {googleAccounts.map((a) => (
                <div
                  key={a.id}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.accentSoft, borderRadius: "8px", padding: "6px 8px" }}
                >
                  <span
                    title={a.label}
                    style={{ flex: 1, minWidth: 0, fontSize: "11.5px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {a.label}
                  </span>
                  <span className="v-tabular" style={{ fontSize: "10.5px", color: theme.textFaint, flexShrink: 0 }}>
                    {a.events.length}
                  </span>
                  <button
                    onClick={() => onRemoveGoogleAccount(a.id)}
                    title="Disconnect"
                    className="v-btn"
                    style={{ width: "16px", height: "16px", borderRadius: "50%", border: "none", background: theme.dangerSoft, color: theme.danger, fontSize: "10px", lineHeight: "16px", textAlign: "center", padding: 0, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            placeholder="Google Client ID"
            value={integrations.googleClientId}
            onChange={(e) => setIntegrations({ ...integrations, googleClientId: e.target.value })}
            className="v-input"
            style={smallInputStyle}
          />
          <button
            onClick={connectGoogle}
            disabled={googleBusy}
            className="v-btn"
            style={{
              ...connectBtnStyle,
              opacity: googleBusy ? 0.6 : 1,
              marginBottom: "6px",
            }}
          >
            {googleBusy ? "Connecting…" : googleAccounts.length > 0 ? "Connect another Google account" : "Connect Google Calendar"}
          </button>
          {googleStatus && (
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: googleStatus.type === "error" ? theme.danger : theme.positive,
                marginBottom: "10px",
              }}
            >
              {googleStatus.message}
            </div>
          )}

          <div
            style={{
              height: "1px",
              background: theme.divider,
              margin: "12px 0",
            }}
          />

          <div style={{ fontSize: "12px", fontWeight: 700, color: theme.text, marginBottom: "6px" }}>
            Outlook Calendar {microsoftEvents.length > 0 ? `(${microsoftEvents.length} events)` : ""}
          </div>
          <input
            placeholder="Microsoft Client ID"
            value={integrations.msClientId}
            onChange={(e) => setIntegrations({ ...integrations, msClientId: e.target.value })}
            className="v-input"
            style={smallInputStyle}
          />
          <button
            onClick={microsoftEvents.length > 0 ? disconnectMicrosoft : connectMicrosoft}
            disabled={msBusy}
            className="v-btn"
            style={{
              ...(microsoftEvents.length > 0 ? disconnectBtnStyle : connectBtnStyle),
              opacity: msBusy ? 0.6 : 1,
            }}
          >
            {msBusy ? "Connecting…" : microsoftEvents.length > 0 ? "Disconnect Outlook" : "Connect Outlook"}
          </button>
          {msStatus && (
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: msStatus.type === "error" ? theme.danger : theme.positive,
                marginTop: "8px",
              }}
            >
              {msStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function YouTubeSection({ theme, integrations, setIntegrations, videos, onVideos, youtubeState, setYoutubeState, delay }) {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  function connectYoutube() {
    const clientId = integrations.googleClientId.trim();
    if (!clientId) {
      setStatus({ type: "error", message: "Add your Google Client ID first (the same one used for Calendar)." });
      return;
    }
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setStatus({ type: "error", message: "Google's sign-in script hasn't loaded yet — try again in a moment." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        callback: async (resp) => {
          if (resp.error) {
            setBusy(false);
            setStatus({ type: "error", message: `Google sign-in failed: ${resp.error}` });
            return;
          }
          try {
            const fetched = await fetchYoutubeUploads(resp.access_token);
            onVideos(fetched);
            setConnected(true);
            setStatus({ type: "success", message: `Connected — checked ${fetched.length ? "your subscriptions" : "0 subscriptions"}.` });
            if (!youtubeState.lastSeenAt) {
              setYoutubeState({ lastSeenAt: Date.now() });
            }
          } catch (err) {
            setStatus({ type: "error", message: err.message || "Failed to fetch YouTube subscriptions." });
          } finally {
            setBusy(false);
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      setBusy(false);
      setStatus({ type: "error", message: err.message || "Couldn't start Google sign-in." });
    }
  }

  function disconnectYoutube() {
    onVideos([]);
    setConnected(false);
    setStatus({ type: "success", message: "Disconnected." });
  }

  function markAllSeen() {
    setYoutubeState({ lastSeenAt: Date.now() });
  }

  const lastSeenAt = youtubeState.lastSeenAt;
  const isNew = (v) => lastSeenAt != null && new Date(v.publishedAt).getTime() > lastSeenAt;
  const newCount = videos.filter(isNew).length;

  return (
    <Card theme={theme} delay={delay}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconYoutube />} style={{ marginBottom: 0 }}>YouTube Updates</SectionLabel>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {videos.length > 0 && newCount > 0 && (
            <button
              onClick={markAllSeen}
              className="v-btn"
              style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
            >
              Mark all seen
            </button>
          )}
          <button
            onClick={connected ? disconnectYoutube : connectYoutube}
            disabled={busy}
            className="v-btn"
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: connected ? theme.text : theme.accent,
              background: connected ? "transparent" : theme.accentSoft,
              border: `1px solid ${connected ? theme.divider : "transparent"}`,
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            {busy ? "Connecting…" : connected ? "Disconnect" : "Connect YouTube"}
          </button>
        </div>
      </div>

      {!connected && (
        <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "12px", lineHeight: 1.4 }}>
          Connects with the same Google account as Calendar and checks the latest upload from every channel you're subscribed to.
        </div>
      )}
      {status && (
        <div style={{ fontSize: "12px", fontWeight: 600, color: status.type === "error" ? theme.danger : theme.positive, marginBottom: "14px" }}>
          {status.message}
        </div>
      )}

      {connected && videos.length === 0 && (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>No recent uploads found from your subscriptions.</div>
      )}

      {videos.length > 0 && (
        <div className="v-scroll" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
          {videos.map((v) => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                background: theme.accentSoft,
                border: `1px solid ${isNew(v) ? theme.accent : theme.divider}`,
                borderRadius: "10px",
                padding: "8px 10px",
                textDecoration: "none",
              }}
            >
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} style={{ width: "64px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0, display: "block", background: theme.chip }} />
              ) : (
                <div style={{ width: "64px", height: "36px", borderRadius: "6px", background: theme.progressTrack, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isNew(v) && (
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.accent, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: "13px", color: theme.text, fontWeight: isNew(v) ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.title}
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.channelTitle} &middot; {timeAgo(v.publishedAt)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

// The Mechanical Orchard toolset. Grouped by what you are actually doing:
// looking at what came out of a scanner, producing something for someone
// else to read, or checking one thing quickly.
const MO_TOOL_GROUPS = [
  { id: "assess", label: "Assess", blurb: "What the scanners found, and how it is moving." },
  { id: "produce", label: "Produce", blurb: "Turn findings into something a person can read." },
  { id: "lookup", label: "Look up", blurb: "Answer one question, fast." },
];
const MO_TOOLS = [
  { id: "vuln-s1", group: "assess", icon: <IconShield size={15} />, label: "Vulnerability Analyzer — S1", desc: "Read a SentinelOne export: severity split, worst assets, and what moved since last week" },
  { id: "vuln-iru", group: "assess", icon: <IconShield size={15} />, label: "Vulnerability Analyzer — IRU", desc: "The same analysis for an IRU export" },
  { id: "vulntrend", group: "assess", icon: <IconTrendingUp size={15} />, label: "Vulnerability Trends", desc: "Chart saved snapshots over time, per source" },
  { id: "policy", group: "assess", icon: <IconClipboard size={15} />, label: "Policy & Procedure Writeup", desc: "Track the ~20 documents a program is expected to hold, and store the files" },
  { id: "deck", group: "produce", icon: <IconDeck size={15} />, label: "Weekly Report Deck", desc: "Fill a PPTX template — auto-filled from the latest snapshot" },
  { id: "pki", group: "produce", icon: <IconCertificate size={15} />, label: "PKI Report Generator", desc: "Assemble the recurring certificate-authority report" },
  { id: "dailylog", group: "produce", icon: <IconClipboard size={15} />, label: "Daily InfoSec Log", desc: "Compile the day's snapshots, notices and policy movement into one entry" },
  { id: "appnotice", group: "produce", icon: <IconMegaphone size={15} />, label: "Outdated App Notice", desc: "Draft the update-or-remove message to send a user" },
  { id: "kev", group: "lookup", icon: <IconShield size={15} />, label: "CVE / KEV Lookup", desc: "Check a CVE against CISA's Known Exploited catalogue" },
  { id: "cve-watch", group: "lookup", icon: <IconShield size={15} />, label: "CVE Watchlist", desc: "Watch vendors and products against live NVD data" },
  { id: "toolkit", group: "lookup", icon: <IconWrench size={15} />, label: "Security Utility Belt", desc: "Extract IOCs, defang, decode base64/JWT, hash" },
  { id: "phish", group: "lookup", icon: <IconEnvelope size={15} />, label: "Phishing Header Analyzer", desc: "Read SPF/DKIM/DMARC results and the relay hops" },
  { id: "pwned-pw", group: "lookup", icon: <IconLock size={15} />, label: "Password Breach Check", desc: "k-anonymity lookup — the password never leaves the browser" },
];
const MO_TOOL_IDS = MO_TOOLS.map((t) => t.id);
function moToolById(id) { return MO_TOOLS.find((t) => t.id === id) || null; }

// Ordered severity buckets, and column hints per source for the Vulnerability
// Analyzer's auto-detection. Live in core (bridged into the MO chunk) because
// MoDashboard's summary cards need them before the chunk has loaded.
const MO_SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Info", "Unrated"];
const MO_SOURCE_HINTS = {
  s1: {
    label: "SentinelOne (S1)",
    severity: ["severity", "risk", "cvss"],
    asset: ["endpoint", "host", "device", "agent", "machine", "computer"],
    name: ["cve", "vulnerability", "name", "title", "application", "package"],
  },
  iru: {
    label: "IRU",
    severity: ["severity", "risk", "criticality", "cvss"],
    asset: ["asset", "host", "ip", "system", "resource"],
    name: ["cve", "vulnerability", "finding", "name", "title", "plugin"],
  },
};
function moFindingKeyOf(f) {
  return ((f.a || "").toLowerCase() + "|" + (f.n || "").toLowerCase());
}
// New / remediated / unchanged against the previous snapshot of the same
// source. Returns null when there is nothing to compare against, so callers
// can say so rather than implying a week of zero change.
function moDiffFindings(current, previous) {
  if (!current || !previous || !current.findings || !previous.findings) return null;
  const prev = new Map(previous.findings.map((f) => [moFindingKeyOf(f), f]));
  const cur = new Map(current.findings.map((f) => [moFindingKeyOf(f), f]));
  const added = [], removed = [], worsened = [];
  const rank = (s) => MO_SEVERITY_ORDER.indexOf(s);
  cur.forEach((f, k) => {
    const was = prev.get(k);
    if (!was) added.push(f);
    else if (rank(f.s) < rank(was.s)) worsened.push({ ...f, from: was.s });
  });
  prev.forEach((f, k) => { if (!cur.has(k)) removed.push(f); });
  return { added, removed, worsened, unchanged: cur.size - added.length, since: previous.ts };
}

function moSourceStatus(snapshots, src) {
  const mine = (snapshots || []).filter((s) => s.source === src).sort((x, y) => (x.ts < y.ts ? 1 : -1));
  if (!mine.length) return null;
  const latest = mine[0];
  const prior = mine.slice(1).find((s) => s.findings);
  const diff = latest.findings && prior ? moDiffFindings(latest, prior) : null;
  return {
    src,
    latest,
    diff,
    critical: (latest.counts && latest.counts.Critical) || 0,
    high: (latest.counts && latest.counts.High) || 0,
  };
}

function MoStatCard({ theme, label, value, tone, note, sub }) {
  return (
    <div style={{ ...cardBackgroundStyle(theme), padding: "16px 18px", display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
      <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: theme.sectionLabelColor }}>{label}</div>
      <div
        className="v-tabular"
        style={{
          fontSize: "24px",
          // A dash is the absence of a number, so it should not be set in the
          // same weight and colour as one.
          fontWeight: value === "—" ? 400 : 800,
          lineHeight: 1.15,
          color: value === "—" ? theme.textFaint : (tone || theme.text),
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: "12px", color: theme.textMuted, lineHeight: 1.4 }}>{sub}</div>}
      {note && <div style={{ fontSize: "12px", color: theme.textFaint, lineHeight: 1.4, marginTop: "2px" }}>{note}</div>}
    </div>
  );
}

function MoDashboard({ theme, snapshots, policies, dailyLog, cveWatchlist, appNotice, links, setLinks, onOpenTool }) {
  const [editingLinks, setEditingLinks] = useState(false);

  const status = useMemo(() => ({
    s1: moSourceStatus(snapshots, "s1"),
    iru: moSourceStatus(snapshots, "iru"),
  }), [snapshots]);

  const policyDone = (policies || []).filter((p) => p.status === "done").length;
  const policyTotal = (policies || []).length;
  const lastLog = ((dailyLog && dailyLog.entries) || [])[0] || null;
  const watchCount = (cveWatchlist || []).length;
  const watchChecked = (cveWatchlist || []).map((w) => w.fetchedAt).filter(Boolean).sort().pop() || null;
  const noticeCount = ((appNotice && appNotice.history) || []).length;

  const anySnapshot = !!(status.s1 || status.iru);
  function updateLink(id, url) { setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l))); }

  // Movement, phrased as a clause rather than a signed number: "+3" next to a
  // vulnerability count is ambiguous about whether it is good.
  function movementNote(st) {
    if (!st.diff) return "No earlier scan to compare against yet.";
    const bits = [];
    if (st.diff.added.length) bits.push(`${st.diff.added.length} new`);
    if (st.diff.removed.length) bits.push(`${st.diff.removed.length} remediated`);
    if (!bits.length) return "Unchanged since the previous scan.";
    return bits.join(", ") + " since " + moFormatTs(st.diff.since) + ".";
  }

  return (
    <div>
      <div className="v-mo-stats">
        {["s1", "iru"].map((src) => {
          const st = status[src];
          if (!st) return null;
          return (
            <MoStatCard
              key={src}
              theme={theme}
              label={MO_SOURCE_HINTS[src].label}
              value={st.critical + st.high}
              tone={st.critical ? theme.danger : theme.text}
              sub={`${st.critical} critical · ${st.high} high · ${st.latest.total} total`}
              note={movementNote(st)}
            />
          );
        })}
        {!anySnapshot && (
          <MoStatCard
            theme={theme}
            label="Vulnerabilities"
            value="—"
            sub="No scan saved yet"
            note="Run an export through the Vulnerability Analyzer and save a snapshot; everything else on this page builds on that."
          />
        )}
        <MoStatCard
          theme={theme}
          label="Policies"
          value={`${policyDone}/${policyTotal}`}
          tone={policyDone === policyTotal && policyTotal ? theme.positive : theme.text}
          sub={policyTotal ? `${policyTotal - policyDone} still outstanding` : "None tracked"}
        />
        <MoStatCard
          theme={theme}
          label="CVE Watchlist"
          value={watchCount}
          sub={watchCount === 1 ? "keyword watched" : "keywords watched"}
          note={watchChecked ? "Last checked " + moFormatTs(watchChecked) + "." : watchCount ? "Never checked." : "Nothing on the list."}
        />
        <MoStatCard
          theme={theme}
          label="Daily log"
          value={lastLog ? moFormatTs(lastLog.at).split(",")[0] : "—"}
          sub={lastLog ? "last entry saved" : "no entries yet"}
          note={noticeCount ? noticeCount + (noticeCount === 1 ? " app notice drafted." : " app notices drafted.") : null}
        />
      </div>

      {MO_TOOL_GROUPS.map((g) => {
        const tools = MO_TOOLS.filter((t) => t.group === g.id);
        if (!tools.length) return null;
        return (
          <div key={g.id} style={{ marginTop: "26px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: theme.sectionLabelColor }}>{g.label}</h2>
              <span style={{ fontSize: "13px", color: theme.textFaint }}>{g.blurb}</span>
            </div>
            <div className="v-mo-grid">
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpenTool(t.id)}
                  className="v-btn v-mo-tool"
                  style={{
                    ...cardBackgroundStyle(theme), textAlign: "left", padding: "16px 18px",
                    display: "flex", alignItems: "flex-start", gap: "12px", color: theme.text,
                    "--mo-tool-hover": theme.accentSoft, "--mo-tool-border": theme.accent,
                  }}
                >
                  <span style={{ color: theme.accentOn, display: "inline-flex", flexShrink: 0, marginTop: "2px" }}>{t.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "3px" }}>{t.label}</span>
                    <span style={{ display: "block", fontSize: "12px", color: theme.textMuted, lineHeight: 1.45 }}>{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "26px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: theme.sectionLabelColor, flex: 1 }}>Consoles</h2>
          <button onClick={() => setEditingLinks((v) => !v)} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.accentOn, background: "transparent", border: "none", padding: 0 }}>
            {editingLinks ? "Done" : "Edit links"}
          </button>
        </div>
        <div className="v-mo-grid">
          {(links || []).map((l) => (
            editingLinks ? (
              <div key={l.id} style={{ ...cardBackgroundStyle(theme), padding: "14px 16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>{l.label}</div>
                <input
                  value={l.url}
                  onChange={(e) => updateLink(l.id, e.target.value)}
                  placeholder="https://…"
                  className="v-input"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent }}
                />
              </div>
            ) : (
              <a
                key={l.id}
                href={l.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (!l.url) { e.preventDefault(); setEditingLinks(true); } }}
                className="v-btn v-mo-tool"
                style={{
                  ...cardBackgroundStyle(theme), padding: "16px 18px", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: "12px",
                  color: l.url ? theme.text : theme.textFaint,
                  "--mo-tool-hover": theme.accentSoft, "--mo-tool-border": theme.accent,
                }}
              >
                <span style={{ color: theme.textMuted, display: "inline-flex", flexShrink: 0 }}><IconLink /></span>
                <span style={{ flex: 1, minWidth: 0, fontSize: "14px", fontWeight: 700 }}>{l.label}</span>
                <span style={{ color: theme.textFaint, display: "inline-flex", flexShrink: 0 }}>
                  {l.url ? <IconExternal size={13} /> : <span style={{ fontSize: "12px", fontWeight: 700 }}>set link</span>}
                </span>
              </a>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// Every non-Home page BearVantageHub can navigate to. Order here drives both
// the sidebar nav list and the Home overview tile grid.
const PAGE_META = [
  { id: "fitness", label: "Fitness", icon: <IconDumbbell /> },
  { id: "golf", label: "Golf", icon: <IconGolf /> },
  { id: "fantasy", label: "Fantasy", icon: <IconFootball size={14} /> },
  { id: "financial", label: "Financial", icon: <IconTrendingUp /> },
  { id: "transactions", label: "Transactions", icon: <IconReceipt size={14} /> },
  { id: "upcoming", label: "Upcoming", icon: <IconCalendar /> },
  { id: "weather", label: "Weather", icon: <IconCloud size={14} /> },
  { id: "travel", label: "Travel", icon: <IconPlane size={14} /> },
  { id: "agenda", label: "Agenda", icon: <IconCalendar /> },
  { id: "youtube", label: "YouTube", icon: <IconYoutube size={14} /> },
  { id: "music", label: "Music", icon: <IconMusic size={14} /> },
  { id: "profile", label: "About Me", icon: <IconUser /> },
  { id: "resume", label: "Resume", icon: <IconCertificate size={14} /> },
  { id: "watchlist", label: "Watch List", icon: <IconFilm size={14} /> },
  { id: "trackers", label: "Trackers", icon: <IconChecklist size={14} /> },
  { id: "goals", label: "Life Goals", icon: <IconFlag size={14} /> },
  { id: "videos", label: "Videos", icon: <IconVideo size={14} /> },
  { id: "journal", label: "Journal", icon: <IconBookOpen size={14} /> },
  { id: "habits", label: "Habits", icon: <IconFlame size={14} /> },
  { id: "mealplanning", label: "Meal Planning", icon: <IconChefHat size={14} /> },
  { id: "birthdays", label: "Birthdays", icon: <IconGift size={14} /> },
  { id: "reading", label: "Reading", icon: <IconBook size={14} /> },
  { id: "movies", label: "Movies & TV", icon: <IconClapper size={14} /> },
  { id: "gaming", label: "Gaming News", icon: <IconGamepad size={14} /> },
  { id: "games", label: "Games", icon: <IconGamepad size={14} /> },
  { id: "news", label: "News", icon: <IconNews size={14} /> },
  { id: "sports", label: "Sports", icon: <IconTrophy size={14} /> },
  { id: "subscriptions", label: "Subscriptions", icon: <IconCreditCard size={14} /> },
  { id: "mo", label: "Mechanical Orchard", icon: <IconOrchard size={14} /> },
  { id: "securityx", label: "SecurityX", icon: <IconAcademic size={14} /> },
  { id: "ravenseye", label: "Raven's Eye", icon: <IconRavenEye size={14} /> },
  { id: "jobsearch", label: "Job Search", icon: <IconBriefcase size={14} /> },
];

// Sidebar navigation grouped into collapsible sections. Any PAGE_META id not
// listed here still renders (see the "ungrouped" fallback in Sidebar), so
// adding a page without touching this list never drops it from the nav.
// No group larger than five. With one group open at a time, the rail's height
// is (headers + the open group), so a nine-item group like the old "Media"
// single-handedly made the nav scroll again — 836px of rail against 634px of
// window. Five is also about where a list stops being scannable at a glance.
const NAV_GROUPS = [
  { id: "today", label: "Today", ids: ["upcoming", "agenda", "habits", "journal"] },
  { id: "health", label: "Health & Sport", ids: ["fitness", "golf", "fantasy", "sports"] },
  { id: "money", label: "Money", ids: ["financial", "transactions", "subscriptions"] },
  { id: "watch", label: "Video", ids: ["movies", "watchlist", "youtube", "videos", "gaming"] },
  { id: "play", label: "Read & Play", ids: ["reading", "games", "music", "news"] },
  { id: "life", label: "Life", ids: ["profile", "resume", "goals", "trackers", "birthdays"] },
  { id: "plan", label: "Plan", ids: ["weather", "travel", "mealplanning"] },
  { id: "work", label: "Security & Work", ids: ["mo", "securityx", "ravenseye", "jobsearch"] },
];

function NavChevron({ collapsed }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ---- Per-page header banner: a unique color gradient + the page's icon as a
   watermark. Colorful and tailored per page, theme-aware, always renders.
   (Drop an `image` URL into PAGE_BANNER_IMG[id] to use a real photo instead.) ---- */
const PAGE_SUBTITLES = {
  fitness: "Training and body metrics", golf: "Rounds, handicap, and scorecards",
  fantasy: "Your fantasy football war room", sports: "Your teams — news and scores",
  financial: "Savings goals and net worth", transactions: "Where your money goes",
  subscriptions: "Recurring costs at a glance", upcoming: "What's on the horizon",
  agenda: "Your week ahead", youtube: "Channels and watch queue",
  weather: "Ten-day forecast", travel: "Trips, packing, and itineraries",
  music: "Now playing, via Last.fm", mealplanning: "Recipes from what you like",
  news: "Headlines on your topics", movies: "Releases, casting, and box office",
  watchlist: "Movies and shows to watch", videos: "Your personal video library",
  reading: "Your bookshelf and reading goal", games: "Your game backlog",
  profile: "About you", resume: "Experience, certifications and skills", trackers: "Little things worth tracking",
  goals: "Your life goals", journal: "Daily notes and reflections",
  habits: "Daily streaks", birthdays: "Never miss an occasion",
  jobsearch: "Cybersecurity roles matched to your resume",
  gaming: "Releases, reveals, and esports",
  mo: "Security tooling and this week's numbers",
};
// Banner photos. These are hotlinked from third-party hosts, several of which
// block cross-site requests or rotate their URLs — so every one degrades to the
// page's gradient on error, and each page's image can be replaced from the
// banner itself (stored under STORAGE_KEYS.pageImages).
const PAGE_BANNER_IMG = {
  fitness: "https://preview.redd.it/how-have-the-rocky-movies-motivated-or-changed-you-as-a-v0-j50gf5mwfcoc1.jpeg?auto=webp&s=8429321f7f6f36d7f7f4d0d131a6c5b68544e701",
  sports: "https://wallpapers.com/images/high/stephen-curry-smiling-nba-desktop-y5mhgblt4npckmx5.webp",
  fantasy: "https://wallpapers.com/images/high/fun-celebration-mark-andrews-65qahzlgomwetyjw.webp",
  movies: "https://c4.wallpaperflare.com/wallpaper/513/626/511/the-dark-knight-heath-ledger-movies-quote-wallpaper-preview.jpg",
  watchlist: "https://images.wallpapersden.com/image/download/4k-superman-poster_bmhnZmuUmZqaraWkpJRnbGhmrWllbms.jpg",
  gaming: "https://images.hdqwalls.com/wallpapers/batman-in-red-city-4k-2a.jpg",
  games: "https://c4.wallpaperflare.com/wallpaper/265/757/289/flash-superhero-dc-comics-wallpaper-preview.jpg",
  videos: "https://wallpapercave.com/wp/wp2092057.jpg",
  goals: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9eDVEr2iS_ClKFxJgOlGZpaGCt0eSaG3m079u6Gkm8bnPEPXDu5ix6nvT&s=10",
  journal: "https://pbs.twimg.com/media/E1uLYKkXoAYrGhd.jpg",
  reading: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6TOzaBIPq345NNDSygYYsEC_uSXga0i3Q6t2ha8beKxVPhiZzR-HKWxE&s=10",
  habits: "https://i.pinimg.com/736x/f4/a2/48/f4a248dea58747dcc39027a998831daf.jpg",
  profile: "https://i.pinimg.com/736x/10/b3/d2/10b3d235e3cbd4e58c671f7a960c3f5c.jpg",
};
const PAGE_BANNER_VARIANT = {
  movies: "hero", watchlist: "hero", gaming: "hero", games: "hero", sports: "hero",
  fantasy: "ribbon", youtube: "ribbon", videos: "ribbon", goals: "ribbon", trackers: "ribbon",
  fitness: "corner", habits: "corner", profile: "corner", resume: "corner", journal: "corner", reading: "corner",
};
// Page-type -> container width. Dashboards and data-dense pages get room;
// reading-style pages stay in a comfortable measure.
// Pages that are actually prose, and want a line length you can read rather
// than the full width of a monitor. Everything else is a list, a grid or a
// form and gets the room.
const CONTAINER_READER = ["journal", "resume", "profile", "goals"];
const CONTAINER_XWIDE = ["fantasy", "ravenseye", "transactions", "videos", "golf", "reading", "games", "movies", "news", "sports", "mo", "home", "jobsearch"];
function containerVariant(page) {
  if (page === "securityx") return "v-container--full";
  if (CONTAINER_READER.includes(page)) return "v-container--reader";
  if (CONTAINER_XWIDE.includes(page)) return "v-container--xwide";
  return "v-container--wide";
}

function PageBanner({ theme, page, images, setImages }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); setEditing(false); }, [page]);

  const meta = PAGE_META.find((m) => m.id === page);
  if (!meta || page === "securityx" || page === "ravenseye") return null;
  const override = images && Object.prototype.hasOwnProperty.call(images, page) ? images[page] : undefined;
  const img = (override !== undefined ? override : PAGE_BANNER_IMG[page]) || "";
  const showImg = img && !broken;
  const variant = PAGE_BANNER_VARIANT[page] || "hero";

  function saveImg() {
    const v = draft.trim();
    setImages((prev) => ({ ...(prev || {}), [page]: v }));
    setBroken(false);
    setEditing(false);
    toast.success(v ? "Banner image updated." : "Banner image cleared.");
  }

  const editBtn = (
    <button
      onClick={() => { setDraft(img); setEditing((v) => !v); }}
      className="v-btn v-banner-edit"
      title={showImg ? "Change banner image" : "Add a banner image"}
      aria-label={showImg ? "Change banner image" : "Add a banner image"}
    >
      <IconImage size={14} />
    </button>
  );
  const editPanelDark = editing && (
    <div className="v-banner-edit-panel">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") saveImg(); if (e.key === "Escape") setEditing(false); }}
        placeholder="Paste an image URL, or leave blank for the gradient"
        className="v-input"
        autoFocus
        style={{ flex: 1, minWidth: "180px", padding: "8px 10px", borderRadius: "8px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}` }}
      />
      <button onClick={saveImg} className="v-btn" style={{ padding: "8px 13px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Save</button>
      <button onClick={() => { setDraft(""); setImages((prev) => ({ ...(prev || {}), [page]: "" })); setEditing(false); toast.info("Banner image cleared."); }} className="v-btn" style={{ padding: "8px 11px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}>Clear</button>
    </div>
  );

  // "corner" — the photo leaves the header entirely and becomes a small
  // floating square on a plain card, title/subtitle set in normal theme text.
  if (variant === "corner" && showImg) {
    return (
      <div style={{ ...cardBackgroundStyle(theme), position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "18px 20px", marginBottom: "22px" }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="v-pagehead__title">{meta.label}</h1>
          {PAGE_SUBTITLES[page] && <p className="v-pagehead__sub">{PAGE_SUBTITLES[page]}</p>}
        </div>
        <img src={img} alt="" loading="lazy" onError={() => setBroken(true)} className="v-banner--corner-img" />
        {editBtn}
        {editPanelDark}
      </div>
    );
  }

  // "ribbon" — a slim strip banner, shorter than the hero, subtitle dropped
  // to keep it thin.

  // A photo the user chose is content and keeps a hero, with a scrim heavy
  // enough at the text end to carry white type over any image.
  if (showImg) {
    return (
      <div className="v-pagehero">
        <img src={img} alt="" loading="lazy" onError={() => setBroken(true)} />
        <div className="v-pagehero__scrim" />
        <div className="v-pagehero__text">
          <h1 className="v-pagehead__title">{meta.label}</h1>
          {PAGE_SUBTITLES[page] && <p className="v-pagehead__sub">{PAGE_SUBTITLES[page]}</p>}
        </div>
        {editBtn}
        {editPanelDark}
      </div>
    );
  }

  // Otherwise the page names itself in type, on its own ground.
  return (
    <div className="v-pagehead">
      <span className="v-pagehead__chip" aria-hidden="true">{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="v-pagehead__title">{meta.label}</h1>
        {PAGE_SUBTITLES[page] && <p className="v-pagehead__sub">{PAGE_SUBTITLES[page]}</p>}
      </div>
      {editBtn}
      {editPanelDark}
    </div>
  );
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    // A new page gets a clean slate; otherwise one bad page would look like a
    // broken app for the rest of the session.
    if (prev.page !== this.props.page && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const theme = this.props.theme;
    return (
      <div style={{ ...cardBackgroundStyle(theme), padding: "24px 26px", marginTop: "8px" }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-6)", fontWeight: 800, color: theme.text }}>This page didn't load</h2>
        <p style={{ fontSize: "var(--fs-3)", color: theme.textMuted, marginTop: "8px", maxWidth: "60ch" }}>
          Something in this page's saved data isn't in a shape it understands, so it stopped rather than
          showing you something wrong. Everything else still works — the navigation is on the left.
        </p>
        <pre className="v-scroll" style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: theme.accentSoft, color: theme.textMuted, fontSize: "var(--fs-2)", overflowX: "auto" }}>
          {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
        </pre>
        <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
          <button
            onClick={() => this.setState({ error: null })}
            className="v-btn"
            style={{ border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.hash = ""; this.setState({ error: null }); }}
            className="v-btn"
            style={{ border: "none", background: theme.accent, color: theme.accentText, fontWeight: 700 }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}

function AllPagesDirectory({ theme, page, pageVisits, onNavigate, onOpenMoTool, onClose }) {
  const [q, setQ] = useState("");
  const panelRef = useRef(null);
  useOverlayBehaviour(onClose, panelRef);

  const needle = q.trim().toLowerCase();
  const match = (label) => !needle || label.toLowerCase().includes(needle);

  // Pages by their nav group, plus any page not in a group (so a page can
  // never be invisible here just because someone forgot to file it).
  const grouped = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.ids
      .map((id) => PAGE_META.find((p) => p.id === id))
      .filter((m) => m && match(m.label))
      .map((m) => ({ kind: "page", id: m.id, label: m.label, icon: m.icon })),
  }));
  const filed = new Set(NAV_GROUPS.flatMap((g) => g.ids));
  const orphans = PAGE_META.filter((m) => !filed.has(m.id) && match(m.label))
    .map((m) => ({ kind: "page", id: m.id, label: m.label, icon: m.icon }));
  if (orphans.length) grouped.push({ label: "Other", items: orphans });

  // The MO tools are routes with no home in the navigation. They get one.
  grouped.push({
    label: "Mechanical Orchard tools",
    items: MO_TOOLS.filter((t) => match(t.label))
      .map((t) => ({ kind: "tool", id: t.id, label: t.label, icon: t.icon })),
  });

  const sections = grouped.filter((g) => g.items.length);
  const total = sections.reduce((n, g) => n + g.items.length, 0);

  function pick(item) {
    if (item.kind === "tool") onOpenMoTool(item.id);
    else onNavigate(item.id);
    onClose();
  }

  return ReactDOM.createPortal(
    <div className="v-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} className="v-scroll v-modal-card v-dir" role="dialog" aria-modal="true" aria-label="All pages"
        style={{ "--scroll-thumb": theme.divider, ...cardBackgroundStyle(theme), padding: "20px 22px" }}>
        <div className="v-dir__head">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={"Filter " + (PAGE_META.length + MO_TOOLS.length) + " destinations…"}
            className="v-input"
            autoFocus
            style={{ flex: 1, minWidth: "160px", padding: "0 12px", borderRadius: "10px", fontSize: "var(--fs-4)", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}` }}
          />
          <button onClick={onClose} className="v-btn v-iconbtn" aria-label="Close" title="Close"
            style={{ border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted, borderRadius: "10px", width: "34px", height: "34px", flexShrink: 0 }}>
            <IconClose />
          </button>
        </div>

        {sections.map((g) => (
          <div key={g.label} style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "var(--fs-1)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>{g.label}</div>
            <div className="v-dir__grid">
              {g.items.map((item) => {
                const current = item.kind === "page" && item.id === page;
                // A page never opened is worth pointing at once: it is the only
                // cue for something you do not know to look for.
                const unseen = item.kind === "page" && !(pageVisits || {})[item.id] && item.id !== page;
                return (
                  <button
                    key={item.kind + item.id}
                    onClick={() => pick(item)}
                    className={"v-btn v-dir__item" + (current ? " is-current" : "")}
                    style={{ border: `1px solid ${current ? theme.accent : "var(--v-edge)"}`, background: current ? theme.accentSoft : "transparent", color: theme.text }}
                  >
                    <span style={{ color: current ? theme.accentOn : theme.textMuted, display: "inline-flex", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                    {unseen && <span className="v-dir__dot" title="Not opened yet" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!total && (
          <div style={{ marginTop: "18px", fontSize: "var(--fs-3)", color: theme.textMuted }}>
            Nothing matches "{q.trim()}".
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function NavItem({ theme, icon, label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={label}
      className={"v-btn v-navitem" + (active ? " is-active" : "")}
      style={{
        color: active ? (theme.accentOn || theme.accent) : theme.text,
        // Deliberately unset when inactive: an inline "transparent" would beat
        // the stylesheet's :hover rule and the row would never light up.
        ...(active ? { background: theme.accentSoft } : null),
        "--navitem-hover": theme.accentSoft,
      }}
    >
      <span style={{ color: active ? (theme.accentOn || theme.accent) : theme.textMuted, flexShrink: 0, display: "inline-flex" }}>{icon}</span>
      <span
        className="v-navitem__label"
        style={{
          fontSize: "13px",
          fontWeight: active ? 650 : 500,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "left",
        }}
      >
        {label}
      </span>
      {value !== null && value !== undefined && value !== "" && (
        <span
          className="v-tabular v-navitem__badge"
          // textMuted, not textFaint: these counts are the only live data in
          // the rail, and textFaint measures below AA in 14 of 20 themes at
          // this size. The hierarchy against the label comes from weight and
          // size, which cost nothing in contrast.
          style={{ fontSize: "11px", fontWeight: 600, color: active ? (theme.accentOn || theme.accent) : theme.textMuted, flexShrink: 0 }}
        >
          {value}
        </span>
      )}
    </button>
  );
}

function IconInstall({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 7v7m0 0-3-3m3 3 3-3" />
      <path d="M9 18h6" />
    </svg>
  );
}

// Chrome/Edge/Android fire beforeinstallprompt when the PWA criteria are
// met (manifest + service worker, both already registered) and let us
// defer + replay the browser's own install flow from our own button.
// Safari/iOS never fires this — there, "Add to Home Screen" only exists in
// the share sheet, so the button just stays hidden there.
function InstallAppButton({ theme }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches
  );
  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  if (installed || !deferredPrompt) return null;
  async function install() {
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (e) {}
    setDeferredPrompt(null);
  }
  return (
    <button
      onClick={install}
      className="v-btn"
      title="Install BearVantageHub as an app"
      aria-label="Install BearVantageHub as an app"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}
    >
      <IconInstall size={16} />
    </button>
  );
}

function IconFileText({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
    </svg>
  );
}

// One week of fitness/golf/financial/transactions/habits/upcoming, folded
// into a single-page PDF via the same pdfMake loader Raven's Eye already
// uses (ravenLoadPdfMake caches the library on window, so this is free the
// second time either feature calls it).
function buildWeeklyDigestDocDefinition({ fitness, golf, financial, history, transactions, habits, events }) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const fmtDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const accounts = (financial && financial.accounts && financial.accounts.length) ? financial.accounts : DEFAULT_FINANCIAL_ACCOUNTS;
  const total = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const netWorthSeries = buildNetWorthSeries(accounts, (history && history.accounts) || {});
  const weekNetWorth = netWorthSeries.filter((p) => new Date(p.date) >= weekAgo);
  const netWorthDelta = weekNetWorth.length >= 2 ? weekNetWorth[weekNetWorth.length - 1].value - weekNetWorth[0].value : null;

  const weightSeries = (history && history.fitness) || [];
  const weekWeight = weightSeries.filter((p) => new Date(p.date) >= weekAgo);
  const weightDelta = weekWeight.length >= 2 ? weekWeight[weekWeight.length - 1].value - weekWeight[0].value : null;

  const weekTx = (transactions || []).filter((t) => t.date && new Date(t.date) >= weekAgo);
  const weekSpend = weekTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const byCategory = {};
  weekTx.forEach((t) => { const c = t.category || "Uncategorized"; byCategory[c] = (byCategory[c] || 0) + (Number(t.amount) || 0); });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const habitItems = (habits && habits.items) || [];
  const habitDone = (habits && habits.done) || {};
  let habitHits = 0;
  const dayKeys = habitLastDays(7).map((d) => habitDayKey(d));
  habitItems.forEach((h) => { dayKeys.forEach((k) => { if (habitDone[h.id] && habitDone[h.id][k]) habitHits += 1; }); });
  const habitPossible = habitItems.length * 7;
  const habitPct = habitPossible ? Math.round((habitHits / habitPossible) * 100) : null;

  const upcoming = (events || [])
    .filter((e) => e.date && new Date(e.date) >= now && new Date(e.date) <= new Date(now.getTime() + 7 * 86400000))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const section = (label) => ({ text: label, style: "section" });
  const line = (text) => ({ text, margin: [0, 0, 0, 2] });

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: "BearVantageHub Weekly Digest", style: "title" },
      { text: `${fmtDate(weekAgo)} – ${fmtDate(now)}`, style: "subtitle" },

      section("Fitness"),
      line(`Current weight: ${fitness.currentWeight} lbs (target ${fitness.targetWeight} lbs)`),
      line(weightDelta == null ? "Not enough logged data this week to show a trend." : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} lbs this week`),

      section("Golf"),
      line(`Handicap: ${golf.handicap} · ${golf.roundsYtd} rounds YTD`),

      section("Financial"),
      line(`Total across accounts: ${fmtMoney(total)}`),
      line(netWorthDelta == null ? "Not enough snapshots this week to show a trend." : `${netWorthDelta >= 0 ? "+" : ""}${fmtMoney(netWorthDelta)} this week`),

      section("Transactions"),
      line(`Spent this week: ${fmtMoney(weekSpend)} across ${weekTx.length} transaction${weekTx.length === 1 ? "" : "s"}`),
      line(topCategory ? `Top category: ${topCategory[0]} (${fmtMoney(topCategory[1])})` : "No spending logged this week."),

      section("Habits"),
      line(habitPct == null ? "No habits tracked yet." : `${habitHits} of ${habitPossible} check-ins this week (${habitPct}%)`),

      section("Upcoming (next 7 days)"),
      ...(upcoming.length
        ? upcoming.map((e) => line(`${e.title} — ${new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`))
        : [line("Nothing on the calendar.")]),
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: "#1a1a1a", margin: [0, 0, 0, 2] },
      subtitle: { fontSize: 10, italics: true, color: "#767673", margin: [0, 0, 0, 14] },
      section: { fontSize: 12, bold: true, color: "#1a1a1a", margin: [0, 14, 0, 6] },
    },
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#33332f" },
  };
}

function WeeklyDigestButton({ theme, fitness, golf, financial, history, transactions, habits, events }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const pdfMake = await ravenLoadPdfMake();
      const doc = buildWeeklyDigestDocDefinition({ fitness, golf, financial, history, transactions, habits, events });
      await pdfMake.createPdf(doc).download(`vantage-weekly-digest-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      toast.error(err && err.message ? err.message : "Couldn't build the digest.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={download}
      disabled={busy}
      className="v-btn"
      title="Download weekly digest (PDF)"
      aria-label="Download weekly digest (PDF)"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted, opacity: busy ? 0.6 : 1 }}
    >
      <IconFileText size={16} />
    </button>
  );
}

// A year-scoped retrospective rather than the weekly digest's rolling
// 7-day window — same section shape, YTD math instead.
function buildAnnualDigestDocDefinition({ fitness, golf, financial, history, transactions, habits, workouts, reading }) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const accounts = (financial && financial.accounts && financial.accounts.length) ? financial.accounts : DEFAULT_FINANCIAL_ACCOUNTS;
  const total = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const netWorthSeries = buildNetWorthSeries(accounts, (history && history.accounts) || {});
  const yearNetWorth = netWorthSeries.filter((p) => new Date(p.date) >= yearStart);
  const netWorthDelta = yearNetWorth.length >= 2 ? yearNetWorth[yearNetWorth.length - 1].value - yearNetWorth[0].value : null;

  const weightSeries = (history && history.fitness) || [];
  const yearWeight = weightSeries.filter((p) => new Date(p.date) >= yearStart);
  const weightDelta = yearWeight.length >= 2 ? yearWeight[yearWeight.length - 1].value - yearWeight[0].value : null;

  const yearTx = (transactions || []).filter((t) => t.date && new Date(t.date) >= yearStart);
  const yearSpend = yearTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const byCategory = {};
  yearTx.forEach((t) => { const c = t.category || "Uncategorized"; byCategory[c] = (byCategory[c] || 0) + (Number(t.amount) || 0); });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const habitItems = (habits && habits.items) || [];
  const habitDone = (habits && habits.done) || {};
  const yearDayCount = Math.round((now - yearStart) / 86400000) + 1;
  let habitHits = 0;
  for (let i = 0; i < yearDayCount; i++) {
    const d = new Date(yearStart); d.setDate(yearStart.getDate() + i);
    const k = habitDayKey(d);
    habitItems.forEach((h) => { if (habitDone[h.id] && habitDone[h.id][k]) habitHits += 1; });
  }
  const habitPossible = habitItems.length * yearDayCount;
  const habitPct = habitPossible ? Math.round((habitHits / habitPossible) * 100) : null;

  const yearWorkouts = (workouts || []).filter((w) => w.date && new Date(w.date) >= yearStart);
  const booksFinished = ((reading && reading.books) || []).filter((b) => b.status === "finished" && b.finishedAt && new Date(b.finishedAt) >= yearStart).length;

  const section = (label) => ({ text: label, style: "section" });
  const line = (text) => ({ text, margin: [0, 0, 0, 2] });

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: `Year in BearVantageHub — ${now.getFullYear()}`, style: "title" },
      { text: `${yearStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, style: "subtitle" },

      section("Fitness"),
      line(`Current weight: ${fitness.currentWeight} lbs (target ${fitness.targetWeight} lbs)`),
      line(weightDelta == null ? "Not enough logged data this year to show a trend." : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} lbs since Jan 1`),
      line(`${yearWorkouts.length} workout${yearWorkouts.length === 1 ? "" : "s"} logged this year`),

      section("Golf"),
      line(`Handicap: ${golf.handicap} · ${golf.roundsYtd} rounds YTD`),

      section("Financial"),
      line(`Total across accounts: ${fmtMoney(total)}`),
      line(netWorthDelta == null ? "Not enough snapshots this year to show a trend." : `${netWorthDelta >= 0 ? "+" : ""}${fmtMoney(netWorthDelta)} since Jan 1`),

      section("Transactions"),
      line(`Spent this year: ${fmtMoney(yearSpend)} across ${yearTx.length} transaction${yearTx.length === 1 ? "" : "s"}`),
      line(topCategory ? `Top category: ${topCategory[0]} (${fmtMoney(topCategory[1])})` : "No spending logged this year."),

      section("Habits"),
      line(habitPct == null ? "No habits tracked yet." : `${habitHits} of ${habitPossible} possible check-ins this year (${habitPct}%)`),

      section("Reading"),
      line(`${booksFinished} book${booksFinished === 1 ? "" : "s"} finished this year`),
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: "#1a1a1a", margin: [0, 0, 0, 2] },
      subtitle: { fontSize: 10, italics: true, color: "#767673", margin: [0, 0, 0, 14] },
      section: { fontSize: 12, bold: true, color: "#1a1a1a", margin: [0, 14, 0, 6] },
    },
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#33332f" },
  };
}

function AnnualDigestButton({ theme, fitness, golf, financial, history, transactions, habits, workouts, reading }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const pdfMake = await ravenLoadPdfMake();
      const doc = buildAnnualDigestDocDefinition({ fitness, golf, financial, history, transactions, habits, workouts, reading });
      await pdfMake.createPdf(doc).download(`vantage-year-in-review-${new Date().getFullYear()}.pdf`);
    } catch (err) {
      toast.error(err && err.message ? err.message : "Couldn't build the digest.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={download}
      disabled={busy}
      className="v-btn"
      title="Download Year in BearVantageHub (PDF)"
      aria-label="Download Year in BearVantageHub (PDF)"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted, opacity: busy ? 0.6 : 1 }}
    >
      <IconTrendingUp size={16} />
    </button>
  );
}

function Sidebar({
  theme,
  themeKey,
  fitness,
  golf,
  trackers,
  profile,
  integrations,
  googleAccounts,
  onAddGoogleAccount,
  onRemoveGoogleAccount,
  microsoftEvents,
  onMicrosoftEvents,
  financial,
  events,
  history,
  suggestionsCount,
  upcomingCount,
  weekAgendaCount,
  watchlist,
  journal,
  goals,
  transactions,
  newYoutubeCount,
  youtube,
  golfSimRounds,
  golfOutdoorRounds,
  fantasyCheatSheets,
  fantasyCustomRankings,
  fantasyWatchlist,
  fantasySleeper,
  fantasyYahoo,
  ravenProducts,
  lock,
  setLock,
  onLockNow,
  onOpenPalette,
  reminders,
  setReminders,
  page,
  onNavigate,
  setThemeKey,
  setFitness,
  setGolf,
  setTrackers,
  setProfile,
  setIntegrations,
  setFinancial,
  setEvents,
  setHistory,
  setWatchlist,
  setJournal,
  setGoals,
  setTransactions,
  setYoutube,
  setGolfSimRounds,
  setGolfOutdoorRounds,
  setFantasyCheatSheets,
  setFantasyCustomRankings,
  setFantasyWatchlist,
  setFantasySleeper,
  setFantasyYahoo,
  setRavenProducts,
  habits,
  workouts,
  reading,
  pageVisits,
  onOpenDirectory,
}) {
  const doneGoals = goals.filter((g) => g.status === "done").length;
  const [navOpenGroup, setNavOpenGroup] = usePersistentState(STORAGE_KEYS.navOpenGroup, null);
  // The group holding the current page, so arriving anywhere — including by
  // deep link or by the palette — opens the rail on the right section.
  const groupOfPage = (NAV_GROUPS.find((g) => g.ids.includes(page)) || {}).id || null;
  // Home belongs to no group, so without a fallback the rail would open on
  // Home showing nothing but Home — and collapsed to icons, a single icon.
  const openGroup = navOpenGroup !== null ? navOpenGroup : (groupOfPage || NAV_GROUPS[0].id);
  useEffect(() => {
    // Following a link into another section moves the rail with you rather
    // than leaving it open on where you used to be.
    if (groupOfPage && groupOfPage !== openGroup) setNavOpenGroup(groupOfPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupOfPage]);

  // The five pages actually opened most, which on a personal dashboard is a
  // much better nav than an alphabetical list of thirty-one.
  const frequentPages = useMemo(() => {
    const counts = pageVisits || {};
    // A page already listed in the open section is not repeated up here: the
    // section is the real listing, and two identical rows a few pixels apart
    // read as a rendering fault rather than as a shortcut.
    const inOpenSection = new Set(((NAV_GROUPS.find((g) => g.id === openGroup) || {}).ids) || []);
    return Object.keys(counts)
      .filter((id) => counts[id] >= 2 && !inOpenSection.has(id) && PAGE_META.some((p) => p.id === id))
      .sort((a, b) => counts[b] - counts[a])
      // Four, not five: five plus six group headers plus the open group came to
      // 668px against 634px of rail on a 1000px window, which put the whole
      // point — a nav that never scrolls — 34px out of reach.
      .slice(0, 4)
      .map((id) => PAGE_META.find((p) => p.id === id));
  }, [pageVisits, openGroup]);
  // Off-canvas drawer state (mobile only — the rail is always visible on desktop).
  const [navOpen, setNavOpen] = useState(false);
  // Desktop rail collapse. The flag lives on <html> so the CSS variable that
  // drives both the rail width and the main margin can key off it.
  const [railCollapsed, setRailCollapsed] = usePersistentState(STORAGE_KEYS.railCollapsed, false);
  // Not persisted: the tray is a thing you open, use and forget, and a rail
  // that comes back tomorrow already holding six icons is the thing this is
  // meant to stop.
  const [railToolsOpen, setRailToolsOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("rail-collapsed", !!railCollapsed);
    return () => document.documentElement.classList.remove("rail-collapsed");
  }, [railCollapsed]);
  // The nav list fades at its bottom edge to show there is more below; drop
  // the fade once you have actually reached the end, so the last item is not
  // left permanently dimmed.
  const navScrollRef = useRef(null);
  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const update = () => {
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      el.classList.toggle("is-scrollend", atEnd);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    return () => { el.removeEventListener("scroll", update); if (ro) ro.disconnect(); };
  });

  const closeNav = () => setNavOpen(false);
  const go = (id) => { onNavigate(id); setNavOpen(false); };
  const openPalette = () => { onOpenPalette(); setNavOpen(false); };

  useEffect(() => {
    if (!navOpen) return;
    function onKey(e) { if (e.key === "Escape") setNavOpen(false); }
    // Desktop restores the permanent rail, so a stale "open" would leave the
    // scrim stranded over the page.
    function onResize() { if (window.innerWidth > 900) setNavOpen(false); }
    const releaseScroll = lockBodyScroll();
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      releaseScroll();
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [navOpen]);
  const valueByPage = {
    fitness: fitness.currentWeight,
    golf: golf.handicap,
    financial: financial.targetDownPayment
      ? `${Math.min(100, Math.round(((financial.currentSavings || 0) / financial.targetDownPayment) * 100))}%`
      : null,
    transactions: transactions.length || null,
    upcoming: upcomingCount || null,
    agenda: weekAgendaCount || null,
    youtube: newYoutubeCount || null,
    profile: profile.interests.length || null,
    watchlist: watchlist.length || null,
    trackers: trackers.length || null,
    goals: goals.length ? `${doneGoals}/${goals.length}` : null,
    videos: null,
    journal: journal.length || null,
    fantasy: fantasyWatchlist.length || null,
  };

  const railVars = { "--rail-bg": theme.themeBarBg, "--rail-border": theme.themeBarBorder };

  return (
    <React.Fragment>
      <header className="v-topbar" style={railVars}>
        <button
          onClick={() => setNavOpen((o) => !o)}
          className="v-btn"
          title={navOpen ? "Close navigation" : "Open navigation"}
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navOpen}
          aria-controls="v-rail"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}
        >
          <IconMenu />
        </button>
        <button
          onClick={() => go("home")}
          style={{ display: "flex", alignItems: "center", gap: "9px", border: "none", background: "transparent", cursor: "pointer", padding: "4px 2px", minWidth: 0 }}
        >
          <span style={{ width: "28px", height: "28px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: theme.accentSoft, color: theme.accentOn, border: `1px solid ${theme.divider}`, flexShrink: 0 }}>
            <IconLogo />
          </span>
          <span className="v-topbar__where" style={{ minWidth: 0, textAlign: "left" }}>
            <span style={{ display: "block", fontSize: "16px", fontWeight: theme.headerWeight, color: theme.text, letterSpacing: "-0.01em", whiteSpace: "nowrap", lineHeight: 1.15 }}>
              {page === "home" ? "BearVantageHub" : ((PAGE_META.find((m) => m.id === page) || {}).label || "BearVantageHub")}
            </span>
            {page !== "home" && (
              <span style={{ display: "block", fontSize: "11px", color: theme.textFaint, whiteSpace: "nowrap", lineHeight: 1.2 }}>BearVantageHub</span>
            )}
          </span>
        </button>
        <button
          onClick={openPalette}
          className="v-btn"
          title="Search"
          aria-label="Search"
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}
        >
          <IconSearch size={16} />
        </button>
      </header>

      {navOpen && (
        <button className="v-scrim" aria-label="Close navigation" onClick={closeNav} />
      )}

    <nav
      id="v-rail"
      className={"v-rail" + (navOpen ? " is-open" : "")}
      aria-label="Main"
      style={railVars}
    >
      <button
        onClick={() => go("home")}
        className="v-rail-brand"
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 6px", flexShrink: 0, border: "none", background: "transparent", cursor: "pointer" }}
      >
        <span
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.accentSoft,
            color: theme.accentOn,
            border: `1px solid ${theme.divider}`,
            flexShrink: 0,
          }}
        >
          <IconLogo />
        </span>
        <span
          className="v-rail-brand__text"
          style={{
            fontSize: "18px",
            fontWeight: theme.headerWeight,
            color: theme.text,
            letterSpacing: "-0.01em",
          }}
        >
          BearVantageHub
        </span>
      </button>

      <div className="v-rail-nav" ref={navScrollRef}>
        <button onClick={openPalette} className="v-btn" title="Search (Cmd-K)" style={{ display: "flex", alignItems: "center", gap: "9px", width: "100%", padding: "9px 10px", marginBottom: "4px", borderRadius: "10px", border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.textMuted, cursor: "pointer" }}>
          <IconSearch size={14} />
          <span className="v-railonly" style={{ flex: 1, textAlign: "left", fontSize: "13px" }}>Search…</span>
          <span className="v-railonly" style={{ fontSize: "11px", border: `1px solid ${theme.cardBorder}`, borderRadius: "4px", padding: "1px 5px" }}>⌘K</span>
        </button>
        <NavItem
          theme={theme}
          icon={<IconBulb size={14} />}
          label="Home"
          value={suggestionsCount || null}
          active={page === "home"}
          onClick={() => go("home")}
        />
        {frequentPages.length >= 3 && (
          <div style={{ marginTop: "2px" }}>
            <div className="v-navgroup v-navgroup--static" style={{ padding: "4px 10px 3px", color: theme.textFaint, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <span className="v-railonly">Frequent</span>
            </div>
            {frequentPages.map((item) => (
              <NavItem
                key={"freq-" + item.id}
                theme={theme}
                icon={item.icon}
                label={item.label}
                value={valueByPage[item.id]}
                active={page === item.id}
                onClick={() => go(item.id)}
              />
            ))}
          </div>
        )}
        {NAV_GROUPS.map((group) => {
          const items = group.ids
            .map((id) => PAGE_META.find((p) => p.id === id))
            .filter(Boolean);
          if (!items.length) return null;
          const collapsed = openGroup !== group.id;
          return (
            <div key={group.id} style={{ marginTop: "2px" }}>
              <button
                onClick={() => setNavOpenGroup(collapsed ? group.id : "")}
                className="v-btn v-navgroup"
                aria-expanded={!collapsed}
                title={collapsed ? "Expand" : "Collapse"}
                style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", padding: "4px 10px 3px", background: "transparent", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                <NavChevron collapsed={collapsed} />
                <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
              </button>
              {!collapsed &&
                items.map((item) => (
                  <NavItem
                    key={item.id}
                    theme={theme}
                    icon={item.icon}
                    label={item.label}
                    value={valueByPage[item.id]}
                    active={page === item.id}
                    onClick={() => go(item.id)}
                  />
                ))}
            </div>
          );
        })}
        {(() => {
          const grouped = new Set(NAV_GROUPS.flatMap((g) => g.ids));
          const rest = PAGE_META.filter((p) => !grouped.has(p.id));
          if (!rest.length) return null;
          return (
            <div style={{ marginTop: "8px" }}>
              {rest.map((item) => (
                <NavItem
                  key={item.id}
                  theme={theme}
                  icon={item.icon}
                  label={item.label}
                  value={valueByPage[item.id]}
                  active={page === item.id}
                  onClick={() => go(item.id)}
                />
              ))}
            </div>
          );
        })()}
      </div>

      <button
        onClick={onOpenDirectory}
        className="v-btn v-rail-all"
        title="All pages and tools"
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", marginTop: "6px", borderRadius: "10px", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted, fontSize: "var(--fs-2)", fontWeight: 600 }}
      >
        <IconGrid size={14} />
        <span className="v-railonly" style={{ flex: 1, textAlign: "left" }}>All pages</span>
        <span className="v-railonly v-tabular" style={{ color: theme.textFaint }}>{PAGE_META.length + MO_TOOLS.length}</span>
      </button>

      <button
        onClick={() => setRailCollapsed((v) => !v)}
        className="v-btn v-rail-collapse"
        title={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "7px 8px", borderRadius: "10px", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted, fontSize: "12px", fontWeight: 700 }}
      >
        <span style={{ display: "inline-flex", transform: railCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}><IconCollapse size={14} /></span>
        <span className="v-railonly">Collapse</span>
      </button>

      <div className="v-rail-utilities">
        <ThemePicker theme={theme} themeKey={themeKey} setThemeKey={setThemeKey} />
        <RemindersMenu theme={theme} reminders={reminders} setReminders={setReminders} events={events} />
        <button
          onClick={() => setRailToolsOpen((v) => !v)}
          className="v-btn v-iconbtn v-rail-tools"
          aria-expanded={railToolsOpen}
          title={railToolsOpen ? "Hide tools" : "Backups, digests, calendar, lock"}
          aria-label={railToolsOpen ? "Hide tools" : "More tools"}
          style={{ color: theme.textMuted }}
        >
          <IconSettings size={15} />
        </button>
      </div>

      <div className={"v-rail-utilities v-rail-tools__tray" + (railToolsOpen ? " is-open" : "")} hidden={!railToolsOpen}>
        <InstallAppButton theme={theme} />
        <WeeklyDigestButton theme={theme} fitness={fitness} golf={golf} financial={financial} history={history} transactions={transactions} habits={habits} events={events} />
        <AnnualDigestButton theme={theme} fitness={fitness} golf={golf} financial={financial} history={history} transactions={transactions} habits={habits} workouts={workouts} reading={reading} />
        <CalendarMenu
          theme={theme}
          integrations={integrations}
          setIntegrations={setIntegrations}
          googleAccounts={googleAccounts}
          onAddGoogleAccount={onAddGoogleAccount}
          onRemoveGoogleAccount={onRemoveGoogleAccount}
          microsoftEvents={microsoftEvents}
          onMicrosoftEvents={onMicrosoftEvents}
        />
        <BackupMenu
          theme={theme}
          themeKey={themeKey}
          fitness={fitness}
          golf={golf}
          trackers={trackers}
          profile={profile}
          financial={financial}
          events={events}
          history={history}
          watchlist={watchlist}
          journal={journal}
          goals={goals}
          transactions={transactions}
          youtube={youtube}
          golfSimRounds={golfSimRounds}
          golfOutdoorRounds={golfOutdoorRounds}
          fantasyCheatSheets={fantasyCheatSheets}
          fantasyCustomRankings={fantasyCustomRankings}
          fantasyWatchlist={fantasyWatchlist}
          fantasySleeper={fantasySleeper}
          fantasyYahoo={fantasyYahoo}
          ravenProducts={ravenProducts}
          setThemeKey={setThemeKey}
          setFitness={setFitness}
          setGolf={setGolf}
          setTrackers={setTrackers}
          setProfile={setProfile}
          setFinancial={setFinancial}
          setEvents={setEvents}
          setHistory={setHistory}
          setWatchlist={setWatchlist}
          setJournal={setJournal}
          setGoals={setGoals}
          setTransactions={setTransactions}
          setYoutube={setYoutube}
          setGolfSimRounds={setGolfSimRounds}
          setGolfOutdoorRounds={setGolfOutdoorRounds}
          setFantasyCheatSheets={setFantasyCheatSheets}
          setFantasyCustomRankings={setFantasyCustomRankings}
          setFantasyWatchlist={setFantasyWatchlist}
          setFantasySleeper={setFantasySleeper}
          setFantasyYahoo={setFantasyYahoo}
          setRavenProducts={setRavenProducts}
        />
        <LockMenu theme={theme} lock={lock} setLock={setLock} onLockNow={onLockNow} />
      </div>
    </nav>
    </React.Fragment>
  );
}

function IconSettings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconGrid({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

function homeGreeting() {
  const hr = new Date().getHours();
  if (hr < 5) return "Still up";
  if (hr < 12) return "Good morning";
  if (hr < 18) return "Good afternoon";
  return "Good evening";
}
function homeTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---- Shared modules ---- */

function HomeGreeting({ theme, name, weather, weatherStatus, onEnableWeather, big }) {
  const today = new Date();
  // weather only ever carries a `days` array (see fetchWeatherDays) — there
  // is no top-level temp/label field, so today's reading has to be picked
  // out of that array. Same lookup the briefing modal already does.
  const todayIso = today.toISOString().slice(0, 10);
  const todayWeather = weather && weather.days ? weather.days.find((d) => d.date === todayIso) : null;
  const todayInfo = todayWeather ? weatherInfo(todayWeather.code) : null;
  return (
    <Card theme={theme} style={{ height: "auto" }} delay={0}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: big ? "clamp(24px, 4vw, 34px)" : "clamp(18px, 2.6vw, 23px)", fontWeight: 800, letterSpacing: "-0.02em", color: theme.text, lineHeight: 1.15, fontFamily: "var(--v-font-display, inherit)" }}>
            {homeGreeting()}{name ? `, ${name}` : ""}.
          </div>
          <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "5px" }}>
            {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        {todayWeather ? (
          <div style={{ textAlign: "right" }}>
            <div className="v-tabular" style={{ fontSize: big ? "30px" : "24px", fontWeight: 800, color: theme.text }}>{todayWeather.tempMax}°</div>
            {todayInfo && <div style={{ fontSize: "12px", color: theme.textFaint }}>{todayInfo.icon} {todayInfo.label}</div>}
          </div>
        ) : (
          onEnableWeather && (
            <button onClick={onEnableWeather} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, padding: "7px 12px", borderRadius: "999px", border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}>
              Add local weather
            </button>
          )
        )}
      </div>
      {weatherStatus && weatherStatus.type === "error" && (
        <div style={{ fontSize: "12px", color: theme.danger, marginTop: "8px" }}>{weatherStatus.message}</div>
      )}
    </Card>
  );
}

// A compact slice of the same data WeatherPage already renders in full —
// pure presentation, reuses weatherInfo/WEATHER_DAY_NAMES rather than
// duplicating any forecast logic.
function HomeWeatherStrip({ theme, weather, weatherStatus, onEnableWeather, onNavigate }) {
  const enabled = weather && weather.lat != null;

  if (!enabled) {
    return (
      <Card theme={theme} delay={20}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <SectionLabel theme={theme} icon={<IconCloud size={14} />} style={{ margin: 0 }}>Weather</SectionLabel>
            <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "4px" }}>Add your location to see the week's forecast here.</div>
          </div>
          <button onClick={onEnableWeather} className="v-btn" style={{ fontSize: "12.5px", fontWeight: 700, color: theme.accentText, background: theme.accent, border: "none", borderRadius: "999px", padding: "8px 16px", flexShrink: 0 }}>
            {weatherStatus && weatherStatus.type === "loading" ? weatherStatus.message : "Add local weather"}
          </button>
        </div>
        {weatherStatus && weatherStatus.type === "error" && (
          <div style={{ fontSize: "12px", color: theme.danger, marginTop: "10px" }}>{weatherStatus.message}</div>
        )}
      </Card>
    );
  }

  const days = (weather.days || []).slice(0, 5);
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <Card theme={theme} delay={20}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
        <SectionLabel theme={theme} icon={<IconCloud size={14} />} style={{ margin: 0 }}>Weather</SectionLabel>
        <button onClick={() => onNavigate("weather")} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.accentOn, background: "transparent", border: "none", padding: 0 }}>
          Full forecast →
        </button>
      </div>
      {days.length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>No forecast yet.</div>
      ) : (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {days.map((d) => {
            const info = weatherInfo(d.code);
            const isToday = d.date === todayIso;
            const dow = WEATHER_DAY_NAMES[new Date(d.date + "T00:00:00").getDay()];
            return (
              <div
                key={d.date}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "10px 8px", borderRadius: "10px", flex: "1 1 0", minWidth: "56px",
                  border: `1px solid ${isToday ? theme.accent : theme.divider}`,
                  background: isToday ? theme.accentSoft : "transparent",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>{isToday ? "Today" : dow}</div>
                <div style={{ fontSize: "20px" }}>{info.icon}</div>
                <div className="v-tabular" style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{d.tempMax}°</div>
                <div className="v-tabular" style={{ fontSize: "11px", color: theme.textFaint }}>{d.tempMin}°</div>
              </div>
            );
          })}
        </div>
      )}
      {weatherStatus && weatherStatus.type === "error" && (
        <div style={{ fontSize: "12px", color: theme.danger, marginTop: "10px" }}>{weatherStatus.message}</div>
      )}
    </Card>
  );
}

function HomeAgenda({ theme, events, onNavigate, limit = 5 }) {
  const today = homeTodayISO();
  const upcoming = (events || [])
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, limit);
  return (
    <Card theme={theme} style={{ height: "auto" }} delay={40}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconCalendar />} style={{ margin: 0, flex: 1 }}>What's ahead</SectionLabel>
        <button onClick={() => onNavigate("upcoming")} className="v-btn v-linkbtn" style={{ fontSize: "11.5px", fontWeight: 700, color: theme.accent, background: "transparent", border: "none" }}>All</button>
      </div>
      <div style={{ marginTop: "12px" }}>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: "12.5px", color: theme.textFaint }}>Nothing scheduled. Enjoy it.</div>
        ) : (
          upcoming.map((e, i) => {
            const d = new Date(e.date + "T00:00:00");
            const days = Math.round((d - new Date(today + "T00:00:00")) / 86400000);
            return (
              <div key={(e.id || e.title) + i} style={{ display: "flex", gap: "11px", alignItems: "baseline", padding: "8px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}` }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: theme.accent, width: "44px", flexShrink: 0 }}>
                  {days === 0 ? "TODAY" : days === 1 ? "TMRW" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}
                </span>
                <span style={{ fontSize: "13px", color: theme.text, flex: 1, minWidth: 0 }}>{e.title}</span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function HomeReminders({ theme, reminders, onNavigate }) {
  const items = ((reminders && reminders.items) || []).filter((r) => !r.notified).slice(0, 4);
  const habitsHint = null;
  return (
    <Card theme={theme} style={{ height: "auto" }} delay={60}>
      <SectionLabel theme={theme} icon={<IconBell size={14} />}>Reminders</SectionLabel>
      {items.length === 0 ? (
        <div style={{ fontSize: "12.5px", color: theme.textFaint }}>No reminders pending.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {items.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: theme.accent, marginTop: "6px", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: theme.text, lineHeight: 1.45 }}>{r.text}</span>
            </div>
          ))}
        </div>
      )}
      {habitsHint}
    </Card>
  );
}

function HomeHabits({ theme, habits, onNavigate }) {
  const items = (habits && habits.items) || [];
  const today = homeTodayISO();
  const done = items.filter((hb) => ((habits.done || {})[hb.id] || {})[today]).length;
  return (
    <Card theme={theme} style={{ height: "auto" }} delay={80}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconFlame />} style={{ margin: 0, flex: 1 }}>Habits today</SectionLabel>
        <button onClick={() => onNavigate("habits")} className="v-btn v-linkbtn" style={{ fontSize: "11.5px", fontWeight: 700, color: theme.accent, background: "transparent", border: "none" }}>Open</button>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: "12.5px", color: theme.textFaint, marginTop: "10px" }}>No habits yet.</div>
      ) : (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px" }}>
            <span className="v-tabular" style={{ fontSize: "26px", fontWeight: 800, color: theme.text }}>{done}/{items.length}</span>
            <span style={{ fontSize: "12.5px", color: theme.textMuted }}>done</span>
          </div>
          <div style={{ height: "7px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden", marginTop: "9px" }}>
            <div style={{ width: (items.length ? (done / items.length) * 100 : 0) + "%", height: "100%", background: theme.progressFill }} />
          </div>
        </React.Fragment>
      )}
    </Card>
  );
}

/* Home news module. Loads on its own rather than waiting for a visit to the
   News tab, so the home page is useful the moment it opens, and carries a
   compact category switcher of its own. */
const HOME_NEWS_CATS = ["world", "tech", "security", "sportsnews"];

function HomeHeadlines({ theme, feeds, setFeeds, onNavigate, limit = 5, lead, switcher }) {
  const [cat, setCat] = useState(HOME_NEWS_CATS[0]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const cache = (feeds && feeds.cache) || {};
  const fetchedAt = (feeds && feeds.fetchedAt) || {};

  async function load(catId, force) {
    const def = FEED_CATEGORIES.find((c) => c.id === catId);
    if (!def || !setFeeds) return;
    const cached = cache[catId] || [];
    const stale = !fetchedAt[catId] || Date.now() - fetchedAt[catId] > FEED_STALE_MS;
    if (!force && cached.length && !stale) return;
    setLoading(true);
    setFailed(false);
    try {
      const items = await fetchFeedItems(def.url, 12);
      if (!items.length) throw new Error("no stories");
      setFeeds((s) => ({
        ...(s || {}),
        cache: { ...((s || {}).cache || {}), [catId]: items },
        fetchedAt: { ...((s || {}).fetchedAt || {}), [catId]: Date.now() },
      }));
    } catch (e) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(cat); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cat]);

  // Fall back to whatever category does have stories, so the module is never
  // blank just because this one failed.
  let items = cache[cat] || [];
  if (!items.length) {
    const alt = Object.keys(cache).find((k) => (cache[k] || []).length);
    if (alt) items = cache[alt];
  }
  items = items.slice(0, limit);

  return (
    <Card theme={theme} style={{ height: "auto" }} delay={60}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <SectionLabel theme={theme} icon={<IconNews />} style={{ margin: 0, flex: 1 }}>Headlines</SectionLabel>
        <button onClick={() => load(cat, true)} disabled={loading} className="v-btn v-linkbtn" title="Refresh headlines" aria-label="Refresh headlines" style={{ fontSize: "13px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: "none" }}>
          {loading ? "…" : "↻"}
        </button>
        <button onClick={() => onNavigate("news")} className="v-btn v-linkbtn" style={{ fontSize: "11.5px", fontWeight: 700, color: theme.accent, background: "transparent", border: "none" }}>More</button>
      </div>

      {switcher && (
        <div style={{ display: "flex", gap: "5px", marginTop: "11px", flexWrap: "wrap" }}>
          {HOME_NEWS_CATS.map((id) => {
            const def = FEED_CATEGORIES.find((c) => c.id === id);
            if (!def) return null;
            const on = cat === id;
            return (
              <button
                key={id}
                onClick={() => setCat(id)}
                className="v-btn"
                aria-pressed={on}
                style={{ padding: "5px 11px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700, border: `1px solid ${on ? theme.accent : theme.cardBorder}`, background: on ? theme.accentSoft : "transparent", color: on ? theme.accent : theme.textMuted }}
              >
                {def.label}
              </button>
            );
          })}
        </div>
      )}

      {items.length === 0 ? (
        loading ? (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[0, 1, 2].map((i) => <span key={i} className="v-skeleton" style={{ height: "13px", width: i === 2 ? "58%" : "88%" }} />)}
          </div>
        ) : (
          <div style={{ fontSize: "12.5px", color: theme.textFaint, marginTop: "12px", lineHeight: 1.5 }}>
            {failed ? "Couldn't reach the news services just now — try ↻ in a moment." : "No stories yet."}
          </div>
        )
      ) : (
        <div style={{ marginTop: "12px" }}>
          {lead && items[0] && (
            <a href={items[0].link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "12px", textDecoration: "none", paddingBottom: "12px", marginBottom: "10px", borderBottom: `1px solid ${theme.divider}` }}>
              <FeedArt theme={theme} item={items[0]} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: theme.text, lineHeight: 1.35 }}>{items[0].title}</span>
                {items[0].summary && <span style={{ display: "block", fontSize: "12.5px", color: theme.textMuted, marginTop: "4px", lineHeight: 1.45 }}>{truncateText(items[0].summary, 120)}</span>}
                <span style={{ display: "block", fontSize: "11.5px", color: theme.textFaint, marginTop: "4px" }}>{items[0].source}{items[0].pub ? ` · ${feedRelTime(items[0].pub)}` : ""}</span>
              </span>
            </a>
          )}
          {items.slice(lead ? 1 : 0).map((it, i) => (
            <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", padding: "9px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}` }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.text, lineHeight: 1.4 }}>{it.title}</span>
              <span style={{ display: "block", fontSize: "11px", color: theme.textFaint, marginTop: "2px" }}>{it.source}{it.pub ? ` · ${feedRelTime(it.pub)}` : ""}</span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

const SNAPSHOT_WIDTHS = [210, 130, 160, 110, 190, 140, 170, 120];

function HomeSnapshotCard({ page, theme, onNavigate, width, src }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return (
    <button
      onClick={() => onNavigate(page.id)}
      className="v-btn v-snapcard"
      style={{ width: `${width}px`, border: `1px solid ${theme.cardBorder}` }}
      title={page.label}
    >
      <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
      <span className="v-snapcard__veil" aria-hidden="true" />
      <span className="v-snapcard__label">{page.icon}{page.label}</span>
    </button>
  );
}

/* Home "Snapshots" — a horizontally-scrolling strip of page photos in mixed
   widths. A deliberately different spot/size/shape than the per-page banner
   (see PageBanner) so the same photos aren't stuck in one place. */
function HomeSnapshots({ theme, onNavigate, images }) {
  const pages = PAGE_META.filter((p) => PAGE_BANNER_IMG[p.id]);
  if (!pages.length) return null;
  return (
    <div>
      <SectionLabel theme={theme} icon={<IconImage size={14} />}>Snapshots</SectionLabel>
      <div className="v-snaprow">
        {pages.map((p, i) => {
          const override = images && Object.prototype.hasOwnProperty.call(images, p.id) ? images[p.id] : undefined;
          const src = (override !== undefined ? override : PAGE_BANNER_IMG[p.id]) || "";
          return (
            <HomeSnapshotCard
              key={p.id}
              page={p}
              theme={theme}
              onNavigate={onNavigate}
              width={SNAPSHOT_WIDTHS[i % SNAPSHOT_WIDTHS.length]}
              src={src}
            />
          );
        })}
      </div>
    </div>
  );
}

// Per-widget glow color, opt-in via theme.categoryGlow (only Aurora Glass
// sets it). Every other theme keeps its single accent everywhere — this
// only kicks in for the one theme built around a multi-hue widget wall.
const CATEGORY_GLOW = {
  fitness: "#ff5d7a", golf: "#ff5d7a", fantasy: "#ff9f40", sports: "#ff9f40",
  financial: "#22b088", transactions: "#22b088", subscriptions: "#22b088",
  upcoming: "#ff9f40", weather: "#ff9f40", travel: "#ff9f40", agenda: "#ff9f40",
  youtube: "#2ba9d6", news: "#2ba9d6", movies: "#2ba9d6", gaming: "#2ba9d6",
  watchlist: "#2ba9d6", videos: "#2ba9d6", reading: "#2ba9d6", games: "#2ba9d6",
  profile: "#a78bfa", resume: "#a78bfa", trackers: "#a78bfa", goals: "#a78bfa",
  journal: "#a78bfa", habits: "#a78bfa", mealplanning: "#a78bfa", birthdays: "#a78bfa",
  securityx: "#6c6bff", ravenseye: "#6c6bff",
};
function categoryGlowColor(theme, pageId) {
  return theme.categoryGlow ? (CATEGORY_GLOW[pageId] || theme.accent) : theme.accent;
}

// Reordering happens within whatever subset is currently visible (pinned 6,
// dense grid, everything), but is stored as one global page-id order so it
// carries across every Home layout instead of being layout-specific.
function reorderPageIds(order, allIds, draggedId, targetId) {
  const base = order && order.length ? order.filter((id) => allIds.includes(id)) : allIds.slice();
  allIds.forEach((id) => { if (!base.includes(id)) base.push(id); });
  const from = base.indexOf(draggedId);
  const to = base.indexOf(targetId);
  if (from === -1 || to === -1 || from === to) return base;
  const next = base.slice();
  next.splice(from, 1);
  next.splice(to, 0, draggedId);
  return next;
}

function HomeTiles({ theme, pageStats, onNavigate, ids, dense, order, onReorder }) {
  const list = ids && ids.length ? PAGE_META.filter((p) => ids.includes(p.id)) : PAGE_META;
  const sorted = useMemo(() => {
    if (!order || !order.length) return list;
    const rank = new Map(order.map((id, i) => [id, i]));
    return [...list].sort((a, b) => {
      const ai = rank.has(a.id) ? rank.get(a.id) : Infinity;
      const bi = rank.has(b.id) ? rank.get(b.id) : Infinity;
      return ai - bi;
    });
  }, [list, order]);
  const [dragId, setDragId] = useState(null);
  const draggable = !!onReorder;
  const allIds = useMemo(() => PAGE_META.map((p) => p.id), []);

  return (
    <div className={"v-hometiles" + (dense ? " v-hometiles--dense" : "")}>
      {sorted.map((p) => {
        const stat = pageStats[p.id] || {};
        const glow = categoryGlowColor(theme, p.id);
        return (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            className={"v-card v-hometile" + (dragId === p.id ? " v-hometile--dragging" : "")}
            style={{ ...cardBackgroundStyle(theme), "--accent-line": glow }}
            draggable={draggable}
            onDragStart={draggable ? (e) => { setDragId(p.id); e.dataTransfer.effectAllowed = "move"; } : undefined}
            onDragOver={draggable ? (e) => e.preventDefault() : undefined}
            onDrop={
              draggable
                ? (e) => {
                    e.preventDefault();
                    if (dragId && dragId !== p.id) onReorder(reorderPageIds(order, allIds, dragId, p.id));
                    setDragId(null);
                  }
                : undefined
            }
            onDragEnd={draggable ? () => setDragId(null) : undefined}
            title={draggable ? `${p.label} — drag to reorder` : undefined}
          >
            {theme.categoryGlow && <span className="v-hometile__glow" aria-hidden="true" style={{ background: glow }} />}
            <span className="v-hometile__mark" aria-hidden="true" style={{ color: theme.text }}>{p.icon}</span>
            <span className="v-hometile__head">
              <span style={{ color: glow, display: "inline-flex", flexShrink: 0 }}>{p.icon}</span>
              <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.sectionLabelColor }}>{p.label}</span>
            </span>
            <span className="v-tabular" style={{ fontSize: dense ? "19px" : "25px", fontWeight: 700, color: theme.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {stat.value !== null && stat.value !== undefined && stat.value !== "" ? stat.value : "—"}
            </span>
            {stat.detail && !dense && <span style={{ fontSize: "11px", color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* A compact vertical list of stats — the "rail" used by Command Center. */
function HomeStatRail({ theme, pageStats, onNavigate, ids }) {
  const list = PAGE_META.filter((p) => ids.includes(p.id));
  return (
    <Card theme={theme} style={{ height: "auto" }} delay={80}>
      <SectionLabel theme={theme} icon={<IconTrendingUp size={14} />}>At a glance</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {list.map((p, i) => {
          const stat = pageStats[p.id] || {};
          return (
            <button
              key={p.id}
              onClick={() => onNavigate(p.id)}
              className="v-btn"
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 2px", background: "transparent", border: "none", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}`, textAlign: "left", width: "100%" }}
            >
              <span style={{ color: theme.accent, display: "inline-flex", flexShrink: 0 }}>{p.icon}</span>
              <span style={{ fontSize: "12.5px", color: theme.textMuted, flex: 1, minWidth: 0 }}>{p.label}</span>
              <span className="v-tabular" style={{ fontSize: "14px", fontWeight: 800, color: theme.text }}>
                {stat.value !== null && stat.value !== undefined && stat.value !== "" ? stat.value : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

const HOME_PINNED = ["fitness", "golf", "financial", "upcoming", "habits", "news"];
const HOME_RAIL = ["fitness", "golf", "financial", "transactions", "subscriptions", "habits", "goals", "reading"];

function HomeOverview({
  theme, suggestions, weather, weatherStatus, onEnableWeather, onOpenBriefing, pageStats, onNavigate,
  events, feeds, setFeeds, profile,
}) {
  const name = (profile && profile.name) ? String(profile.name).split(" ")[0] : "";
  const forYou = (
    <SuggestionsSection
      theme={theme}
      suggestions={suggestions}
      onOpenBriefing={onOpenBriefing}
      weather={weather}
      weatherStatus={weatherStatus}
      onEnableWeather={onEnableWeather}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <HomeGreeting theme={theme} name={name} weather={weather} weatherStatus={weatherStatus} onEnableWeather={onEnableWeather} />
      <HomeWeatherStrip theme={theme} weather={weather} weatherStatus={weatherStatus} onEnableWeather={onEnableWeather} onNavigate={onNavigate} />
      <div className="v-home-brief">
        <div className="v-home-col">
          <HomeHeadlines theme={theme} feeds={feeds} setFeeds={setFeeds} onNavigate={onNavigate} limit={7} lead />
        </div>
        <div className="v-home-col">
          {forYou}
          <HomeAgenda theme={theme} events={events} onNavigate={onNavigate} limit={4} />
          <HomeStatRail theme={theme} pageStats={pageStats} onNavigate={onNavigate} ids={HOME_RAIL.slice(0, 6)} />
        </div>
      </div>
    </div>
  );
}


/* ----------------------------------------------------------------------
   SPORTS — team & league headlines via ESPN's public JSON API

   ESPN's site.api.espn.com news endpoints are CORS-enabled and need no key,
   so this works client-side. Results cache to localStorage. Live fetches
   only happen on the deployed site — the sandbox/preview blocks outbound
   requests, so the tab shows a friendly note there.
---------------------------------------------------------------------- */
function IconTrophy({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H5a2 2 0 0 0 0 4h1M16 5h3a2 2 0 0 1 0 4h-1" />
      <path d="M12 12v4M9 20h6M10 20v-2h4v2" />
    </svg>
  );
}
function IconCreditCard({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}

function relTimeFrom(iso) {
  try {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch (e) { return ""; }
}

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
// Team news uses ESPN team ids; league news omits the team param.
const SPORTS_FEEDS = [
  { id: "celtics", label: "Boston Celtics", league: "NBA", path: "basketball/nba/news?team=2" },
  { id: "redsox", label: "Boston Red Sox", league: "MLB", path: "baseball/mlb/news?team=2" },
  { id: "bruins", label: "Boston Bruins", league: "NHL", path: "hockey/nhl/news?team=1" },
  { id: "colts", label: "Indianapolis Colts", league: "NFL", path: "football/nfl/news?team=11" },
  { id: "nba", label: "NBA — around the league", league: "NBA", path: "basketball/nba/news" },
  { id: "mlb", label: "MLB — around the league", league: "MLB", path: "baseball/mlb/news" },
  { id: "nfl", label: "NFL — around the league", league: "NFL", path: "football/nfl/news" },
];
const SPORTS_STALE_MS = 30 * 60 * 1000;

async function fetchSportsFeed(feed) {
  const r = await fetch(`${ESPN_BASE}/${feed.path}`);
  if (!r.ok) throw new Error("Sports request failed (" + r.status + ")");
  const data = await r.json();
  return (data.articles || [])
    .filter((a) => a.headline)
    .slice(0, 8)
    .map((a) => ({
      id: String(a.id || a.headline),
      headline: a.headline,
      description: a.description || "",
      published: a.published || a.lastModified || null,
      image: (() => {
        const img = (a.images || []).find((x) => x && x.url);
        return img ? img.url : null;
      })(),
      link: (a.links && a.links.web && a.links.web.href) || (a.links && a.links.mobile && a.links.mobile.href) || "#",
    }));
}

// --- Schedule & scores (ESPN team schedule endpoint; CORS-enabled, no key) ---
const SPORTS_TEAMS = [
  { id: "celtics", label: "Boston Celtics", league: "NBA", sport: "basketball", lg: "nba", teamId: "2" },
  { id: "redsox", label: "Boston Red Sox", league: "MLB", sport: "baseball", lg: "mlb", teamId: "2" },
  { id: "bruins", label: "Boston Bruins", league: "NHL", sport: "hockey", lg: "nhl", teamId: "1" },
  { id: "colts", label: "Indianapolis Colts", league: "NFL", sport: "football", lg: "nfl", teamId: "11" },
];

function espnScore(c) {
  if (!c || c.score == null) return null;
  const s = typeof c.score === "object" ? c.score.value : c.score;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

async function fetchTeamSchedule(team) {
  const r = await fetch(`${ESPN_BASE}/${team.sport}/${team.lg}/teams/${team.teamId}/schedule`);
  if (!r.ok) throw new Error("Schedule request failed (" + r.status + ")");
  const data = await r.json();
  const events = data.events || [];
  const games = events.map((ev) => {
    const comp = (ev.competitions && ev.competitions[0]) || {};
    const comps = comp.competitors || [];
    const me = comps.find((c) => String(c.team && c.team.id) === String(team.teamId)) || comps[0] || {};
    const opp = comps.find((c) => c !== me) || {};
    const st = (comp.status && comp.status.type) || (ev.status && ev.status.type) || {};
    return {
      id: String(ev.id || ev.date),
      date: ev.date || comp.date || null,
      completed: !!st.completed,
      state: st.state || "pre",
      detail: st.shortDetail || "",
      home: me.homeAway === "home",
      opp: (opp.team && (opp.team.shortDisplayName || opp.team.displayName || opp.team.name)) || "TBD",
      myScore: espnScore(me),
      oppScore: espnScore(opp),
      win: me.winner === true ? true : opp.winner === true ? false : null,
    };
  });
  const completed = games.filter((g) => g.completed);
  const upcoming = games.filter((g) => !g.completed && g.date);
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  return { next: upcoming[0] || null, recent: completed.slice(-5).reverse() };
}

function schedDate(iso, withTime) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const base = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return withTime ? `${base} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : base;
}

function GameLine({ theme, g }) {
  const res = g.win === true ? "W" : g.win === false ? "L" : "—";
  const resColor = g.win === true ? theme.positive : g.win === false ? theme.danger : theme.textMuted;
  const scoreTxt = g.myScore != null && g.oppScore != null ? `${g.myScore}–${g.oppScore}` : "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: `1px solid ${theme.divider}` }}>
      <span style={{ fontSize: "13px", fontWeight: 800, color: resColor, width: "16px", flexShrink: 0 }}>{res}</span>
      <span style={{ fontSize: "13px", color: theme.text, flex: 1, minWidth: 0 }}>{g.home ? "vs" : "@"} {g.opp}</span>
      <span className="v-tabular" style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{scoreTxt}</span>
      <span style={{ fontSize: "11px", color: theme.textFaint, width: "70px", textAlign: "right", flexShrink: 0 }}>{schedDate(g.date)}</span>
    </div>
  );
}

function SportsScheduleView({ theme, sched, loading, error, onRefresh, fetchedAt }) {
  return (
    <React.Fragment>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconCalendar />} style={{ margin: 0 }}>Schedule &amp; scores</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>{fetchedAt ? `Updated ${relTimeFrom(new Date(fetchedAt).toISOString())}` : "Not loaded yet"}</span>
          <button onClick={onRefresh} disabled={loading} className="v-btn" style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.accent}`, background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        {error && <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft, lineHeight: 1.45 }}>{error}</div>}
      </Card>

      {SPORTS_TEAMS.map((t, i) => {
        const s = (sched || {})[t.id];
        return (
          <Card theme={theme} key={t.id} delay={40 * (i + 1)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: theme.text }}>{t.label}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: theme.chipText, background: theme.chip, padding: "2px 7px", borderRadius: "999px" }}>{t.league}</span>
            </div>
            {!s ? (
              <div style={{ fontSize: "12.5px", color: theme.textFaint }}>{loading ? "Loading schedule…" : "Nothing cached — hit Refresh on the live site."}</div>
            ) : (
              <React.Fragment>
                {s.next ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: theme.accentSoft, marginBottom: s.recent.length ? "10px" : 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", color: theme.accent, textTransform: "uppercase" }}>Next</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: theme.text, flex: 1, minWidth: 0 }}>{s.next.home ? "vs" : "@"} {s.next.opp}</span>
                    <span style={{ fontSize: "12px", color: theme.textMuted, textAlign: "right" }}>{schedDate(s.next.date, true)}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: theme.textFaint, marginBottom: s.recent.length ? "6px" : 0 }}>No upcoming game scheduled.</div>
                )}
                {s.recent.length > 0 && (
                  <div>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "2px" }}>Recent results</div>
                    {s.recent.map((g) => <GameLine key={g.id} theme={theme} g={g} />)}
                  </div>
                )}
              </React.Fragment>
            )}
          </Card>
        );
      })}
    </React.Fragment>
  );
}

// Feed thumbnail: renders nothing at all if the image is missing or fails,
// so the row degrades to the plain text layout instead of a broken icon.
// Ask the image CDN for roughly what we render (at 2x for retina) instead of
// pulling full editorial resolution. Staged fallback: sized -> original ->
// nothing, so the resize hint is never a hard dependency.
function sizedImageUrl(src, w, hgt) {
  if (!src) return null;
  try {
    const u = new URL(src, "https://x.invalid");
    if (!/espncdn\.com$/.test(u.hostname) && !/espncdn\.com$/.test(u.hostname.replace(/^.*?\./, ""))) return src;
    u.searchParams.set("w", String(w));
    u.searchParams.set("h", String(hgt));
    return u.toString();
  } catch (e) { return src; }
}

function FeedThumb({ theme, src, placeholder }) {
  const [stage, setStage] = useState(0); // 0 = resized, 1 = original, 2 = gone
  const sized = sizedImageUrl(src, 208, 130);
  if (placeholder || !src || stage > 1) {
    // Reserve the column so rows in a feed stay aligned when only some
    // articles ship a photo.
    return placeholder ? <span className="v-feedthumb" style={{ background: theme.chip, border: `1px solid ${theme.cardBorder}` }} /> : null;
  }
  return (
    <img
      src={stage === 0 ? sized : src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setStage((s) => s + 1)}
      className="v-feedthumb"
      style={{ objectFit: "cover", background: theme.chip, border: `1px solid ${theme.cardBorder}` }}
    />
  );
}

function SportsSection({ theme, state, setState }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("news");
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState(null);
  const cache = state.cache || {};

  async function refreshSchedule() {
    setSchedLoading(true);
    setSchedError(null);
    try {
      const prev = state.schedule || {};
      const results = await Promise.all(
        SPORTS_TEAMS.map((t) => fetchTeamSchedule(t).then((r) => [t.id, r]).catch(() => [t.id, null]))
      );
      const next = {};
      let anyOk = false;
      results.forEach(([id, r]) => { if (r) { next[id] = r; anyOk = true; } else if (prev[id]) next[id] = prev[id]; });
      if (!anyOk) setSchedError("Couldn't reach ESPN. On the live site this loads automatically; the preview/sandbox blocks outside requests.");
      setState((s) => ({ ...s, schedule: next, schedFetchedAt: Date.now() }));
    } catch (e) {
      setSchedError(e.message || "Couldn't load schedules.");
    } finally {
      setSchedLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        SPORTS_FEEDS.map((f) => fetchSportsFeed(f).then((items) => [f.id, items]).catch(() => [f.id, null]))
      );
      const next = {};
      let anyOk = false;
      results.forEach(([id, items]) => {
        if (items) { next[id] = items; anyOk = true; }
        else if (cache[id]) next[id] = cache[id];
      });
      if (!anyOk) setError("Couldn't reach ESPN. On the live site this loads automatically; the preview/sandbox blocks outside requests.");
      setState((s) => ({ ...s, cache: next, fetchedAt: Date.now() }));
    } catch (e) {
      setError(e.message || "Couldn't load sports news.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stale = !state.fetchedAt || Date.now() - state.fetchedAt > SPORTS_STALE_MS;
    if (Object.keys(cache).length === 0 || stale) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "schedule") return;
    const stale = !state.schedFetchedAt || Date.now() - state.schedFetchedAt > SPORTS_STALE_MS;
    if (!state.schedule || Object.keys(state.schedule).length === 0 || stale) refreshSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconTrophy />} style={{ margin: 0 }}>My teams &amp; leagues</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>
            {state.fetchedAt ? `Updated ${relTimeFrom(new Date(state.fetchedAt).toISOString())}` : "Not loaded yet"}
          </span>
          <button onClick={refresh} disabled={loading} className="v-btn" style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.accent}`, background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "10px", lineHeight: 1.4 }}>
          Celtics, Red Sox, Bruins, and Colts — plus the latest around the NBA, MLB, and NFL. Headlines from ESPN.
        </div>
        <Segmented theme={theme} value={view} onChange={setView} ariaLabel="Sports view" style={{ marginTop: "12px" }}
          options={[["news", "Headlines"], ["schedule", "Schedule & Scores"]]} />
        {error && (
          <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft, lineHeight: 1.45 }}>{error}</div>
        )}
      </Card>

      {view === "news" && SPORTS_FEEDS.map((feed, fi) => {
        const items = cache[feed.id] || [];
        return (
          <Card theme={theme} key={feed.id} delay={40 * (fi + 1)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: theme.text }}>{feed.label}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: theme.chipText, background: theme.chip, padding: "2px 7px", borderRadius: "999px" }}>{feed.league}</span>
              <span style={{ fontSize: "11px", color: theme.textFaint, marginLeft: "auto" }}>{items.length ? `${items.length} stories` : loading ? "loading…" : ""}</span>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: theme.textFaint }}>{loading ? "Fetching headlines…" : "Nothing cached — hit Refresh on the live site."}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((it, i) => (
                  <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "12px", alignItems: "flex-start", textDecoration: "none", padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}` }}>
                    {items.some((x) => x.image) && <FeedThumb theme={theme} src={it.image} placeholder={!it.image} />}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: theme.text, lineHeight: 1.4 }}>{it.headline}</span>
                      {it.description && <span style={{ display: "block", fontSize: "12.5px", color: theme.textMuted, marginTop: "3px", lineHeight: 1.4 }}>{truncateText(it.description, 160)}</span>}
                      <span style={{ display: "block", fontSize: "11.5px", color: theme.textFaint, marginTop: "4px" }}>{it.published ? relTimeFrom(it.published) : ""}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      {view === "schedule" && (
        <SportsScheduleView theme={theme} sched={state.schedule || {}} loading={schedLoading} error={schedError} onRefresh={refreshSchedule} fetchedAt={state.schedFetchedAt} />
      )}
    </div>
  );
}

function truncateText(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/* ----------------------------------------------------------------------
   SUBSCRIPTIONS — recurring costs with monthly/yearly totals
---------------------------------------------------------------------- */
const SUB_CYCLES = [
  { id: "monthly", label: "Monthly", per: 1 },
  { id: "yearly", label: "Yearly", per: 1 / 12 },
  { id: "weekly", label: "Weekly", per: 52 / 12 },
  { id: "quarterly", label: "Quarterly", per: 1 / 3 },
];
const DEFAULT_SUBSCRIPTIONS = [];
function subPerMonth(s) {
  const c = SUB_CYCLES.find((x) => x.id === s.cycle) || SUB_CYCLES[0];
  return (Number(s.cost) || 0) * c.per;
}
function fmtMoney(n) {
  return "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function subDaysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today.getTime()) / 86400000);
}

/* ----------------------------------------------------------------------
   HABITS — daily check-off grid with streaks (fully local)
---------------------------------------------------------------------- */
const DEFAULT_HABITS = { items: [], done: {} };
const HABIT_SUGGESTIONS = [
  "Drink more water", "10-minute walk", "Stretch before bed", "Read 10 pages",
  "Meditate 5 minutes", "No phone after 10pm", "Cook one meal at home", "Floss",
  "Gym", "Journal",
];

function IconFlame({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3 4 4.6 4 8a4 4 0 0 1-8 0c0-1 .3-1.9.8-2.6C9 10 9.6 11 10.6 11 10 9 11 5 12 3z" />
      <path d="M8.6 14.2a3.4 3.4 0 0 0 6.8 0c0-1.5-.9-2.5-1.6-3.2" />
    </svg>
  );
}

function habitDayKey(dt) {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function habitLastDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}
function habitStreak(doneMap) {
  if (!doneMap) return 0;
  let streak = 0;
  const d = new Date();
  if (!doneMap[habitDayKey(d)]) d.setDate(d.getDate() - 1); // grace: today not checked yet
  while (doneMap[habitDayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function habitBestStreak(doneMap) {
  const keys = Object.keys(doneMap || {}).filter((k) => doneMap[k]).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    if (prev) {
      const gap = (new Date(k) - new Date(prev)) / 86400000;
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

function habitHeatmapCells(items, done, weeks) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const totalDays = weeks * 7;
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1));
  const pad = start.getDay();
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > today) break;
    const key = habitDayKey(d);
    const doneCount = items.reduce((n, h) => n + ((done[h.id] && done[h.id][key]) ? 1 : 0), 0);
    cells.push({ date: d, key, ratio: items.length ? doneCount / items.length : 0, doneCount, total: items.length });
  }
  return cells;
}
function HabitHeatmap({ theme, items, done }) {
  const weeks = 17;
  const cells = useMemo(() => habitHeatmapCells(items, done || {}, weeks), [items, done]);
  if (!items.length) return null;
  return (
    <Card theme={theme} delay={40}>
      <SectionLabel theme={theme} icon={<IconFlame size={14} />}>Last {weeks} weeks</SectionLabel>
      <div className="v-scroll" style={{ overflowX: "auto", paddingBottom: "4px" }}>
        <div style={{ display: "grid", gridTemplateRows: "repeat(7, 13px)", gridAutoFlow: "column", gridAutoColumns: "13px", gap: "3px", width: "max-content" }}>
          {cells.map((c, i) =>
            c ? (
              <div
                key={c.key}
                title={`${c.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — ${c.doneCount}/${c.total} done`}
                style={{
                  width: "13px", height: "13px", borderRadius: "3px",
                  background: c.ratio === 0 ? theme.chip : theme.accent,
                  opacity: c.ratio === 0 ? 1 : 0.22 + c.ratio * 0.78,
                }}
              />
            ) : (
              <div key={"pad" + i} style={{ width: "13px", height: "13px" }} />
            )
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "11px", color: theme.textFaint }}>
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <span key={r} style={{ width: "11px", height: "11px", borderRadius: "3px", background: r === 0 ? theme.chip : theme.accent, opacity: r === 0 ? 1 : 0.22 + r * 0.78, display: "inline-block" }} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}

function HabitsSection({ theme, state, setState }) {
  const s = state && state.items ? state : DEFAULT_HABITS;
  const [name, setName] = useState("");
  const todayKey = habitDayKey(new Date());
  const days = useMemo(() => habitLastDays(14), []);

  function addHabit(label) {
    const n = (label != null ? label : name).trim();
    if (!n) { toast.info("Name the habit first."); focusField("habit-name"); return; }
    if ((s.items || []).some((h) => h.name.toLowerCase() === n.toLowerCase())) {
      // Silently clearing the box read as "it worked" — it did not.
      toast.info("“" + n + "” is already on the list.");
      setName("");
      return;
    }
    setState((prev) => {
      const p = prev && prev.items ? prev : DEFAULT_HABITS;
      return { ...p, items: [...p.items, { id: "hab" + Date.now() + Math.round(performance.now()), name: n }] };
    });
    setName("");
  }
  function removeHabit(id) {
    const removedItem = (s.items || []).find((h) => h.id === id);
    const removedDone = (s.done || {})[id];
    setState((prev) => {
      const p = prev && prev.items ? prev : DEFAULT_HABITS;
      const done = { ...p.done }; delete done[id];
      return { ...p, items: p.items.filter((h) => h.id !== id), done };
    });
    if (removedItem) {
      toast.show({
        message: `Deleted "${removedItem.name}".`,
        action: {
          label: "Undo",
          onClick: () => setState((prev) => {
            const p = prev && prev.items ? prev : DEFAULT_HABITS;
            return { ...p, items: [...p.items, removedItem], done: removedDone ? { ...p.done, [id]: removedDone } : p.done };
          }),
        },
      });
    }
  }
  function toggle(id, key) {
    setState((prev) => {
      const p = prev && prev.items ? prev : DEFAULT_HABITS;
      const hd = { ...(p.done[id] || {}) };
      if (hd[key]) delete hd[key]; else hd[key] = 1;
      return { ...p, done: { ...p.done, [id]: hd } };
    });
  }

  const items = s.items || [];
  const doneToday = items.filter((h) => s.done[h.id] && s.done[h.id][todayKey]).length;
  const inputStyle = { padding: "8px 10px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme} icon={<IconFlame />}>Habits</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span className="v-tabular" style={{ fontSize: "30px", fontWeight: 800, color: theme.text }}>{doneToday}/{items.length || 0}</span>
          <span style={{ fontSize: "13px", color: theme.textMuted }}>done today</span>
          {items.length > 0 && doneToday === items.length && (
            <span style={{ fontSize: "13px", color: theme.positive, fontWeight: 700, marginLeft: "auto" }}>All done — nice! 🔥</span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <input
            id="v-field-habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addHabit(); }}
            placeholder="New habit (e.g. Gym)"
            className="v-input"
            style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
          />
          <button onClick={() => addHabit()} className="v-btn" style={{ padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
        </div>
        {(() => {
          const remaining = HABIT_SUGGESTIONS.filter((sug) => !items.some((h) => h.name.toLowerCase() === sug.toLowerCase()));
          return remaining.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
              {remaining.map((sug) => (
                <button key={sug} onClick={() => addHabit(sug)} className="v-btn" style={{ padding: "5px 11px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, border: `1px solid ${theme.cardBorder}`, background: theme.chip, color: theme.chipText }}>+ {sug}</button>
              ))}
            </div>
          );
        })()}
      </Card>

      <HabitHeatmap theme={theme} items={items} done={s.done} />

      {items.length === 0 ? (
        <Card theme={theme} delay={80}>
          <EmptyState theme={theme} art="habits" title="No habits yet" message="Add one above, or tap a suggestion, and start your first streak." />
        </Card>
      ) : (
        <Card theme={theme} delay={80}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {items.map((h) => {
              const dmap = s.done[h.id] || {};
              const streak = habitStreak(dmap);
              const best = habitBestStreak(dmap);
              const doneTodayH = !!dmap[todayKey];
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{h.name}</div>
                    <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: streak > 0 ? theme.accent : theme.textFaint, fontWeight: 700 }}>{streak > 0 ? `${streak}-day streak 🔥` : "no streak yet"}</span>
                      {best > 0 && <span>· best {best}</span>}
                    </div>
                  </div>
                  <div className="v-habitgrid" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    {days.map((d) => {
                      const key = habitDayKey(d);
                      const on = !!dmap[key];
                      const isToday = key === todayKey;
                      return (
                        <button
                          key={key}
                          onClick={() => toggle(h.id, key)}
                          className="v-btn v-btn--tight v-habitcell"
                          aria-pressed={on}
                          title={d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + (on ? " · done" : "")}
                          aria-label={d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) + (on ? " — done" : " — not done")}
                          style={{
                            borderRadius: "5px", padding: 0, flexShrink: 0,
                            border: isToday ? `1.5px solid ${theme.accent}` : `1px solid ${theme.cardBorder}`,
                            background: on ? theme.accent : "transparent",
                          }}
                        />
                      );
                    })}
                  </div>
                  <button
                    onClick={() => toggle(h.id, todayKey)}
                    className="v-btn"
                    style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, flexShrink: 0, border: `1px solid ${doneTodayH ? "transparent" : theme.cardBorder}`, background: doneTodayH ? theme.accentSoft : "transparent", color: doneTodayH ? theme.accent : theme.textMuted }}
                  >
                    {doneTodayH ? "✓ Today" : "Mark today"}
                  </button>
                  <button onClick={() => removeHabit(h.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "11px", color: theme.textFaint, marginTop: "10px", textAlign: "right" }}>Tap any square to toggle · today is on the right</div>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   READING — book log with Open Library search (CORS-friendly, no key)
---------------------------------------------------------------------- */
const DEFAULT_READING = { books: [], goal: 12 };
const READING_SHELVES = [
  { id: "reading", label: "Reading" },
  { id: "finished", label: "Finished" },
  { id: "want", label: "Want to read" },
];

function IconBook({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z" />
      <path d="M4 4.5A2.5 2.5 0 0 0 6.5 7H20" />
    </svg>
  );
}

function bookCoverUrl(coverId, size) {
  // default=false: without it the CDN answers 200 with a blank 1x1 GIF for a
  // missing cover, so <img> never errors and the initials fallback never runs.
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size || "M"}.jpg?default=false` : null;
}
async function searchBooks(q) {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`);
  if (!r.ok) throw new Error("Search failed (" + r.status + ")");
  const d = await r.json();
  return (d.docs || []).map((doc) => ({
    key: doc.key,
    title: doc.title || "Untitled",
    author: (doc.author_name && doc.author_name[0]) || "",
    year: doc.first_publish_year || "",
    pages: doc.number_of_pages_median || "",
    coverId: doc.cover_i || null,
  }));
}

function BookStars({ theme, value, onChange }) {
  return (
    <span role="group" aria-label="Rating" style={{ display: "inline-flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n === value ? 0 : n)} className="v-btn v-btn--tight v-star" title={`${n} star${n > 1 ? "s" : ""}`} aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`} aria-pressed={n <= value} style={{ border: "none", background: "transparent", padding: "0 1px", cursor: "pointer", color: n <= value ? theme.accent : theme.textFaint, fontSize: "15px", lineHeight: 1 }}>
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

function BookCover({ theme, url, w = 44, title = "", full = false }) {
  const [broke, setBroke] = useState(false);
  const box = {
    width: full ? "100%" : w + "px",
    aspectRatio: "2 / 3",
    borderRadius: "8px",
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: "var(--sh-2)",
    flexShrink: 0,
    overflow: "hidden",
  };
  if (!url || broke) {
    // No cover art: fall back to the title's initials on a tinted spine so the
    // shelf still reads as a shelf instead of a row of grey rectangles.
    const initials = String(title || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w2) => w2[0]).join("").toUpperCase();
    return (
      <div style={{ ...box, background: theme.chip, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, fontWeight: 800, fontSize: full ? "22px" : "13px", letterSpacing: "0.02em" }}>
        {initials || <IconBook size={16} />}
      </div>
    );
  }
  return <img src={url} alt="" loading="lazy" onError={() => setBroke(true)} style={{ ...box, objectFit: "cover", display: "block" }} />;
}

const READING_SUGGESTIONS = [
  { title: "Project Hail Mary", author: "Andy Weir" },
  { title: "Atomic Habits", author: "James Clear" },
  { title: "The Song of Achilles", author: "Madeline Miller" },
  { title: "Educated", author: "Tara Westover" },
  { title: "Dune", author: "Frank Herbert" },
  { title: "Sapiens", author: "Yuval Noah Harari" },
  { title: "The Martian", author: "Andy Weir" },
  { title: "Where the Crawdads Sing", author: "Delia Owens" },
];

function ReadingSection({ theme, state, setState }) {
  const s = state && state.books ? state : DEFAULT_READING;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState(null);
  const [filter, setFilter] = useState("all");
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");

  const thisYear = new Date().getFullYear();
  const books = s.books || [];
  const finishedThisYear = books.filter((b) => b.status === "finished" && b.finishedAt && new Date(b.finishedAt).getFullYear() === thisYear).length;
  const counts = {
    reading: books.filter((b) => b.status === "reading").length,
    finished: books.filter((b) => b.status === "finished").length,
    want: books.filter((b) => b.status === "want").length,
  };

  function addBook(book, status) {
    const exists = books.some((b) => b.title === book.title && b.author === book.author);
    if (exists) return;
    const entry = {
      id: "bk" + Date.now() + Math.round(performance.now()),
      title: book.title, author: book.author || "", year: book.year || "", pages: book.pages || "",
      coverId: book.coverId || null, status, rating: 0,
      addedAt: new Date().toISOString(),
      finishedAt: status === "finished" ? new Date().toISOString() : null,
    };
    setState((prev) => ({ ...(prev && prev.books ? prev : DEFAULT_READING), books: [entry, ...(prev && prev.books ? prev.books : [])] }));
  }
  function updateBook(id, patch) {
    setState((prev) => {
      const p = prev && prev.books ? prev : DEFAULT_READING;
      return { ...p, books: p.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) };
    });
  }
  function setStatus(id, status) {
    updateBook(id, { status, finishedAt: status === "finished" ? (books.find((b) => b.id === id) || {}).finishedAt || new Date().toISOString() : null });
  }
  function removeBook(id) {
    const removed = (books || []).find((b) => b.id === id);
    setState((prev) => { const p = prev && prev.books ? prev : DEFAULT_READING; return { ...p, books: p.books.filter((b) => b.id !== id) }; });
    if (removed) toastUndo(`"${removed.title || "book"}"`, () =>
      setState((prev) => { const p = prev && prev.books ? prev : DEFAULT_READING; return { ...p, books: [...p.books, removed] }; }));
  }
  function addManual() {
    const t = manualTitle.trim();
    if (!t) { toast.info("Give the book a title first."); focusField("book-title"); return; }
    addBook({ title: t, author: manualAuthor.trim() }, "want");
    setManualTitle(""); setManualAuthor("");
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true); setSearchErr(null);
    try {
      const res = await searchBooks(q);
      setResults(res);
      if (res.length === 0) setSearchErr("No matches. You can add it manually below.");
    } catch (e) {
      setSearchErr("Couldn't reach Open Library (the preview/sandbox blocks outside requests — this works on the live site). Add the book manually below.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const shown = filter === "all" ? books : books.filter((b) => b.status === filter);
  const goalPct = s.goal ? Math.min(100, Math.round((finishedThisYear / s.goal) * 100)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme} icon={<IconBook />}>Reading</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span className="v-tabular" style={{ fontSize: "30px", fontWeight: 800, color: theme.text }}>{finishedThisYear}</span>
          <span style={{ fontSize: "13px", color: theme.textMuted }}>of</span>
          <input value={s.goal} onChange={(e) => setState((prev) => ({ ...(prev && prev.books ? prev : DEFAULT_READING), goal: Math.max(0, parseInt(e.target.value, 10) || 0) }))} inputMode="numeric" className="v-input" style={{ ...inputStyle, width: "58px", padding: "4px 8px", fontSize: "15px", fontWeight: 700 }} />
          <span style={{ fontSize: "13px", color: theme.textMuted }}>books in {thisYear}</span>
          <span style={{ fontSize: "12.5px", color: theme.textFaint, marginLeft: "auto" }}>{counts.reading} reading · {counts.finished} finished · {counts.want} to read</span>
        </div>
        <div style={{ height: "8px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
          <div style={{ width: goalPct + "%", height: "100%", background: theme.progressFill }} />
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder="Search a book by title or author…" className="v-input" style={{ ...inputStyle, flex: 1, minWidth: "180px" }} />
          <button onClick={runSearch} disabled={searching} className="v-btn" style={{ padding: "9px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, opacity: searching ? 0.6 : 1 }}>{searching ? "Searching…" : "Search"}</button>
        </div>
        {searchErr && <div style={{ marginTop: "10px", fontSize: "12.5px", color: theme.textMuted, background: theme.accentSoft, borderRadius: "9px", padding: "9px 12px", lineHeight: 1.45 }}>{searchErr}</div>}

        {results && results.length > 0 && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {results.map((r) => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px" }}>
                <BookCover theme={theme} url={bookCoverUrl(r.coverId)} title={r.title} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text }}>{r.title}</div>
                  <div style={{ fontSize: "12px", color: theme.textFaint }}>{[r.author, r.year].filter(Boolean).join(" · ")}</div>
                </div>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  <button onClick={() => addBook(r, "want")} className="v-btn" title="Add to Want to read" style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}>Want</button>
                  <button onClick={() => addBook(r, "reading")} className="v-btn" title="Add to Reading" style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Reading</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <input id="v-field-book-title" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="…or add manually — title" className="v-input" style={{ ...inputStyle, flex: 1, minWidth: "140px" }} />
          <input value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} placeholder="author (optional)" className="v-input" style={{ ...inputStyle, flex: 1, minWidth: "120px" }} />
          <button onClick={addManual} className="v-btn" style={{ padding: "9px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}>Add</button>
        </div>

        {(() => {
          const remaining = READING_SUGGESTIONS.filter((sug) => !books.some((b) => b.title.toLowerCase() === sug.title.toLowerCase()));
          return remaining.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "8px" }}>
                Suggested for you
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {remaining.slice(0, 8).map((sug) => (
                  <button
                    key={sug.title}
                    onClick={() => addBook(sug, "want")}
                    className="v-btn"
                    title={`Add "${sug.title}" to Want to read`}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: theme.text, background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "6px 12px 6px 10px" }}
                  >
                    <span style={{ color: theme.accent }}>+</span>
                    {sug.title}
                    <span style={{ color: theme.textFaint, fontWeight: 500 }}>{sug.author}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </Card>

      <Card theme={theme} delay={80}>
        <Segmented theme={theme} value={filter} onChange={setFilter} ariaLabel="Shelf"
          options={[{ id: "all", label: "All" }, ...READING_SHELVES]} style={{ marginBottom: "12px" }} />
        {shown.length === 0 ? (
          <EmptyState
            theme={theme}
            art="books"
            title={books.length === 0 ? "No books yet" : "Nothing on this shelf"}
            message={books.length === 0 ? "Search above to start building your shelf." : "Try another shelf, or add a book above."}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {shown.map((bk) => (
              <div key={bk.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", flexWrap: "wrap" }}>
                <BookCover theme={theme} url={bookCoverUrl(bk.coverId)} title={bk.title} w={48} />
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{bk.title}</div>
                  <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "1px" }}>{[bk.author, bk.year].filter(Boolean).join(" · ")}</div>
                  {bk.status === "finished" && <div style={{ marginTop: "4px" }}><BookStars theme={theme} value={bk.rating || 0} onChange={(v) => updateBook(bk.id, { rating: v })} /></div>}
                </div>
                <select value={bk.status} onChange={(e) => setStatus(bk.id, e.target.value)} className="v-input" style={{ ...inputStyle, padding: "6px 8px", flexShrink: 0 }}>
                  {READING_SHELVES.map((sh) => <option key={sh.id} value={sh.id}>{sh.label}</option>)}
                </select>
                <button onClick={() => removeBook(bk.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   GAMES — backlog / playing / beaten tracker (fully local)
---------------------------------------------------------------------- */
const DEFAULT_GAMES = { games: [] };
const GAME_STATUSES = [
  { id: "backlog", label: "Backlog" },
  { id: "playing", label: "Playing" },
  { id: "beaten", label: "Beaten" },
  { id: "dropped", label: "Dropped" },
];
const GAME_PLATFORMS = ["PC", "PS5", "PS4", "Xbox", "Switch", "Mobile"];

function IconGamepad({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <rect x="2" y="6" width="20" height="12" rx="4" />
    </svg>
  );
}

function GameTile({ theme, title, platform }) {
  const t = String(title || "");
  const initials = t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  let hue = 0;
  for (let i = 0; i < t.length; i++) hue = (hue * 31 + t.charCodeAt(i)) % 360;
  return (
    <div
      aria-hidden="true"
      title={platform}
      style={{
        width: "42px", aspectRatio: "3 / 4", borderRadius: "8px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 800, letterSpacing: "0.02em",
        color: theme.chipText,
        background: `linear-gradient(150deg, hsl(${hue} 58% 52% / 0.28), hsl(${(hue + 40) % 360} 58% 42% / 0.18))`,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: "var(--sh-1)",
      }}
    >
      {initials}
    </div>
  );
}

const GAME_SUGGESTIONS = [
  { title: "The Legend of Zelda: Tears of the Kingdom", platform: "Switch" },
  { title: "Baldur's Gate 3", platform: "PC" },
  { title: "Elden Ring", platform: "PS5" },
  { title: "God of War Ragnarök", platform: "PS5" },
  { title: "Hades", platform: "Switch" },
  { title: "Red Dead Redemption 2", platform: "PC" },
  { title: "Hollow Knight", platform: "PC" },
  { title: "Stardew Valley", platform: "PC" },
];

function GamesSection({ theme, state, setState }) {
  const s = state && state.games ? state : DEFAULT_GAMES;
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("PC");
  const [status, setStatus] = useState("backlog");
  const [filter, setFilter] = useState("all");

  const games = s.games || [];
  const counts = {};
  GAME_STATUSES.forEach((st) => (counts[st.id] = games.filter((g) => g.status === st.id).length));
  const totalHours = games.reduce((a, g) => a + (Number(g.hours) || 0), 0);

  function addGame() {
    const t = title.trim();
    if (!t) { toast.info("Give the game a title first."); focusField("game-title"); return; }
    const entry = { id: "gm" + Date.now() + Math.round(performance.now()), title: t, platform, status, rating: 0, hours: "", addedAt: new Date().toISOString() };
    setState((prev) => ({ ...(prev && prev.games ? prev : DEFAULT_GAMES), games: [entry, ...(prev && prev.games ? prev.games : [])] }));
    setTitle("");
  }
  function addGameQuick(t, pf) {
    const entry = { id: "gm" + Date.now() + Math.round(performance.now()), title: t, platform: pf || "PC", status: "backlog", rating: 0, hours: "", addedAt: new Date().toISOString() };
    setState((prev) => ({ ...(prev && prev.games ? prev : DEFAULT_GAMES), games: [entry, ...(prev && prev.games ? prev.games : [])] }));
  }
  function updateGame(id, patch) {
    setState((prev) => { const p = prev && prev.games ? prev : DEFAULT_GAMES; return { ...p, games: p.games.map((g) => (g.id === id ? { ...g, ...patch } : g)) }; });
  }
  function removeGame(id) {
    const removed = (games || []).find((g) => g.id === id);
    setState((prev) => { const p = prev && prev.games ? prev : DEFAULT_GAMES; return { ...p, games: p.games.filter((g) => g.id !== id) }; });
    if (removed) toastUndo(`"${removed.title || "game"}"`, () =>
      setState((prev) => { const p = prev && prev.games ? prev : DEFAULT_GAMES; return { ...p, games: [...p.games, removed] }; }));
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const shown = filter === "all" ? games : games.filter((g) => g.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme} icon={<IconGamepad />}>Games</SectionLabel>
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "6px" }}>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Backlog</div><div className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{counts.backlog}</div></div>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Playing</div><div className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{counts.playing}</div></div>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Beaten</div><div className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{counts.beaten}</div></div>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Hours</div><div className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{totalHours}</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginTop: "12px" }}>
          <input id="v-field-game-title" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addGame(); }} placeholder="Game title" className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }} />
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="v-input" style={inputStyle}>
            {GAME_PLATFORMS.map((pf) => <option key={pf} value={pf}>{pf}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="v-input" style={inputStyle}>
            {GAME_STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
          </select>
          <button onClick={addGame} className="v-btn" style={{ padding: "9px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
        </div>

        {(() => {
          const remaining = GAME_SUGGESTIONS.filter((sug) => !games.some((g) => g.title.toLowerCase() === sug.title.toLowerCase()));
          return remaining.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "8px" }}>
                Suggested for you
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {remaining.slice(0, 8).map((sug) => (
                  <button
                    key={sug.title}
                    onClick={() => addGameQuick(sug.title, sug.platform)}
                    className="v-btn"
                    title={`Add "${sug.title}" to your backlog`}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: theme.text, background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "6px 12px 6px 10px" }}
                  >
                    <span style={{ color: theme.accent }}>+</span>
                    {sug.title}
                    <span style={{ color: theme.textFaint, fontWeight: 500 }}>{sug.platform}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </Card>

      <Card theme={theme} delay={80}>
        <Segmented theme={theme} value={filter} onChange={setFilter} ariaLabel="Status"
          options={[{ id: "all", label: "All" }, ...GAME_STATUSES]} style={{ marginBottom: "12px" }} />
        {shown.length === 0 ? (
          <EmptyState
            theme={theme}
            art="games"
            title={games.length === 0 ? "No games yet" : "Nothing on this shelf"}
            message={games.length === 0 ? "Add one above to start your backlog." : "Try another shelf, or add a game above."}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {shown.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", flexWrap: "wrap" }}>
                <GameTile theme={theme} title={g.title} platform={g.platform} />
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{g.title}</div>
                  <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "1px" }}>{g.platform}</div>
                  {g.status === "beaten" && <div style={{ marginTop: "4px" }}><BookStars theme={theme} value={g.rating || 0} onChange={(v) => updateGame(g.id, { rating: v })} /></div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                  <input value={g.hours} onChange={(e) => updateGame(g.id, { hours: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") })} inputMode="decimal" placeholder="0" title="Hours played" className="v-input" style={{ ...inputStyle, width: "52px", padding: "6px 8px", textAlign: "center" }} />
                  <span style={{ fontSize: "11px", color: theme.textFaint }}>hrs</span>
                </div>
                <select value={g.status} onChange={(e) => updateGame(g.id, { status: e.target.value })} className="v-input" style={{ ...inputStyle, padding: "6px 8px", flexShrink: 0 }}>
                  {GAME_STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                </select>
                <button onClick={() => removeGame(g.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   BIRTHDAYS & GIFTS — people, dates, and running gift-idea lists (local)
---------------------------------------------------------------------- */
const DEFAULT_BIRTHDAYS = { people: [] };

function IconGift({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M12 8S10.8 3.5 8.4 4.3 9.3 8 12 8zM12 8s1.2-4.5 3.6-3.7S14.7 8 12 8z" />
    </svg>
  );
}

function nextBirthday(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-").map(Number);
  let mo, day, year = null;
  if (parts.length === 3) { year = parts[0]; mo = parts[1]; day = parts[2]; }
  else if (parts.length === 2) { mo = parts[0]; day = parts[1]; }
  else return null;
  if (!mo || !day) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), mo - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, mo - 1, day);
  const days = Math.round((next - today) / 86400000);
  const turning = year ? next.getFullYear() - year : null;
  return { days, next, turning, mo, day };
}

function BirthdaysSection({ theme, state, setState }) {
  const s = state && state.people ? state : DEFAULT_BIRTHDAYS;
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [relationship, setRelationship] = useState("");
  const [giftDraft, setGiftDraft] = useState({});

  const people = s.people || [];
  const withNext = people.map((p) => ({ p, nb: nextBirthday(p.date) }))
    .sort((a, b) => (a.nb ? a.nb.days : 9999) - (b.nb ? b.nb.days : 9999));
  const upcoming = withNext.filter((x) => x.nb && x.nb.days <= 30);

  function addPerson() {
    const n = name.trim();
    if (!n) { toast.info("Add a name first."); return; }
    if (!date) { toast.info("Pick a birthday date — that's what the countdown needs."); return; }
    setState((prev) => ({ ...(prev && prev.people ? prev : DEFAULT_BIRTHDAYS), people: [...(prev && prev.people ? prev.people : []), { id: "bd" + Date.now(), name: n, date, relationship: relationship.trim(), gifts: [] }] }));
    setName(""); setDate(""); setRelationship("");
  }
  function removePerson(id) {
    const removed = (people || []).find((x) => x.id === id);
    setState((prev) => { const p = prev && prev.people ? prev : DEFAULT_BIRTHDAYS; return { ...p, people: p.people.filter((x) => x.id !== id) }; });
    if (removed) toastUndo(`"${removed.name || "person"}" and their gift list`, () =>
      setState((prev) => { const p = prev && prev.people ? prev : DEFAULT_BIRTHDAYS; return { ...p, people: [...p.people, removed] }; }));
  }
  function updatePerson(id, patch) { setState((prev) => { const p = prev && prev.people ? prev : DEFAULT_BIRTHDAYS; return { ...p, people: p.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) }; }); }
  function addGift(id) {
    const text = (giftDraft[id] || "").trim();
    if (!text) return;
    const person = people.find((x) => x.id === id);
    updatePerson(id, { gifts: [...(person.gifts || []), { id: "g" + Date.now(), text, done: false }] });
    setGiftDraft((d) => ({ ...d, [id]: "" }));
  }
  function toggleGift(pid, gid) { const person = people.find((x) => x.id === pid); updatePerson(pid, { gifts: (person.gifts || []).map((g) => (g.id === gid ? { ...g, done: !g.done } : g)) }); }
  function removeGift(pid, gid) { const person = people.find((x) => x.id === pid); updatePerson(pid, { gifts: (person.gifts || []).filter((g) => g.id !== gid) }); }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const prettyDate = (nb) => nb ? nb.next.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
  const dayLabel = (d) => d === 0 ? "today! 🎉" : d === 1 ? "tomorrow" : `in ${d} days`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme} icon={<IconGift />}>Birthdays &amp; Gifts</SectionLabel>
        {upcoming.length > 0 && (
          <div style={{ marginBottom: "12px", padding: "11px 13px", borderRadius: "10px", background: theme.accentSoft }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.accent, marginBottom: "5px" }}>Coming up (next 30 days)</div>
            {upcoming.map(({ p, nb }) => (
              <div key={p.id} style={{ fontSize: "13px", color: theme.text, padding: "2px 0" }}>
                <strong>{p.name}</strong> — {prettyDate(nb)} · {dayLabel(nb.days)}{nb.turning ? ` · turning ${nb.turning}` : ""}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} title="Birthday (include year for age)" className="v-input" style={inputStyle} />
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Relationship" className="v-input" style={inputStyle} />
          <button onClick={addPerson} className="v-btn" style={{ padding: "9px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
        </div>
      </Card>

      {withNext.length === 0 ? (
        <Card theme={theme} delay={80}><EmptyState theme={theme} art="gift" title="No birthdays yet" message="Add someone above so you never forget." /></Card>
      ) : (
        withNext.map(({ p, nb }, i) => (
          <Card theme={theme} key={p.id} delay={40 * (i + 1)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: theme.text }}>{p.name}</div>
                <div style={{ fontSize: "12.5px", color: theme.textMuted, marginTop: "2px" }}>
                  {p.relationship ? p.relationship + " · " : ""}{prettyDate(nb)}{nb ? ` · ${dayLabel(nb.days)}` : ""}{nb && nb.turning ? ` · turning ${nb.turning}` : ""}
                </div>
              </div>
              <button onClick={() => removePerson(p.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex" }}><IconClose /></button>
            </div>
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "6px" }}>Gift ideas</div>
              {(p.gifts || []).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                  {(p.gifts || []).map((g) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => toggleGift(p.id, g.id)} className="v-btn v-btn--tight v-iconbtn" role="checkbox" aria-checked={!!g.done} aria-label={(g.done ? "Mark not bought: " : "Mark bought: ") + g.text} style={{ width: "20px", height: "20px", flexShrink: 0, borderRadius: "5px", border: `1px solid ${g.done ? "transparent" : theme.cardBorder}`, background: g.done ? theme.accent : "transparent", color: theme.accentText, fontSize: "11px", lineHeight: 1, padding: 0 }}>{g.done ? "✓" : ""}</button>
                      <span style={{ flex: 1, fontSize: "13px", color: g.done ? theme.textFaint : theme.text, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                      <button onClick={() => removeGift(p.id, g.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "2px", display: "inline-flex" }}><IconClose /></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={giftDraft[p.id] || ""} onChange={(e) => setGiftDraft((d) => ({ ...d, [p.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") addGift(p.id); }} placeholder="Add a gift idea…" className="v-input" style={{ ...inputStyle, flex: 1, padding: "7px 10px" }} />
                <button onClick={() => addGift(p.id)} className="v-btn" style={{ padding: "7px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}>Add</button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   MOVIES — entertainment news (releases, casting, filming, cancellations)

   Uses Google News RSS through rss2json.com (see the unified headline
   engine below for why), the same cache-and-degrade approach as the
   News/Sports tabs. Live fetches only work on the deployed site; the
   sandbox/preview blocks outbound requests.
---------------------------------------------------------------------- */
const MOVIE_TOPICS = [
  { id: "releases", label: "Releases & dates", q: "movie release date 2026" },
  { id: "casting", label: "Casting", q: "movie casting announced" },
  { id: "production", label: "Filming & production", q: "movie filming production set" },
  { id: "trailers", label: "Trailers & announcements", q: "movie trailer announcement" },
  { id: "boxoffice", label: "Box office", q: "box office weekend" },
  { id: "tv", label: "TV & streaming", q: "TV series streaming premiere" },
  { id: "renewals", label: "Renewed / canceled", q: "TV show renewed canceled" },
];
const MOVIE_STALE_MS = 30 * 60 * 1000;

function IconClapper({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5h18V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z" />
      <path d="M3 8.5l2.5-4 3 2 3-2 3 2 3-2 2.5 2v2z" />
      <path d="M5.5 4.5l3 2M11.5 4.5l3 2M17.5 4.5l3 2" />
    </svg>
  );
}

function movieRelTime(str) {
  try {
    const then = new Date(str).getTime();
    if (isNaN(then)) return "";
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch (e) { return ""; }
}

async function fetchMovieNews(topic) {
  const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(topic.q)}&hl=en-US&gl=US&ceid=US:en`;
  return fetchFeedItems(rss, 16);
}

function MoviesSection({ theme, state, setState }) {
  const [topic, setTopic] = useState(MOVIE_TOPICS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = state.cache || {};
  const fetchedAt = state.fetchedAt || {};

  async function refresh(topicId) {
    const t = MOVIE_TOPICS.find((x) => x.id === topicId) || MOVIE_TOPICS[0];
    setLoading(true); setError(null);
    try {
      const items = await fetchMovieNews(t);
      setState((s) => ({ ...s, cache: { ...(s.cache || {}), [t.id]: items }, fetchedAt: { ...(s.fetchedAt || {}), [t.id]: Date.now() } }));
    } catch (e) {
      if (!(cache[t.id] && cache[t.id].length)) setError("Couldn't load headlines. On the live site this pulls from Google News automatically; the preview/sandbox blocks outside requests.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const stale = !fetchedAt[topic] || Date.now() - fetchedAt[topic] > MOVIE_STALE_MS;
    if (!(cache[topic] && cache[topic].length) || stale) refresh(topic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const items = cache[topic] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconClapper />} style={{ margin: 0 }}>Movies &amp; TV news</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>{fetchedAt[topic] ? `Updated ${movieRelTime(new Date(fetchedAt[topic]).toISOString())}` : "Not loaded yet"}</span>
          <button onClick={() => refresh(topic)} disabled={loading} className="v-btn" style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.accent}`, background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
          {MOVIE_TOPICS.map((t) => (
            <button key={t.id} onClick={() => setTopic(t.id)} className="v-btn" style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: `1px solid ${topic === t.id ? theme.accent : theme.cardBorder}`, background: topic === t.id ? theme.accentSoft : "transparent", color: topic === t.id ? theme.accent : theme.textMuted }}>{t.label}</button>
          ))}
        </div>
        {error && <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft, lineHeight: 1.45 }}>{error}</div>}
      </Card>

      <Card theme={theme} delay={80}>
        {items.length === 0 ? (
          <div style={{ fontSize: "12.5px", color: theme.textFaint, textAlign: "center", padding: "16px" }}>{loading ? "Fetching headlines…" : "Nothing cached — hit Refresh on the live site."}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((it, i) => (
              <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}` }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text, lineHeight: 1.4 }}>{it.title}</div>
                <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "4px" }}>{[it.source, movieRelTime(it.pub)].filter(Boolean).join(" · ")}</div>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Unified headline engine.

   One fetcher, one parser, one renderer for every news category in the app
   (world, US, business, tech, security, movies, TV, gaming, sports).

   Google News RSS covers every topic without an API key, but it is not
   CORS-enabled, so it goes through rss2json.com — a free RSS-to-JSON
   service built for exactly this browser use case (it sends real CORS
   headers itself), rather than a generic CORS-proxy-any-URL service. This
   replaced a 4-proxy fallback chain (allorigins, codetabs, corsproxy.io)
   that had stopped working entirely: three of the four proxies were
   unreachable, and the fourth (corsproxy.io) returned Google's own
   "unusual traffic from your computer network" bot-block page — those
   free proxies are shared by thousands of scrapers, so Google had rate-
   limited their IPs. rss2json's free tier (10k requests/day) is far more
   than a single-user dashboard needs. Results still cache per category,
   so a dead network shows yesterday's headlines instead of an empty tab.
---------------------------------------------------------------------- */
const FEED_STALE_MS = 25 * 60 * 1000;

// rss2json flattens Google's <source url="..."> element away, so there's no
// reliable publisher domain to key a favicon off — item.host stays empty and
// FeedArt/FeedCard already treat a missing favicon as optional (see below).
function feedFavicon(host) {
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : null;
}

async function fetchFeedItems(targetUrl, limit) {
  const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(targetUrl);
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 9000) : null;
  let json;
  try {
    const r = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!r.ok) throw new Error("HTTP " + r.status);
    json = await r.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (json.status !== "ok" || !Array.isArray(json.items)) throw new Error("feed request failed");
  return json.items
    .slice(0, limit || 24)
    .map((it) => {
      const rawTitle = (it.title || "").trim();
      if (!rawTitle) return null;
      // Google appends " - Publisher" to every headline.
      const source = rawTitle.includes(" - ") ? rawTitle.split(" - ").pop() : "";
      const title = source && rawTitle.endsWith(" - " + source) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
      const desc = (it.description || "").replace(/<[^>]*>/g, "").trim().slice(0, 240);
      return {
        id: it.guid || it.link || rawTitle,
        title,
        link: it.link || "#",
        source,
        host: "",
        pub: it.pubDate || "",
        image: it.thumbnail || "",
        summary: desc,
      };
    })
    .filter(Boolean);
}

function gnewsTopic(topic) {
  return `https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`;
}
function gnewsQuery(q) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

const FEED_CATEGORIES = [
  { id: "world", label: "World", group: "news", url: gnewsTopic("WORLD") },
  { id: "us", label: "U.S.", group: "news", url: gnewsTopic("NATION") },
  { id: "business", label: "Business", group: "news", url: gnewsTopic("BUSINESS") },
  { id: "tech", label: "Technology", group: "news", url: gnewsTopic("TECHNOLOGY") },
  { id: "science", label: "Science", group: "news", url: gnewsTopic("SCIENCE") },
  { id: "security", label: "Cybersecurity", group: "news", url: gnewsQuery('cybersecurity OR ransomware OR "data breach" OR "zero-day" OR CISA') },
  { id: "movies", label: "Movies", group: "screen", url: gnewsQuery("movie release date OR casting OR box office OR trailer") },
  { id: "tv", label: "TV & Streaming", group: "screen", url: gnewsQuery("TV series premiere OR renewed OR canceled OR streaming show") },
  { id: "gaming", label: "Video Games", group: "gaming", url: gnewsQuery("video game release OR gameplay reveal OR game studio OR console") },
  { id: "esports", label: "Esports", group: "gaming", url: gnewsQuery("esports tournament OR competitive gaming championship") },
  { id: "sportsnews", label: "Sports", group: "news", url: gnewsTopic("SPORTS") },
];

function feedRelTime(str) {
  try {
    const then = new Date(str).getTime();
    if (isNaN(then)) return "";
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch (e) { return ""; }
}

// Deterministic artwork so an article without a photo still has visual weight.
function feedArtGradient(seed) {
  let hue = 11;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) hue = (hue * 31 + s.charCodeAt(i)) % 360;
  return `linear-gradient(140deg, hsl(${hue} 70% 52% / 0.85), hsl(${(hue + 48) % 360} 72% 42% / 0.85))`;
}

function FeedArt({ theme, item }) {
  const [failed, setFailed] = useState(false);
  const fav = feedFavicon(item.host);
  if (item.image && !failed) {
    return (
      <img
        className="v-feedart"
        src={item.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{ background: theme.chip, border: `1px solid ${theme.cardBorder}` }}
      />
    );
  }
  // No photo: a deterministic gradient tile carrying the publisher's favicon.
  return (
    <span className="v-feedart v-feedart--gen" style={{ backgroundImage: feedArtGradient(item.host || item.title), border: `1px solid ${theme.cardBorder}` }}>
      {fav && <img src={fav} alt="" loading="lazy" width="26" height="26" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
    </span>
  );
}

function FeedCard({ theme, item }) {
  const fav = feedFavicon(item.host);
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="v-feedcard"
      style={{ ...cardBackgroundStyle(theme), color: theme.text }}
    >
      <FeedArt theme={theme} item={item} />
      <span className="v-feedcard__body">
        <span className="v-feedcard__title" style={{ color: theme.text }}>{item.title}</span>
        {item.summary && <span className="v-feedcard__sum" style={{ color: theme.textMuted }}>{truncateText(item.summary, 130)}</span>}
        <span className="v-feedcard__meta" style={{ color: theme.textFaint }}>
          {fav && <img src={fav} alt="" width="14" height="14" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          <span>{item.source || item.host}</span>
          {item.pub && <span>· {feedRelTime(item.pub)}</span>}
        </span>
      </span>
    </a>
  );
}

function FeedSkeleton({ theme, n = 6 }) {
  return (
    <div className="v-feedgrid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="v-feedcard" style={{ ...cardBackgroundStyle(theme) }}>
          <span className="v-feedart v-skeleton" />
          <span className="v-feedcard__body">
            <span className="v-skeleton" style={{ height: "13px", width: "92%" }} />
            <span className="v-skeleton" style={{ height: "13px", width: "70%" }} />
            <span className="v-skeleton" style={{ height: "10px", width: "40%" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* Same suggestion engine as WatchQueueSection's own row, surfaced again on the
   Movies & TV news page so a suggestion is visible without a trip to the Watch List. */
function MovieWatchSuggestions({ theme, profile, watchlist, setWatchlist }) {
  const suggestions = suggestTitles(profile.genres, watchlist, 4);
  if (!suggestions.length) return null;

  function addTitle(t, ty) {
    const trimmed = t.trim();
    if (!trimmed || watchlist.some((w) => w.title.toLowerCase() === trimmed.toLowerCase())) return;
    const id = "w" + Date.now() + Math.random().toString(36).slice(2, 6);
    setWatchlist([...watchlist, { id, title: trimmed, type: ty, status: "queued" }]);
    toast.success(`Added "${trimmed}" to your watch list.`);
  }

  return (
    <Card theme={theme} delay={0}>
      <SectionLabel theme={theme} icon={<IconFilm />}>Suggested for you</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => addTitle(s.title, s.type)}
            className="v-btn"
            title={`Add "${s.title}" to your watch list`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: theme.text,
              background: theme.accentSoft,
              border: `1px solid ${theme.divider}`,
              borderRadius: "999px",
              padding: "6px 12px 6px 10px",
            }}
          >
            <span style={{ color: theme.accent }}>+</span>
            {s.title}
            <span style={{ color: theme.textFaint, fontWeight: 500 }}>{s.type === "show" ? "show" : "movie"}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* A whole news surface: category chips + grid, driven by the shared engine. */
function FeedSection({ theme, state, setState, categories, title, icon, intro }) {
  const cats = categories && categories.length ? categories : FEED_CATEGORIES;
  const [active, setActive] = useState(cats[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = (state && state.cache) || {};
  const fetchedAt = (state && state.fetchedAt) || {};

  async function load(catId, force) {
    const cat = cats.find((c) => c.id === catId);
    if (!cat) return;
    const fresh = fetchedAt[catId] && Date.now() - fetchedAt[catId] < FEED_STALE_MS;
    if (!force && fresh && (cache[catId] || []).length) return;
    setLoading(true);
    setError(null);
    try {
      const items = await fetchFeedItems(cat.url, 24);
      if (!items.length) throw new Error("no stories");
      setState((s) => ({
        ...(s || {}),
        cache: { ...((s || {}).cache || {}), [catId]: items },
        fetchedAt: { ...((s || {}).fetchedAt || {}), [catId]: Date.now() },
      }));
    } catch (e) {
      if (!(cache[catId] || []).length) {
        setError("Couldn't reach the news services. Cached stories show here when available; this works on the live site but the preview blocks outside requests.");
      } else {
        toast.warn("Couldn't refresh — showing saved stories.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(active); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [active]);

  const items = cache[active] || [];
  const stamp = fetchedAt[active];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={icon} style={{ margin: 0 }}>{title}</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>{stamp ? `Updated ${feedRelTime(new Date(stamp).toISOString())}` : "Not loaded yet"}</span>
          <button
            onClick={() => load(active, true)}
            disabled={loading}
            className="v-btn"
            style={{ marginLeft: "auto", padding: "8px 15px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {intro && <div style={{ fontSize: "12.5px", color: theme.textMuted, marginTop: "10px", lineHeight: 1.45 }}>{intro}</div>}
        <Segmented theme={theme} value={active} onChange={setActive} options={cats}
          ariaLabel="Category" style={{ marginTop: "12px" }} />
        {error && (
          <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft, lineHeight: 1.45 }}>{error}</div>
        )}
      </Card>

      {loading && items.length === 0 ? (
        <FeedSkeleton theme={theme} />
      ) : items.length === 0 ? (
        <Card theme={theme} delay={60}>
          <EmptyState theme={theme} art="search" title="No stories yet" message="Hit Refresh to pull the latest headlines." />
        </Card>
      ) : (
        <div className="v-feedgrid">
          {items.map((it) => <FeedCard key={it.id} theme={theme} item={it} />)}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   RESUME — a professional CV surface.

   Placeholder content is realistic rather than lorem ipsum so the layout is
   honestly exercised. Editing is a validated JSON panel: the document is
   deeply nested (roles -> bullets, certs -> dates), and inline editing every
   leaf would mean dozens of controls to maintain for a page edited a few
   times a year. Print rules render it as a clean two-page CV.
---------------------------------------------------------------------- */
const DEFAULT_RESUME = {
  name: "Andrew Makris",
  title: "Information Security Analyst",
  location: "Phoenix, AZ",
  email: "amakris03@gmail.com",
  phone: "623-806-9966",
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/andrew-makris-441969258" },
    { label: "GitHub", url: "https://github.com/AndrewMakris2" },
  ],
  summary:
    "Information Security Analyst with 3+ years of enterprise security experience across healthcare and technology sectors. Reduced vulnerability count by 60% and remediated 100% of critical findings within 90 days. Proven expertise in threat hunting, threat modeling, EDR operations, HITRUST compliance, and PKI health reporting. Holds CompTIA CySA+ and SecAI+; actively pursuing SecurityX.",
  experience: [
    {
      company: "Mechanical Orchard",
      title: "Information Security Analyst",
      start: "Dec 2025",
      end: "Present",
      location: "Full-Time, Remote",
      bullets: [
        "Investigate and respond to security alerts daily using SentinelOne and Pondurance MDR, ensuring timely detection, containment, and remediation of incidents.",
        "Reduced overall vulnerability count by 60% and achieved 100% remediation of critical findings within 90 days, materially improving organizational security posture.",
        "Conduct weekly hypothesis-driven threat hunting and behavioral analysis across endpoints via SIEM and Okta log review, surfacing previously undetected threats.",
        "Deliver weekly PKI security health reports and lead SecOps meetings presenting risk metrics and trending threat data to stakeholders.",
        "Manage IT security tickets in Ravenna, resolving 10–20 per week while maintaining SLA compliance and collaborating with IT and DevSecOps leads on remediation.",
      ],
    },
    {
      company: "Virtix Health / CorroHealth",
      title: "Cybersecurity Analyst",
      start: "Sep 2022",
      end: "Present",
      location: "Full-Time → Part-Time/Contract, Remote",
      bullets: [
        "Led vulnerability management program using Qualys and Clearwater NDR; monitored EDR and SIEM platforms to detect, analyze, and respond to active threats across a 1,200+ endpoint environment.",
        "Conducted IAM audits and access reviews in Okta and AWS IAM, enforcing least-privilege principles and strengthening identity governance.",
        "Managed email security infrastructure using Inky and Mimecast, diagnosing and resolving inbound connector trust mismatches and maintaining blocklists.",
        "Coordinated and led penetration testing engagements — acting as liaison between external vendors and internal product teams — including scoping, kickoff, threat modeling sessions, and remediation tracking.",
        "Supported HITRUST certification and compliance through incident response, security investigations, and audit-readiness activities.",
        "Drove active phishing incident response efforts including IOC analysis, firewall block rule implementation, and cross-platform containment across CrowdStrike, Sophos, and Inky.",
      ],
    },
    {
      company: "1stResponder",
      title: "Cybersecurity Specialist",
      start: "Mar 2026",
      end: "Present",
      location: "Part-Time/Contract",
      bullets: [
        "Lead tabletop exercises for client organizations, facilitating structured incident response walkthroughs that improve team readiness and surface real detection gaps.",
        "Conduct proactive threat hunting for clients using CrowdStrike Falcon, identifying IOCs and suspicious behavioral patterns before escalation.",
        "Serve as on-demand security advisor, providing guidance on best practices, threat awareness, and defensive strategy aligned to client risk profiles.",
      ],
    },
  ],
  certifications: [
    { name: "CompTIA CySA+", issuer: "CompTIA", earned: "", expires: "", credential: "" },
    { name: "CompTIA SecAI+", issuer: "CompTIA", earned: "", expires: "", credential: "" },
    { name: "CompTIA SecurityX (CAS-005) — In Progress", issuer: "CompTIA", earned: "", expires: "", credential: "" },
    { name: "MTA Web Development", issuer: "Microsoft", earned: "", expires: "", credential: "" },
  ],
  skills: [
    { group: "Threat Detection & Response", items: ["Threat Hunting", "Threat Modeling (STRIDE)", "EDR & Alert Triage", "SIEM Analysis", "Incident Response"] },
    { group: "Incident Response", items: ["IOC Analysis", "Containment & Eradication", "Forensics", "Phishing Response", "Behavioral Analysis"] },
    { group: "Identity & Access Management", items: ["IAM/RBAC/MFA", "Okta Administration", "AWS IAM", "Azure AD/Entra ID"] },
    { group: "Vulnerability Management", items: ["Qualys", "Patch Management", "Risk Analysis", "HITRUST Compliance", "Penetration Test Coordination"] },
    { group: "Security Platforms", items: ["CrowdStrike Falcon", "SentinelOne", "Sophos", "Cylance", "Cisco Security Cloud"] },
    { group: "Email Security", items: ["Inky/Mimecast Administration", "Connector Management", "Threat Analysis"] },
    { group: "Security Vendor Management", items: ["Security Questionnaires", "Vendor Risk Assessment", "SAR Coordination"] },
    { group: "Network & MDR", items: ["Clearwater NDR", "Pondurance MDR", "Firewall Policy", "IRU/Kanji"] },
    { group: "Cloud & Infrastructure", items: ["AWS (IAM, EC2)", "Azure/Entra ID", "Cloud Security Posture", "PKI Reporting"] },
    { group: "Automation & Scripting", items: ["Python", "PowerShell", "REST APIs", "Security Tooling Integration"] },
    { group: "AI & Emerging Technology", items: ["Claude & LLM Proficiency", "AI Governance", "AI Security Assessment"] },
    { group: "Compliance Frameworks", items: ["HIPAA", "NIST", "HITRUST", "Risk Management", "POA&Ms", "SSPs"] },
    { group: "Training & Coursework", items: ["Azure AZ-900", "AWS Academy Cloud Foundations", "AWS Cloud Security Foundations", "LetsDefend SIEM Engineer", "Threat Hunting", "Vulnerability Management 101", "AI Cloud Security Fundamentals"] },
  ],
  education: [
    { school: "Grand Canyon University", degree: "B.S., Cybersecurity", year: "2024", detail: "Magna Cum Laude" },
    { school: "WestMec", degree: "Full Stack Development", year: "2022", detail: "" },
  ],
  projects: [
    { name: "Vantage", detail: "Single-file personal and security operations dashboard — vulnerability analysis, PKI reporting, policy tracking and daily logs. Built with React, no backend; all data stays on device." },
  ],
};

function resumeDaysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today.getTime()) / 86400000);
}
function resumeYear(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function ResumeAvatar({ theme, name }) {
  const initials = String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="v-resume__avatar"
      aria-hidden="true"
      style={{
        background: `linear-gradient(140deg, ${theme.accent}, ${theme.progressFill && String(theme.progressFill).includes("gradient") ? theme.accent : theme.accent})`,
        color: theme.accentText,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function ResumeSection({ theme, title, children }) {
  return (
    <Card theme={theme} style={{ height: "auto" }}>
      <SectionLabel theme={theme}>{title}</SectionLabel>
      {children}
    </Card>
  );
}

function ResumeView({ theme, data }) {
  const r = data;
  return (
    <div className="v-resume" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <Card theme={theme} style={{ height: "auto" }}>
        <div className="v-resume__head">
          <ResumeAvatar theme={theme} name={r.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(22px, 3.4vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", color: theme.text, lineHeight: 1.15 }}>{r.name}</h1>
            <div style={{ fontSize: "clamp(14px, 2vw, 16px)", fontWeight: 600, color: theme.accent, marginTop: "3px" }}>{r.title}</div>
            <div style={{ fontSize: "12.5px", color: theme.textMuted, marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
              {r.location && <span>{r.location}</span>}
              {r.email && <a href={`mailto:${r.email}`} style={{ color: theme.textMuted }}>{r.email}</a>}
              {r.phone && <span>{r.phone}</span>}
            </div>
            {(r.links || []).length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                {r.links.map((l) => (
                  <a
                    key={l.label + l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-btn"
                    style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "999px", textDecoration: "none", border: `1px solid ${theme.cardBorder}`, color: theme.text, background: theme.chip }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        {r.summary && <p style={{ margin: "16px 0 0", fontSize: "13.5px", lineHeight: 1.62, color: theme.textMuted }}>{r.summary}</p>}
      </Card>

      {/* Experience */}
      {(r.experience || []).length > 0 && (
        <ResumeSection theme={theme} title="Experience">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {r.experience.map((job, i) => (
              <div key={i} className="v-resume__job">
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "baseline" }}>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: theme.text }}>{job.title}</span>
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: theme.accent }}>{job.company}</span>
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: theme.textFaint, whiteSpace: "nowrap" }}>
                    {job.start}{job.end ? ` — ${job.end}` : ""}{job.location ? ` · ${job.location}` : ""}
                  </span>
                </div>
                <ul style={{ margin: "8px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {(job.bullets || []).map((b, bi) => (
                    <li key={bi} style={{ fontSize: "13px", lineHeight: 1.55, color: theme.textMuted }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ResumeSection>
      )}

      {/* Certifications */}
      {(r.certifications || []).length > 0 && (
        <ResumeSection theme={theme} title="Certifications">
          <div className="v-certgrid">
            {r.certifications.map((c, i) => {
              const days = resumeDaysUntil(c.expires);
              const expired = days != null && days < 0;
              const soon = days != null && days >= 0 && days <= 90;
              return (
                <div key={i} className="v-cert" style={{ border: `1px solid ${expired ? theme.danger : soon ? theme.accent : theme.cardBorder}`, background: theme.inputBg }}>
                  <span style={{ color: expired ? theme.danger : theme.accent, display: "inline-flex", flexShrink: 0 }}><IconCertificate size={18} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: theme.text }}>{c.name}</span>
                    <span style={{ display: "block", fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>{c.issuer}</span>
                    <span style={{ display: "block", fontSize: "11.5px", color: theme.textFaint, marginTop: "4px" }}>
                      {c.earned ? `Earned ${resumeYear(c.earned)}` : ""}
                      {c.expires ? ` · Expires ${resumeYear(c.expires)}` : " · No expiry"}
                      {c.credential ? ` · ${c.credential}` : ""}
                    </span>
                    {(expired || soon) && (
                      <span style={{ display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px", color: expired ? theme.danger : theme.accent, background: expired ? theme.dangerSoft : theme.accentSoft }}>
                        {expired ? "EXPIRED" : `RENEW IN ${days}D`}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </ResumeSection>
      )}

      {/* Skills */}
      {(r.skills || []).length > 0 && (
        <ResumeSection theme={theme} title="Skills">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {r.skills.map((g, i) => (
              <div key={i}>
                <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "6px" }}>{g.group}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(g.items || []).map((s, si) => (
                    <span key={si} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 11px", borderRadius: "999px", background: theme.chip, color: theme.chipText, border: `1px solid ${theme.cardBorder}` }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ResumeSection>
      )}

      {/* Projects + Education */}
      <div className="v-resume__two">
        {(r.projects || []).length > 0 && (
          <ResumeSection theme={theme} title="Projects">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {r.projects.map((p, i) => (
                <div key={i}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text }}>{p.name}</div>
                  <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: theme.textMuted, marginTop: "3px" }}>{p.detail}</div>
                </div>
              ))}
            </div>
          </ResumeSection>
        )}
        {(r.education || []).length > 0 && (
          <ResumeSection theme={theme} title="Education">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {r.education.map((e, i) => (
                <div key={i}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text }}>{e.degree}</div>
                  <div style={{ fontSize: "12.5px", color: theme.textMuted, marginTop: "2px" }}>{e.school}{e.year ? ` · ${e.year}` : ""}</div>
                  {e.detail && <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "2px" }}>{e.detail}</div>}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}
      </div>
    </div>
  );
}

function ResumeSectionPage({ theme, data, setData }) {
  const r = data && data.name ? data : DEFAULT_RESUME;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");

  function openEditor() {
    setDraft(JSON.stringify(r, null, 2));
    setErr("");
    setEditing(true);
  }
  function save() {
    try {
      const parsed = JSON.parse(draft);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected a JSON object.");
      setData(parsed);
      setEditing(false);
      toast.success("Resume updated.");
    } catch (e) {
      setErr(e.message || "That isn't valid JSON.");
    }
  }
  function resetToSample() {
    setData(DEFAULT_RESUME);
    setDraft(JSON.stringify(DEFAULT_RESUME, null, 2));
    setErr("");
    toast.info("Restored the default resume.");
  }
  function exportJson() {
    moDownload(`resume-${(r.name || "resume").toLowerCase().replace(/\s+/g, "-")}.json`, JSON.stringify(r, null, 2), "application/json");
    toast.success("Resume JSON downloaded.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} style={{ height: "auto" }} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconUser />} style={{ margin: 0 }}>Resume</SectionLabel>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => window.print()} className="v-btn v-noprint" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}>Print / PDF</button>
            <button onClick={exportJson} className="v-btn v-noprint" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}>Export JSON</button>
            <button onClick={editing ? () => setEditing(false) : openEditor} className="v-btn v-noprint" style={{ padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: editing ? theme.chip : theme.accent, color: editing ? theme.chipText : theme.accentText }}>
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>
      </Card>

      {editing && (
        <Card theme={theme} style={{ height: "auto" }} delay={40}>
          <SectionLabel theme={theme}>Edit resume data</SectionLabel>
          <div style={{ fontSize: "12.5px", color: theme.textMuted, marginBottom: "10px", lineHeight: 1.5 }}>
            The whole document as JSON. Keep the field names; change the values. Sections with empty arrays are hidden automatically.
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            rows={20}
            className="v-input v-scroll"
            style={{ width: "100%", resize: "vertical", padding: "12px 14px", borderRadius: "10px", fontSize: "12.5px", lineHeight: 1.55, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--scroll-thumb": theme.divider }}
          />
          {err && <div style={{ marginTop: "10px", fontSize: "12.5px", fontWeight: 600, color: theme.danger, background: theme.dangerSoft, borderRadius: "9px", padding: "9px 12px" }}>{err}</div>}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            <button onClick={save} className="v-btn" style={{ padding: "9px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Save</button>
            <button onClick={resetToSample} className="v-btn" style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.dangerSoft, color: theme.danger }}>Restore default</button>
          </div>
        </Card>
      )}

      <ResumeView theme={theme} data={r} />
    </div>
  );
}

const SUB_DOMAINS = {
  netflix: "netflix.com", spotify: "spotify.com", hulu: "hulu.com", disney: "disneyplus.com",
  "disney+": "disneyplus.com", max: "max.com", hbo: "max.com", prime: "amazon.com",
  "amazon prime": "amazon.com", youtube: "youtube.com", "youtube premium": "youtube.com",
  icloud: "icloud.com", apple: "apple.com", "apple tv": "tv.apple.com", "apple music": "music.apple.com",
  dropbox: "dropbox.com", github: "github.com", notion: "notion.so", slack: "slack.com",
  adobe: "adobe.com", peacock: "peacocktv.com", paramount: "paramountplus.com",
  espn: "espn.com", nytimes: "nytimes.com", audible: "audible.com", "xbox game pass": "xbox.com",
  playstation: "playstation.com", steam: "steampowered.com", nintendo: "nintendo.com",
  chatgpt: "openai.com", openai: "openai.com", claude: "claude.ai", google: "google.com",
};
function subDomain(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return "";
  if (SUB_DOMAINS[n]) return SUB_DOMAINS[n];
  const key = Object.keys(SUB_DOMAINS).find((k) => n.includes(k));
  if (key) return SUB_DOMAINS[key];
  // A single bare word is usually the brand; guess the .com.
  return /^[a-z0-9-]+$/.test(n) ? n + ".com" : "";
}

function BrandMark({ theme, name, size = 38 }) {
  const [failed, setFailed] = useState(false);
  const domain = subDomain(name);
  const initials = String(name || "?").trim().slice(0, 2).toUpperCase();
  let hue = 21;
  for (let i = 0; i < String(name).length; i++) hue = (hue * 31 + String(name).charCodeAt(i)) % 360;
  const box = {
    width: size + "px", height: size + "px", borderRadius: "10px", flexShrink: 0,
    border: `1px solid ${theme.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", background: `linear-gradient(140deg, hsl(${hue} 62% 52% / .30), hsl(${(hue + 44) % 360} 62% 42% / .22))`,
  };
  if (domain && !failed) {
    return (
      <span style={box}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt=""
          width={size - 14}
          height={size - 14}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ display: "block", borderRadius: "5px" }}
        />
      </span>
    );
  }
  return <span style={{ ...box, fontSize: "13px", fontWeight: 800, color: theme.chipText }}>{initials}</span>;
}

function SubscriptionsSection({ theme, subs, setSubs }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [renewal, setRenewal] = useState("");
  const [category, setCategory] = useState("");

  function addSub() {
    const n = name.trim();
    const c = parseFloat(cost);
    if (!n) { toast.info("Give the subscription a name first."); return; }
    if (isNaN(c)) { toast.info("Enter the cost as a number, e.g. 10.99."); return; }
    setSubs([...(subs || []), { id: "sub" + Date.now(), name: n, cost: c, cycle, renewal, category: category.trim() }]);
    setName(""); setCost(""); setCycle("monthly"); setRenewal(""); setCategory("");
  }
  function removeSub(id) {
    const removed = (subs || []).find((s) => s.id === id);
    setSubs((subs || []).filter((s) => s.id !== id));
    if (removed) toastUndo(`"${removed.name || "subscription"}"`, () => setSubs((cur) => [...(cur || []), removed]));
  }

  const monthly = useMemo(() => (subs || []).reduce((sum, s) => sum + subPerMonth(s), 0), [subs]);
  const sorted = useMemo(() => {
    return [...(subs || [])].sort((a, b) => {
      const da = subDaysUntil(a.renewal), db = subDaysUntil(b.renewal);
      if (da == null && db == null) return b.cost - a.cost;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [subs]);

  const inputStyle = { padding: "8px 10px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme} icon={<IconCreditCard />}>Subscriptions</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span className="v-tabular" style={{ fontSize: "30px", fontWeight: 800, color: theme.text }}>{fmtMoney(monthly)}</span>
          <span style={{ fontSize: "13px", color: theme.textMuted }}>/ month</span>
          <span style={{ fontSize: "13px", color: theme.textFaint, marginLeft: "auto" }}>{fmtMoney(monthly * 12)} / year · {(subs || []).length} active</span>
        </div>

        {/* Add form */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginTop: "14px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Netflix)" className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }} />
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost" inputMode="decimal" className="v-input" style={inputStyle} />
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="v-input" style={inputStyle}>
            {SUB_CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="date" value={renewal} onChange={(e) => setRenewal(e.target.value)} title="Next renewal" className="v-input" style={inputStyle} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" className="v-input" style={inputStyle} />
          <button onClick={addSub} className="v-btn" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Add</button>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <Card theme={theme} delay={80}>
          <EmptyState theme={theme} art="money" title="No subscriptions yet" message="Add your first one above to see your monthly total." />
        </Card>
      ) : (
        <Card theme={theme} delay={80}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sorted.map((s) => {
              const dleft = subDaysUntil(s.renewal);
              const renewLabel = dleft == null ? "" : dleft < 0 ? "overdue" : dleft === 0 ? "renews today" : dleft === 1 ? "renews tomorrow" : `renews in ${dleft}d`;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", flexWrap: "wrap" }}>
                  <BrandMark theme={theme} name={s.name} />
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{s.name}</div>
                    <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "2px" }}>
                      {[s.category, renewLabel].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="v-tabular" style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{fmtMoney(s.cost)}<span style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 500 }}> /{(SUB_CYCLES.find((c) => c.id === s.cycle) || SUB_CYCLES[0]).label.toLowerCase().replace("ly", "")}</span></div>
                    <div style={{ fontSize: "11px", color: theme.textFaint }}>≈ {fmtMoney(subPerMonth(s))}/mo</div>
                  </div>
                  <button onClick={() => removeSub(s.id)} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   NEWS — daily headlines by topic

   Uses the Hacker News (Algolia) search API: CORS-enabled, no key, no
   backend. You give it topics; it returns recent stories (which surface a
   lot of security-press and CVE coverage). Results cache to localStorage so
   the tab loads instantly and survives brief offline spells. Live fetches
   only work on the deployed site — the sandbox/preview blocks outbound
   requests, so the tab shows a friendly note there.
---------------------------------------------------------------------- */
const DEFAULT_NEWS_TOPICS = ["cybersecurity", "ransomware", "vulnerability", "data breach"];
const NEWS_STALE_MS = 60 * 60 * 1000; // refetch if the cache is older than an hour

function IconNews({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h13v14a2 2 0 0 1-2 2H5a2 2 0 0 1-1-1.7V5z" />
      <path d="M17 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2" />
      <path d="M7 8h7M7 12h7M7 16h5" />
    </svg>
  );
}

function newsRelTime(iso) {
  try {
    const then = new Date(iso).getTime();
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch (e) { return ""; }
}
function newsDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
}

async function fetchNewsTopic(topic, limit = 8) {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("News request failed (" + r.status + ")");
  const data = await r.json();
  return (data.hits || [])
    .filter((h) => h.title)
    .map((h) => ({
      id: h.objectID,
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points || 0,
      comments: h.num_comments || 0,
      date: h.created_at,
    }));
}

function NewsSection({ theme, state, setState }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topicInput, setTopicInput] = useState("");
  const topics = state.topics || DEFAULT_NEWS_TOPICS;
  const cache = state.cache || {};

  async function refresh(topicList) {
    const list = topicList || topics;
    if (list.length === 0) { setState((s) => ({ ...s, cache: {}, fetchedAt: Date.now() })); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        list.map((t) => fetchNewsTopic(t).then((items) => [t, items]).catch(() => [t, null]))
      );
      const next = {};
      let anyOk = false;
      results.forEach(([t, items]) => {
        if (items) { next[t] = items; anyOk = true; }
        else if (cache[t]) next[t] = cache[t]; // keep prior on per-topic failure
      });
      if (!anyOk) {
        setError("Couldn't reach the news source. On the live site this loads automatically; the preview/sandbox blocks outside requests.");
      }
      setState((s) => ({ ...s, topics: list, cache: next, fetchedAt: Date.now() }));
    } catch (e) {
      setError(e.message || "Couldn't load news.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch on first open if we have nothing cached or the cache is stale.
  useEffect(() => {
    const stale = !state.fetchedAt || Date.now() - state.fetchedAt > NEWS_STALE_MS;
    if (topics.length && (Object.keys(cache).length === 0 || stale)) refresh(topics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addTopic() {
    const t = topicInput.trim();
    if (!t) return;
    if (topics.some((x) => x.toLowerCase() === t.toLowerCase())) { setTopicInput(""); return; }
    const next = [...topics, t];
    setTopicInput("");
    refresh(next);
  }
  function removeTopic(t) {
    const next = topics.filter((x) => x !== t);
    const nextCache = { ...cache };
    delete nextCache[t];
    setState((s) => ({ ...s, topics: next, cache: nextCache }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconNews />} style={{ margin: 0 }}>News by topic</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>
            {state.fetchedAt ? `Updated ${newsRelTime(new Date(state.fetchedAt).toISOString())}` : "Not loaded yet"}
          </span>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="v-btn"
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.accent}`, background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ fontSize: "12px", color: theme.textMuted, margin: "12px 0 10px", lineHeight: 1.4 }}>
          Add the topics you want to follow. Headlines come from Hacker News search — no account or key needed.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {topics.map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: theme.chipText, background: theme.chip, padding: "6px 10px", borderRadius: "999px" }}>
              {t}
              <button onClick={() => removeTopic(t)} className="v-btn" title="Remove topic" style={{ border: "none", background: "transparent", color: theme.chipText, fontSize: "13px", lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTopic(); }}
            placeholder="Add a topic (e.g. SentinelOne, CVE, phishing)…"
            className="v-input"
            style={{ flex: 1, padding: "8px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent }}
          />
          <button onClick={addTopic} className="v-btn" style={{ padding: "8px 15px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: theme.accentSoft, color: theme.text }}>Add</button>
        </div>

        {error && (
          <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft, lineHeight: 1.45 }}>
            {error}
          </div>
        )}
      </Card>

      {topics.map((t, ti) => {
        const items = cache[t] || [];
        return (
          <Card theme={theme} key={t} delay={40 * (ti + 1)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: theme.text, textTransform: "capitalize" }}>{t}</span>
              <span style={{ fontSize: "11px", color: theme.textFaint }}>{items.length ? `${items.length} stories` : loading ? "loading…" : "no stories"}</span>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: theme.textFaint }}>{loading ? "Fetching headlines…" : "Nothing cached yet — hit Refresh on the live site."}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((it, i) => (
                  <a
                    key={it.id}
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", textDecoration: "none", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}` }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text, lineHeight: 1.4 }}>{it.title}</div>
                    <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "3px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {newsDomain(it.url) && <span>{newsDomain(it.url)}</span>}
                      <span>▲ {it.points}</span>
                      <span>{newsRelTime(it.date)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------
   APP LOCK — optional PIN gate

   A privacy lock, not full encryption: the PIN is verified with PBKDF2
   (Web Crypto) against a stored salted hash, and the UI is gated behind a
   lock screen. Data still lives in local storage, so this deters casual
   access on a shared/lost device rather than defending against someone with
   devtools. (Encrypting the sensitive stores at rest is a possible follow-up.)
---------------------------------------------------------------------- */
const LOCK_ITERATIONS = 150000;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
async function derivePinHash(pin, saltBytes, iters) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: iters, hash: "SHA-256" }, key, 256);
  return bufToHex(bits);
}
async function makePinRecord(pin, encrypt) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinHash(pin, salt, LOCK_ITERATIONS);
  const rec = { enabled: true, salt: bufToHex(salt), hash, iters: LOCK_ITERATIONS };
  if (encrypt) {
    const encSalt = crypto.getRandomValues(new Uint8Array(16));
    rec.encrypted = true;
    rec.encSalt = bufToHex(encSalt);
    __vaultKey = await deriveVaultKey(pin, rec.encSalt, LOCK_ITERATIONS);
  }
  return rec;
}
async function verifyPin(pin, rec) {
  if (!rec || !rec.salt) return false;
  const hash = await derivePinHash(pin, hexToBytes(rec.salt), rec.iters || LOCK_ITERATIONS);
  return hash === rec.hash;
}

// ----------------------------------------------------------------------
// Optional encryption-at-rest layer, opt-in per PIN. A second PBKDF2
// derivation (different salt from the verification hash above, standard
// key-separation hygiene) produces a non-extractable AES-256-GCM key that
// only ever exists in memory for the current unlocked session — it's never
// itself written to storage, only derivable again from the correct PIN.
// "Lock now" encrypts a full snapshot (snapshotAllStorage) into
// dash.encryptedVault and clears every other dash.* key; unlocking decrypts
// the vault, restores it, and reloads. This only protects data from the
// moment an explicit lock happens (or a fresh page load finds the vault
// already locked) — closing the tab without locking first leaves that
// session's plaintext in place, same boundary the PIN gate itself already
// has.
// Deliberately not in STORAGE_KEYS: it's a device-local encryption artifact,
// not something that should travel through the plaintext JSON backup file.
const VAULT_STORAGE_KEY = "dash.encryptedVault";
let __vaultKey = null;
async function deriveVaultKey(pin, encSaltHex, iters) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: hexToBytes(encSaltHex), iterations: iters, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: bufToHex(iv), data: btoa(String.fromCharCode(...new Uint8Array(cipher))) };
}
async function decryptJSON(key, envelope) {
  const iv = hexToBytes(envelope.iv);
  const bytes = Uint8Array.from(atob(envelope.data), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes);
  return JSON.parse(new TextDecoder().decode(plain));
}
// Wipes every registered store except the ones the lock screen itself
// needs to render (theme) and the lock/vault records it needs to unlock.
function clearAllStorageExcept(keepKeys) {
  const keep = new Set(keepKeys);
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (!keep.has(key)) localStorage.removeItem(key);
  });
}

function IconLock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LockScreen({ theme, lock, onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!pin || checking) return;
    setChecking(true);
    const ok = await verifyPin(pin, lock);
    if (!ok) { setChecking(false); setError(true); setPin(""); return; }

    if (!lock.encrypted) { setChecking(false); onUnlock(); return; }

    __vaultKey = await deriveVaultKey(pin, lock.encSalt, lock.iters || LOCK_ITERATIONS);
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) {
      // Encryption was turned on but nothing's been locked yet since — the
      // key's ready for the next "Lock now", current storage is already
      // the real (unencrypted) data.
      setChecking(false);
      onUnlock();
      return;
    }
    try {
      const envelope = JSON.parse(raw);
      const snap = await decryptJSON(__vaultKey, envelope);
      restoreAllStorage(snap);
      // Don't call onUnlock() here — that would flash the app with the
      // blank-default state every store initialized to before this restore
      // landed. A reload re-mounts everything reading the now-correct data.
      // App()'s `locked` state otherwise re-derives from lock.enabled (still
      // true) on that remount and would show the lock screen a second time
      // for a PIN already entered once — this flag is a one-time bridge
      // across exactly that reload, read and cleared on the other side.
      try { sessionStorage.setItem("vantageJustUnlocked", "1"); } catch (e) {}
      setChecking(false);
      setRestoring(true);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setChecking(false);
      setError(true);
      setPin("");
      __vaultKey = null;
    }
  }

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", background: theme.pageBgGradient !== "none" ? theme.pageBgGradient : theme.pageBg,
      }}
    >
      <form onSubmit={submit} style={{ ...cardBackgroundStyle(theme), padding: "34px 30px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <div style={{ color: theme.accent, display: "inline-flex", marginBottom: "12px" }}><IconLock size={30} /></div>
        <div style={{ fontSize: "19px", fontWeight: 800, color: theme.text, marginBottom: "4px" }}>BearVantageHub is locked</div>
        <div style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "20px" }}>Enter your PIN to continue.</div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          placeholder="••••"
          className="v-input v-tabular"
          style={{
            width: "100%", textAlign: "center", letterSpacing: "0.3em", fontSize: "22px", padding: "12px",
            borderRadius: "12px", background: theme.inputBg, color: theme.inputText,
            border: `1px solid ${error ? theme.danger : theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
          }}
        />
        {error && <div style={{ color: theme.danger, fontSize: "12.5px", fontWeight: 600, marginTop: "10px" }}>Incorrect PIN — try again.</div>}
        <button
          type="submit"
          disabled={checking || restoring || !pin}
          className="v-btn"
          style={{ marginTop: "18px", width: "100%", padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, opacity: checking || restoring || !pin ? 0.6 : 1 }}
        >
          {restoring ? "Decrypting…" : checking ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>,
    document.body
  );
}

function LockMenu({ theme, lock, setLock, onLockNow }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // "set" | "change" | "disable"
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [cur, setCur] = useState("");
  const [encryptOn, setEncryptOn] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); reset(); } }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function reset() { setMode(null); setP1(""); setP2(""); setCur(""); setMsg(null); setBusy(false); }

  async function saveNew() {
    if (p1.length < 4) { setMsg("Use at least 4 digits/characters."); return; }
    if (p1 !== p2) { setMsg("PINs don't match."); return; }
    if (mode === "change" && !(await verifyPin(cur, lock))) { setMsg("Current PIN is incorrect."); return; }
    setBusy(true);
    const rec = await makePinRecord(p1, encryptOn);
    // Already unlocked at this point (this menu only renders outside the lock
    // screen), so current plaintext storage is the source of truth — refresh
    // the vault from it now rather than waiting for the next "Lock now",
    // otherwise a lock immediately after a PIN change would trust a
    // still-old-key vault.
    if (encryptOn) {
      const snap = snapshotAllStorage();
      const envelope = await encryptJSON(__vaultKey, snap);
      saveJSON(VAULT_STORAGE_KEY, envelope);
    } else {
      localStorage.removeItem(VAULT_STORAGE_KEY);
    }
    setLock(rec);
    reset(); setOpen(false);
  }
  async function disable() {
    if (!(await verifyPin(cur, lock))) { setMsg("Current PIN is incorrect."); return; }
    localStorage.removeItem(VAULT_STORAGE_KEY);
    __vaultKey = null;
    setLock({ enabled: false });
    reset(); setOpen(false);
  }

  const enabled = !!(lock && lock.enabled);
  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: "8px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, marginTop: "6px", "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen((o) => !o); reset(); }}
        className="v-btn"
        title="App lock"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.cardBorder}`, background: enabled ? theme.accentSoft : "transparent", color: enabled ? theme.accent : theme.textMuted }}
      >
        <IconLock size={16} />
      </button>

      {open && (
        <div className="v-scroll" style={{ position: "absolute", bottom: "46px", left: 0, width: "240px", zIndex: 40, ...cardBackgroundStyle(theme), padding: "12px" }}>
          {!mode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.sectionLabelColor, padding: "2px 6px 6px" }}>App Lock · {enabled ? "On" : "Off"}</div>
              {enabled ? (
                <React.Fragment>
                  <button onClick={() => { onLockNow(); setOpen(false); }} className="v-btn" style={menuBtn(theme)}>Lock now</button>
                  <button onClick={() => { setMode("change"); setEncryptOn(!!lock.encrypted); }} className="v-btn" style={menuBtn(theme)}>Change PIN</button>
                  <button onClick={() => setMode("disable")} className="v-btn" style={{ ...menuBtn(theme), color: theme.danger }}>Turn off lock</button>
                </React.Fragment>
              ) : (
                <button onClick={() => { setMode("set"); setEncryptOn(false); }} className="v-btn" style={menuBtn(theme)}>Set a PIN</button>
              )}
            </div>
          )}
          {(mode === "set" || mode === "change") && (
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: theme.text, marginBottom: "4px" }}>{mode === "change" ? "Change PIN" : "Set a PIN"}</div>
              {mode === "change" && <input type="password" inputMode="numeric" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current PIN" className="v-input" style={inputStyle} />}
              <input type="password" inputMode="numeric" value={p1} onChange={(e) => setP1(e.target.value)} placeholder="New PIN" className="v-input" style={inputStyle} />
              <input type="password" inputMode="numeric" value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Confirm PIN" className="v-input" style={inputStyle} />
              <label style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginTop: "10px", fontSize: "11.5px", color: theme.textMuted, cursor: "pointer" }}>
                <input type="checkbox" checked={encryptOn} onChange={(e) => setEncryptOn(e.target.checked)} style={{ marginTop: "2px" }} />
                <span>Also encrypt stored data (AES-256, key derived from this PIN). Protects it once you lock — forgetting this PIN makes locked data unrecoverable.</span>
              </label>
              {msg && <div style={{ color: theme.danger, fontSize: "11.5px", marginTop: "6px" }}>{msg}</div>}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                <button onClick={saveNew} disabled={busy} className="v-btn" style={{ ...menuBtn(theme), background: theme.accent, color: theme.accentText, textAlign: "center", border: "none", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save"}</button>
                <button onClick={reset} className="v-btn" style={{ ...menuBtn(theme), textAlign: "center" }}>Cancel</button>
              </div>
            </div>
          )}
          {mode === "disable" && (
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: theme.text, marginBottom: "4px" }}>Turn off lock</div>
              <input type="password" inputMode="numeric" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current PIN" className="v-input" style={inputStyle} />
              {msg && <div style={{ color: theme.danger, fontSize: "11.5px", marginTop: "6px" }}>{msg}</div>}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                <button onClick={disable} className="v-btn" style={{ ...menuBtn(theme), background: theme.danger, color: "#fff", textAlign: "center", border: "none" }}>Turn off</button>
                <button onClick={reset} className="v-btn" style={{ ...menuBtn(theme), textAlign: "center" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function menuBtn(theme) {
  return { display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text };
}

/* ----------------------------------------------------------------------
   REMINDERS & NOTIFICATIONS

   Custom reminders (text + time) plus today's calendar events fire a browser
   notification while the app is open (the checker runs on a timer in App).
   Everything persists locally; the bell badges anything past-due.
---------------------------------------------------------------------- */
function IconBell({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function remDueCount(reminders) {
  const now = Date.now();
  return (reminders.items || []).filter((r) => r.at && new Date(r.at).getTime() <= now).length;
}

const REMINDER_REPEATS = [
  { id: "none", label: "Once" },
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
  { id: "yearly", label: "Every year" },
];
// Advance a repeating reminder past "from", so one that was missed for a week
// lands on its next real occurrence rather than firing seven times.
function reminderNextAt(atISO, repeat, from) {
  if (!repeat || repeat === "none") return null;
  const start = new Date(atISO);
  if (isNaN(start.getTime())) return null;
  const limit = from instanceof Date ? from.getTime() : Date.now();
  const d = new Date(start.getTime());
  let guard = 0;
  while (d.getTime() <= limit && guard++ < 4000) {
    if (repeat === "daily") d.setDate(d.getDate() + 1);
    else if (repeat === "weekdays") { do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); }
    else if (repeat === "weekly") d.setDate(d.getDate() + 7);
    else if (repeat === "monthly") d.setMonth(d.getMonth() + 1);
    else if (repeat === "yearly") d.setFullYear(d.getFullYear() + 1);
    else return null;
  }
  // Back to the local "YYYY-MM-DDTHH:mm" the datetime-local input uses.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function reminderRepeatLabel(id) {
  const r = REMINDER_REPEATS.find((x) => x.id === id);
  return r && r.id !== "none" ? r.label : "";
}

function RemindersMenu({ theme, reminders, setReminders, events }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [at, setAt] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const notifSupported = typeof window !== "undefined" && "Notification" in window;
  const perm = notifSupported ? Notification.permission : "unsupported";

  function enableNotifications() {
    if (!notifSupported) return;
    if (Notification.permission === "granted") { setReminders((s) => ({ ...s, enabled: true })); return; }
    Notification.requestPermission().then((p) => setReminders((s) => ({ ...s, enabled: p === "granted" })));
  }

  const [repeat, setRepeat] = useState("none");

  function addReminder() {
    const t = text.trim();
    if (!t || !at) return;
    const item = { id: "rem" + Date.now(), text: t, at, repeat, notified: false };
    setReminders((s) => ({ ...s, items: [...(s.items || []), item] }));
    setText(""); setAt("");
    toast.success(repeat === "none" ? "Reminder set." : `Reminder set — ${reminderRepeatLabel(repeat).toLowerCase()}.`);
  }
  function removeReminder(id) {
    const removed = ((reminders && reminders.items) || []).find((r) => r.id === id);
    setReminders((s) => ({ ...s, items: (s.items || []).filter((r) => r.id !== id) }));
    if (removed) toastUndo(`the reminder "${removed.title || removed.text || "reminder"}"`, () =>
      setReminders((s) => ({ ...s, items: [...(s.items || []), removed] })));
  }

  const sorted = useMemo(
    () => [...(reminders.items || [])].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [reminders.items]
  );
  const upcomingEvents = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = today.getTime() + 7 * 86400000;
    return (events || [])
      .filter((e) => e.date)
      .map((e) => ({ ...e, ts: new Date(e.date + "T00:00:00").getTime() }))
      .filter((e) => e.ts >= today.getTime() && e.ts <= end)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 6);
  }, [events]);

  const due = remDueCount(reminders);
  const now = Date.now();
  const inputStyle = { padding: "7px 9px", borderRadius: "8px", fontSize: "12.5px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="v-btn"
        title="Reminders"
        style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.cardBorder}`, background: open ? theme.accentSoft : "transparent", color: due ? theme.accent : theme.textMuted }}
      >
        <IconBell size={16} />
        {due > 0 && (
          <span style={{ position: "absolute", top: "-2px", right: "-2px", minWidth: "16px", height: "16px", padding: "0 4px", borderRadius: "999px", background: theme.danger, color: "#fff", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{due}</span>
        )}
      </button>

      {open && (
        <div className="v-scroll" style={{ position: "absolute", bottom: "46px", left: 0, width: "300px", maxHeight: "70vh", overflowY: "auto", zIndex: 40, ...cardBackgroundStyle(theme), padding: "14px", "--scroll-thumb": theme.divider }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "10px" }}>Reminders</div>

          {/* Notification status */}
          {!notifSupported ? (
            <div style={{ fontSize: "12px", color: theme.textFaint, marginBottom: "10px" }}>Browser notifications aren't available here.</div>
          ) : perm === "granted" && reminders.enabled ? (
            <div style={{ fontSize: "12px", color: theme.positive, fontWeight: 600, marginBottom: "10px" }}>● Notifications on</div>
          ) : perm === "denied" ? (
            <div style={{ fontSize: "12px", color: theme.textFaint, marginBottom: "10px" }}>Notifications blocked — enable them for this site in your browser.</div>
          ) : (
            <button onClick={enableNotifications} className="v-btn" style={{ width: "100%", padding: "8px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, marginBottom: "10px" }}>Enable notifications</button>
          )}

          {/* Add reminder */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Remind me to…" className="v-input" style={inputStyle} />
            {/* Wraps: three controls do not fit across a 300px popover, and a
                fixed row silently pushed Add off the edge where it could not be
                clicked at all. */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="v-input" style={{ ...inputStyle, flex: "1 1 150px", minWidth: 0 }} />
              <select value={repeat} onChange={(e) => setRepeat(e.target.value)} title="Repeat" className="v-input" style={{ ...inputStyle, flex: "1 1 96px", minWidth: 0 }}>
                {REMINDER_REPEATS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <button onClick={addReminder} className="v-btn" style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: theme.accentSoft, color: theme.text }}>Add</button>
            </div>
          </div>

          {/* Reminder list */}
          {sorted.length === 0 ? (
            <div style={{ fontSize: "12px", color: theme.textFaint, marginBottom: "10px" }}>No reminders yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {sorted.map((r) => {
                const overdue = new Date(r.at).getTime() <= now;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: overdue ? theme.dangerSoft : theme.accentSoft }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: theme.text }}>{r.text}</div>
                      <div style={{ fontSize: "11px", color: overdue ? theme.danger : theme.textFaint }}>
                        {overdue ? "Due" : ""} {moFormatTs(new Date(r.at).toISOString())}
                        {reminderRepeatLabel(r.repeat) ? ` · ${reminderRepeatLabel(r.repeat)}` : ""}
                      </div>
                    </div>
                    <button onClick={() => removeReminder(r.id)} className="v-btn" title="Dismiss" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "2px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming events (read-only, from your calendar/upcoming) */}
          {upcomingEvents.length > 0 && (
            <div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.sectionLabelColor, margin: "4px 0 8px" }}>Next 7 days</div>
              {upcomingEvents.map((e, i) => (
                <div key={(e.id || e.title) + i} style={{ display: "flex", gap: "8px", padding: "5px 0", fontSize: "12px", color: theme.textMuted }}>
                  <span style={{ color: theme.accent, flexShrink: 0 }}><IconCalendar /></span>
                  <span style={{ flex: 1 }}>{e.title}</span>
                  <span style={{ color: theme.textFaint }}>{e.detail || e.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   COMMAND PALETTE — ⌘K / Ctrl-K global search & jump
---------------------------------------------------------------------- */
function IconImage({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.8" />
      <path d="M21 16l-5-5-5.5 5.5L8 14l-5 5" />
    </svg>
  );
}

function IconCollapse({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l-6 6 6 6" />
      <path d="M19 5v14" />
    </svg>
  );
}

function IconMenu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17" x2="20.5" y2="17" />
    </svg>
  );
}

function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function truncate(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function CommandPalette({ theme, data, onNavigate, onOpenMoTool, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  // Build a flat index of pages + content items across modules.
  const index = useMemo(() => {
    const items = [];
    items.push({ label: "Home", group: "Pages", page: "home" });
    PAGE_META.forEach((p) => items.push({ label: p.label, group: "Pages", page: p.id, icon: p.icon }));
    (data.journal || []).forEach((e) => items.push({ label: truncate(e.text, 60) || "(empty entry)", sub: "Journal · " + (e.date || ""), group: "Journal", page: "journal" }));
    (data.watchlist || []).forEach((w) => items.push({ label: w.title, sub: "Watch List · " + (w.status || ""), group: "Watch List", page: "watchlist" }));
    (data.goals || []).forEach((g) => items.push({ label: g.label, sub: "Life Goals · " + (g.status || ""), group: "Life Goals", page: "goals" }));
    (data.trackers || []).forEach((t) => items.push({ label: t.label, sub: "Tracker · " + (t.value || ""), group: "Trackers", page: "trackers" }));
    (data.events || []).forEach((e) => items.push({ label: e.title, sub: "Event · " + (e.detail || e.date || ""), group: "Upcoming", page: "upcoming" }));
    (data.transactions || []).forEach((t) => items.push({ label: t.merchant, sub: "Transaction · " + (t.category || ""), group: "Transactions", page: "transactions" }));
    (data.policies || []).forEach((p) => items.push({ label: p.name, sub: "Policy · " + (p.category || ""), group: "Policies", moTool: "policy" }));
    (data.financialAccounts || []).forEach((a) => items.push({ label: a.name, sub: "Account · " + fmtMoney(Number(a.balance) || 0), group: "Financial", page: "financial" }));
    (data.subscriptions || []).forEach((s) => items.push({ label: s.name, sub: "Subscription · " + fmtMoney(Number(s.cost) || 0), group: "Subscriptions", page: "subscriptions" }));
    (data.habits || []).forEach((h) => items.push({ label: h.name, sub: "Habit", group: "Habits", page: "habits" }));
    (data.books || []).forEach((b) => items.push({ label: b.title, sub: "Reading · " + (b.author || b.status || ""), group: "Reading", page: "reading" }));
    (data.savedRecipes || []).forEach((r) => items.push({ label: r.name, sub: "Meal Planning", group: "Meal Planning", page: "mealplanning" }));
    return items;
  }, [data]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.filter((i) => i.group === "Pages");
    const scored = index
      .map((i) => {
        const hay = (i.label + " " + (i.sub || "")).toLowerCase();
        const pos = hay.indexOf(term);
        if (pos === -1) return null;
        // rank: pages first, then earlier matches
        return { i, score: (i.group === "Pages" ? 0 : 1000) + pos };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40)
      .map((x) => x.i);
    return scored;
  }, [q, index]);

  useEffect(() => { setSel(0); }, [q]);

  function activate(item) {
    if (!item) return;
    if (item.page) onNavigate(item.page);
    else if (item.moTool) onOpenMoTool(item.moTool);
    onClose();
  }
  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); activate(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "min(12vh, 80px) 16px 16px", background: "rgba(0,0,0,0.5)" }}
    >
      <div className="v-scroll" style={{ width: "100%", maxWidth: "580px", maxHeight: "70vh", overflow: "hidden", display: "flex", flexDirection: "column", ...cardBackgroundStyle(theme), padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: `1px solid ${theme.divider}` }}>
          <span style={{ color: theme.textMuted, display: "inline-flex" }}><IconSearch size={18} /></span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: theme.text, fontSize: "16px" }}
          />
          <span style={{ fontSize: "11px", color: theme.textFaint, border: `1px solid ${theme.cardBorder}`, borderRadius: "6px", padding: "2px 6px" }}>esc</span>
        </div>
        <div className="v-scroll" style={{ overflowY: "auto", padding: "8px", "--scroll-thumb": theme.divider }}>
          {results.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: theme.textFaint }}>No matches.</div>
          ) : (
            results.map((item, i) => (
              <button
                key={i}
                onMouseEnter={() => setSel(i)}
                onClick={() => activate(item)}
                className="v-btn"
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left", border: "none", borderRadius: "9px", padding: "9px 10px", background: i === sel ? theme.accentSoft : "transparent", color: theme.text }}
              >
                <span style={{ color: theme.accent, display: "inline-flex", flexShrink: 0, width: "16px" }}>{item.icon || <IconSearch size={13} />}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  {item.sub && <span style={{ display: "block", fontSize: "11px", color: theme.textFaint }}>{item.sub}</span>}
                </span>
                {item.group === "Pages" && <span style={{ fontSize: "10.5px", color: theme.textFaint }}>Page</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------------------------------------------------
   APP
---------------------------------------------------------------------- */

function App() {
  const [themeKey, setThemeKey] = usePersistentState(STORAGE_KEYS.theme, "minimal");
  const theme = THEMES[themeKey] || THEMES.minimal;
  useEffect(() => { applyThemeVars(theme); }, [theme]);
  const [page, navigate, quickAction, clearQuickAction] = useHashRoute("home", PAGE_META.map((p) => p.id));
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  // The target page reads quickAction during its own render (e.g. autoOpenWeight)
  // before this clears the hash back to the plain page, so a refresh or share
  // doesn't keep re-triggering the same action. Only real one-shot deep links
  // (Shortcuts/home-screen icons) go here — useHashRoute's "action" is the same
  // field pages with their own persistent hash sub-routes (Fantasy's
  // useFantasySubRoute, "#fantasy/players", "#fantasy/trade-analyzer", ...) read
  // to know which sub-page to show, and those must never get auto-cleared.
  useEffect(() => {
    if (!ONE_SHOT_QUICK_ACTIONS.has(quickAction)) return;
    const t = setTimeout(() => clearQuickAction(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAction]);

  const [fitness, setFitness] = usePersistentState(STORAGE_KEYS.fitness, DEFAULT_FITNESS);
  const [workouts, setWorkouts] = usePersistentState(STORAGE_KEYS.workouts, []);
  const [golf, setGolf] = usePersistentState(STORAGE_KEYS.golf, DEFAULT_GOLF);
  const [golfSimRounds, setGolfSimRounds] = usePersistentState(STORAGE_KEYS.golfSimRounds, DEFAULT_GOLF_ROUNDS);
  const [golfOutdoorRounds, setGolfOutdoorRounds] = usePersistentState(STORAGE_KEYS.golfOutdoorRounds, DEFAULT_GOLF_ROUNDS);
  const [golfScorecards, setGolfScorecards] = usePersistentState(STORAGE_KEYS.golfScorecards, []);
  const [fantasyCheatSheets, setFantasyCheatSheets] = usePersistentState(STORAGE_KEYS.fantasyCheatSheets, DEFAULT_FANTASY_CHEAT_SHEETS);
  const [fantasyCustomRankings, setFantasyCustomRankings] = usePersistentState(STORAGE_KEYS.fantasyCustomRankings, DEFAULT_FANTASY_CUSTOM_RANKINGS);
  const [fantasyWatchlist, setFantasyWatchlist] = usePersistentState(STORAGE_KEYS.fantasyWatchlist, DEFAULT_FANTASY_WATCHLIST);
  const [fantasySleeper, setFantasySleeper] = usePersistentState(STORAGE_KEYS.fantasySleeper, DEFAULT_FANTASY_SLEEPER);
  const [fantasyYahoo, setFantasyYahoo] = usePersistentState(STORAGE_KEYS.fantasyYahoo, DEFAULT_FANTASY_YAHOO);
  const [moLinks, setMoLinks] = usePersistentState(STORAGE_KEYS.moLinks, DEFAULT_MO_LINKS);
  const [pkiReport, setPkiReport] = usePersistentState(STORAGE_KEYS.pkiReport, {});
  const [moSnapshots, setMoSnapshots] = usePersistentState(STORAGE_KEYS.moSnapshots, []);
  const [moPolicies, setMoPolicies] = usePersistentState(STORAGE_KEYS.moPolicies, moDefaultPolicies());
  const [deck, setDeck] = usePersistentState(STORAGE_KEYS.deck, null);
  const [moAppNotice, setMoAppNotice] = usePersistentState(STORAGE_KEYS.appNotice, DEFAULT_APP_NOTICE);
  const [dailyLog, setDailyLog] = usePersistentState(STORAGE_KEYS.dailyLog, DEFAULT_DAILY_LOG);
  const [kev, setKev] = usePersistentState(STORAGE_KEYS.kev, DEFAULT_KEV);
  const [cveWatchlist, setCveWatchlist] = usePersistentState(STORAGE_KEYS.cveWatchlist, []);
  // Which MO tool is open is a property of the URL, not of component state:
  // "#mo" is the dashboard, "#mo/vuln-s1" is a tool. That makes a tool
  // bookmarkable, makes the back button step out of it rather than off the
  // page, and means there is only one place the answer can come from.
  const moTool = page === "mo" && quickAction && MO_TOOL_IDS.includes(quickAction) ? quickAction : null;
  const openMoTool = (id) => navigate(id ? "mo/" + id : "mo");
  const [ravenProducts, setRavenProducts] = usePersistentState(STORAGE_KEYS.ravenProducts, []);
  const [trackers, setTrackers] = usePersistentState(STORAGE_KEYS.trackers, DEFAULT_TRACKERS);
  const [financial, setFinancial] = usePersistentState(STORAGE_KEYS.financial, DEFAULT_FINANCIAL);
  const [events, setEvents] = usePersistentState(STORAGE_KEYS.upcoming, DEFAULT_UPCOMING_EVENTS);
  const [history, setHistory] = usePersistentState(STORAGE_KEYS.history, DEFAULT_HISTORY);
  function recordWeight(value) {
    setHistory((h) => ({ ...h, fitness: pushHistoryPoint(h.fitness, value) }));
  }
  function recordHandicap(value) {
    setHistory((h) => ({ ...h, golf: pushHistoryPoint(h.golf, value) }));
  }
  function recordTracker(id, value) {
    setHistory((h) => ({ ...h, trackers: { ...h.trackers, [id]: pushHistoryPoint(h.trackers[id] || [], value) } }));
  }
  function recordAccount(id, value) {
    setHistory((h) => ({ ...h, accounts: { ...(h.accounts || {}), [id]: pushHistoryPoint((h.accounts && h.accounts[id]) || [], value) } }));
  }
  const [profile, setProfile] = usePersistentState(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const [integrations, setIntegrations] = usePersistentState(STORAGE_KEYS.integrations, DEFAULT_INTEGRATIONS);
  const [watchlist, setWatchlist] = usePersistentState(STORAGE_KEYS.watchlist, DEFAULT_WATCHLIST);
  const [journal, setJournal] = usePersistentState(STORAGE_KEYS.journal, DEFAULT_JOURNAL);
  const [goals, setGoals] = usePersistentState(STORAGE_KEYS.goals, DEFAULT_GOALS);
  const [transactions, setTransactions] = usePersistentState(STORAGE_KEYS.transactions, DEFAULT_TRANSACTIONS);
  const [budgets, setBudgets] = usePersistentState(STORAGE_KEYS.budgets, {});
  const [categoryRules, setCategoryRules] = usePersistentState(STORAGE_KEYS.categoryRules, []);
  const [youtube, setYoutube] = usePersistentState(STORAGE_KEYS.youtube, DEFAULT_YOUTUBE);
  const [sports, setSports] = usePersistentState(STORAGE_KEYS.sports, { cache: {}, fetchedAt: null });
  const [subscriptions, setSubscriptions] = usePersistentState(STORAGE_KEYS.subscriptions, DEFAULT_SUBSCRIPTIONS);
  const [habits, setHabits] = usePersistentState(STORAGE_KEYS.habits, DEFAULT_HABITS);
  const [birthdays, setBirthdays] = usePersistentState(STORAGE_KEYS.birthdays, DEFAULT_BIRTHDAYS);
  const [reading, setReading] = usePersistentState(STORAGE_KEYS.reading, DEFAULT_READING);
  const [movies, setMovies] = usePersistentState(STORAGE_KEYS.movies, { cache: {}, fetchedAt: {} });
  const [feeds, setFeeds] = usePersistentState(STORAGE_KEYS.feeds, { cache: {}, fetchedAt: {} });
  const [resume, setResume] = usePersistentState(STORAGE_KEYS.resume, DEFAULT_RESUME);
  // Per-page banner image overrides, so a photo that stops loading can be
  // swapped from the banner itself rather than by editing the file.
  const [pageImages, setPageImages] = usePersistentState(STORAGE_KEYS.pageImages, {});
  // Which pages actually get opened. The rail uses this to keep the handful
  // you really use above the fold.
  const [pageVisits, setPageVisits] = usePersistentState(STORAGE_KEYS.pageVisits, {});
  useEffect(() => {
    if (!page || page === "home") return;
    setPageVisits((prev) => ({ ...(prev || {}), [page]: ((prev || {})[page] || 0) + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const [showDirectory, setShowDirectory] = useState(false);
  const [homeTileOrder, setHomeTileOrder] = usePersistentState(STORAGE_KEYS.homeTileOrder, []);
  const [games, setGames] = usePersistentState(STORAGE_KEYS.games, DEFAULT_GAMES);
  const [news, setNews] = usePersistentState(STORAGE_KEYS.news, { topics: DEFAULT_NEWS_TOPICS, cache: {}, fetchedAt: null });
  const [lock, setLock] = usePersistentState(STORAGE_KEYS.lock, { enabled: false });
  const [locked, setLocked] = useState(() => {
    try {
      if (sessionStorage.getItem("vantageJustUnlocked")) {
        sessionStorage.removeItem("vantageJustUnlocked");
        return false;
      }
    } catch (e) {}
    return !!lock.enabled;
  });
  async function handleLockNow() {
    if (lock.encrypted && __vaultKey) {
      try {
        const snap = snapshotAllStorage();
        const envelope = await encryptJSON(__vaultKey, snap);
        saveJSON(VAULT_STORAGE_KEY, envelope);
        clearAllStorageExcept([STORAGE_KEYS.theme, STORAGE_KEYS.lock]);
      } catch (e) {
        toast.error("Couldn't encrypt before locking — locked without encrypting this time.");
      }
    }
    __vaultKey = null;
    setLocked(true);
  }
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reminders, setReminders] = usePersistentState(STORAGE_KEYS.reminders, { enabled: false, items: [], eventNotified: {} });
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const newYoutubeCount = useMemo(
    () => (youtube.lastSeenAt ? youtubeVideos.filter((v) => new Date(v.publishedAt).getTime() > youtube.lastSeenAt).length : 0),
    [youtubeVideos, youtube.lastSeenAt]
  );

  const [googleAccounts, setGoogleAccounts] = useState([]);
  function addGoogleAccount(account) {
    setGoogleAccounts((prev) => [...prev, account]);
  }
  function removeGoogleAccount(id) {
    setGoogleAccounts((prev) => prev.filter((a) => a.id !== id));
  }
  const [microsoftEvents, setMicrosoftEvents] = useState([]);
  const allConnectedEvents = useMemo(
    () => [...googleAccounts.flatMap((a) => a.events), ...microsoftEvents],
    [googleAccounts, microsoftEvents]
  );

  const [weather, setWeather] = usePersistentState(STORAGE_KEYS.weather, DEFAULT_WEATHER);
  const [trips, setTrips] = usePersistentState(STORAGE_KEYS.trips, DEFAULT_TRIPS);
  const [mealPlanning, setMealPlanning] = usePersistentState(STORAGE_KEYS.mealPlanning, DEFAULT_MEAL_PLANNING);
  const [lastfm, setLastfm] = usePersistentState(STORAGE_KEYS.lastfm, DEFAULT_LASTFM);
  const [weatherStatus, setWeatherStatus] = useState(null);

  async function loadWeather(lat, lon) {
    try {
      const days = await fetchWeatherDays(lat, lon);
      setWeather({ lat, lon, fetchedAt: Date.now(), days });
      setWeatherStatus(null);
    } catch (err) {
      setWeatherStatus({ type: "error", message: "Couldn't load weather right now." });
    }
  }

  function enableWeather() {
    if (!navigator.geolocation) {
      setWeatherStatus({ type: "error", message: "Location isn't available in this browser." });
      return;
    }
    setWeatherStatus({ type: "loading", message: "Getting your location…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => setWeatherStatus({ type: "error", message: "Location permission denied." })
    );
  }

  useEffect(() => {
    const staleAfter = 3 * 60 * 60 * 1000;
    if (weather.lat != null && (!weather.fetchedAt || Date.now() - weather.fetchedAt > staleAfter)) {
      loadWeather(weather.lat, weather.lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allEvents = useMemo(() => [...events, ...allConnectedEvents], [events, allConnectedEvents]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        if (lock.enabled && locked) return;
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lock.enabled, locked]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    function notify(body) {
      toast.reminder(body, { title: "Reminder", duration: 9000 });
      if (reminders.enabled && Notification.permission === "granted") {
        try { new Notification("BearVantageHub", { body }); } catch (e) {}
      }
    }
    function check() {
      const now = Date.now(); const todayISO = new Date().toISOString().slice(0, 10); let changed = false;
      const items = (reminders.items || []).map((r) => {
        if (r.notified || !r.at || new Date(r.at).getTime() > now) return r;
        notify(r.text);
        changed = true;
        // Repeating reminders roll forward to their next occurrence and stay
        // active; one-off reminders are retired.
        const next = reminderNextAt(r.at, r.repeat, new Date(now));
        return next ? { ...r, at: next, notified: false } : { ...r, notified: true };
      });
      const evNotified = { ...(reminders.eventNotified || {}) };
      (allEvents || []).forEach((e) => { if (e.date === todayISO) { const k = (e.id || e.title) + "|" + e.date; if (!evNotified[k]) { notify("Today: " + e.title); evNotified[k] = true; changed = true; } } });
      if (changed) setReminders((s) => ({ ...s, items, eventNotified: evNotified }));
    }
    check(); const id = setInterval(check, 30000); return () => clearInterval(id);
  }, [reminders, allEvents]);
  const weekAgendaCount = useMemo(() => {
    const isoSet = new Set();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      isoSet.add(d.toISOString().slice(0, 10));
    }
    return allEvents.filter((e) => isoSet.has(e.date)).length;
  }, [allEvents]);
  const suggestions = useMemo(
    () => generateSuggestions({ fitness, golf, trackers, profile, events: allEvents, history, weather, watchlist, newYoutubeCount }),
    [fitness, golf, trackers, profile, allEvents, history, weather, watchlist, newYoutubeCount]
  );

  const [briefingOpen, setBriefingOpen] = useState(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(STORAGE_KEYS.briefingLastShown) !== today;
    } catch (e) {
      return false;
    }
  });

  function dismissBriefing() {
    try {
      localStorage.setItem(STORAGE_KEYS.briefingLastShown, new Date().toISOString().slice(0, 10));
    } catch (e) {
      /* localStorage unavailable — just close in-memory */
    }
    setBriefingOpen(false);
  }

  const doneGoals = goals.filter((g) => g.status === "done").length;
  const pageStats = {
    fitness: { value: fitness.currentWeight, detail: `target ${fitness.targetWeight} lbs` },
    golf: { value: golf.handicap, detail: `${golf.roundsYtd} rounds YTD` },
    financial: {
      value: financial.targetDownPayment
        ? `${Math.min(100, Math.round(((financial.currentSavings || 0) / financial.targetDownPayment) * 100))}%`
        : "—",
      detail: "toward down payment",
    },
    transactions: { value: transactions.length || 0, detail: "logged" },
    upcoming: { value: allEvents.length || 0, detail: "events" },
    agenda: { value: weekAgendaCount || 0, detail: "this week" },
    youtube: { value: newYoutubeCount || youtubeVideos.length || 0, detail: newYoutubeCount ? "new" : "checked" },
    profile: { value: profile.interests.length || 0, detail: "interests" },
    watchlist: { value: watchlist.length || 0, detail: "queued" },
    trackers: { value: trackers.length || 0, detail: "trackers" },
    goals: { value: goals.length ? `${doneGoals}/${goals.length}` : 0, detail: "done" },
    videos: { value: null, detail: "library" },
    journal: { value: journal.length || 0, detail: "entries" },
    fantasy: { value: fantasyWatchlist.length || 0, detail: "watchlist" },
    news: { value: (news.topics || DEFAULT_NEWS_TOPICS).length, detail: "topics" },
    sports: { value: null, detail: "my teams" },
    subscriptions: { value: subscriptions.length ? fmtMoney(subscriptions.reduce((s, x) => s + subPerMonth(x), 0)) : "$0.00", detail: "/mo" },
    securityx: { value: "CAS-005", detail: "exam prep" },
  };

  return (
    <div
      className="v-app"
      style={{
        minHeight: "100vh",
        background: theme.pageBgGradient !== "none" ? theme.pageBgGradient : theme.pageBg,
        color: theme.text,
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <Sidebar
        theme={theme}
        themeKey={themeKey}
        fitness={fitness}
        golf={golf}
        trackers={trackers}
        profile={profile}
        integrations={integrations}
        googleAccounts={googleAccounts}
        onAddGoogleAccount={addGoogleAccount}
        onRemoveGoogleAccount={removeGoogleAccount}
        microsoftEvents={microsoftEvents}
        onMicrosoftEvents={setMicrosoftEvents}
        financial={financial}
        events={events}
        history={history}
        suggestionsCount={suggestions.length}
        upcomingCount={allEvents.length}
        weekAgendaCount={weekAgendaCount}
        watchlist={watchlist}
        journal={journal}
        goals={goals}
        transactions={transactions}
        newYoutubeCount={newYoutubeCount}
        youtube={youtube}
        golfSimRounds={golfSimRounds}
        golfOutdoorRounds={golfOutdoorRounds}
        fantasyCheatSheets={fantasyCheatSheets}
        fantasyCustomRankings={fantasyCustomRankings}
        fantasyWatchlist={fantasyWatchlist}
        fantasySleeper={fantasySleeper}
        fantasyYahoo={fantasyYahoo}
        ravenProducts={ravenProducts}
        lock={lock}
        setLock={setLock}
        onLockNow={handleLockNow}
        onOpenPalette={() => setPaletteOpen(true)}
        reminders={reminders}
        setReminders={setReminders}
        page={page}
        onNavigate={navigate}
        setThemeKey={setThemeKey}
        setFitness={setFitness}
        setGolf={setGolf}
        setTrackers={setTrackers}
        setProfile={setProfile}
        setIntegrations={setIntegrations}
        setFinancial={setFinancial}
        setEvents={setEvents}
        setHistory={setHistory}
        setWatchlist={setWatchlist}
        setJournal={setJournal}
        setGoals={setGoals}
        setTransactions={setTransactions}
        setYoutube={setYoutube}
        setGolfSimRounds={setGolfSimRounds}
        setGolfOutdoorRounds={setGolfOutdoorRounds}
        setFantasyCheatSheets={setFantasyCheatSheets}
        setFantasyCustomRankings={setFantasyCustomRankings}
        setFantasyWatchlist={setFantasyWatchlist}
        setFantasySleeper={setFantasySleeper}
        setFantasyYahoo={setFantasyYahoo}
        setRavenProducts={setRavenProducts}
        habits={habits}
        workouts={workouts}
        reading={reading}
        pageVisits={pageVisits}
        onOpenDirectory={() => setShowDirectory(true)}
      />

      <main className="v-main" id="v-main">
        <PageIdContext.Provider value={page}>
        <div className={"v-container " + containerVariant(page)}>
          <PageBanner theme={theme} page={page} images={pageImages} setImages={setPageImages} />
          <PageErrorBoundary theme={theme} page={page}>
          {page === "home" && (
            <HomeOverview
              theme={theme}
              suggestions={suggestions}
              weather={weather}
              weatherStatus={weatherStatus}
              onEnableWeather={enableWeather}
              onOpenBriefing={() => setBriefingOpen(true)}
              pageStats={pageStats}
              onNavigate={navigate}
              events={allEvents}
              feeds={feeds}
              setFeeds={setFeeds}
              profile={profile}
            />
          )}
          {page === "fitness" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FitnessSection theme={theme} data={fitness} setData={setFitness} history={history.fitness} onRecordWeight={recordWeight} autoOpenWeight={quickAction === "log-weight"} />
              <WorkoutLogSection theme={theme} workouts={workouts} setWorkouts={setWorkouts} />
            </div>
          )}
          {page === "golf" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <GolfSection theme={theme} data={golf} setData={setGolf} history={history.golf} onRecordHandicap={recordHandicap} />
              <LazyGolfExtras
                theme={theme}
                golfScorecards={golfScorecards}
                setGolfScorecards={setGolfScorecards}
                golfSimRounds={golfSimRounds}
                setGolfSimRounds={setGolfSimRounds}
                golfOutdoorRounds={golfOutdoorRounds}
                setGolfOutdoorRounds={setGolfOutdoorRounds}
              />
            </div>
          )}
          {page === "fantasy" && (
            <LazyFantasySection
              theme={theme}
              cheatSheets={fantasyCheatSheets}
              setCheatSheets={setFantasyCheatSheets}
              customRankings={fantasyCustomRankings}
              setCustomRankings={setFantasyCustomRankings}
              watchlist={fantasyWatchlist}
              setWatchlist={setFantasyWatchlist}
              sleeper={fantasySleeper}
              setSleeper={setFantasySleeper}
              yahoo={fantasyYahoo}
              setYahoo={setFantasyYahoo}
            />
          )}
          {page === "financial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FinancialSection theme={theme} data={financial} setData={setFinancial} />
              <FinancialAccountsSection theme={theme} data={financial} setData={setFinancial} accountHistory={history.accounts} onRecordAccount={recordAccount} />
              <InvestmentHoldingsSection theme={theme} data={financial} setData={setFinancial} />
            </div>
          )}
          {page === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TransactionsSection theme={theme} transactions={transactions} setTransactions={setTransactions} categoryOptions={[]} delay={0} autoFocusAdd={quickAction === "add"} categoryRules={categoryRules} setCategoryRules={setCategoryRules} />
              <BudgetEnvelopesSection theme={theme} transactions={transactions} budgets={budgets} setBudgets={setBudgets} />
            </div>
          )}
          {page === "upcoming" && (
            <UpcomingSection theme={theme} events={events} setEvents={setEvents} connectedEvents={allConnectedEvents} />
          )}
          {page === "weather" && (
            <WeatherPage theme={theme} weather={weather} weatherStatus={weatherStatus} onEnableWeather={enableWeather} />
          )}
          {page === "travel" && <TravelPage theme={theme} trips={trips} setTrips={setTrips} />}
          {page === "agenda" && <AgendaStripSection theme={theme} events={allEvents} delay={0} />}
          {page === "youtube" && (
            <YouTubeSection
              theme={theme}
              integrations={integrations}
              setIntegrations={setIntegrations}
              videos={youtubeVideos}
              onVideos={setYoutubeVideos}
              youtubeState={youtube}
              setYoutubeState={setYoutube}
              delay={0}
            />
          )}
          {page === "music" && <MusicPage theme={theme} state={lastfm} setState={setLastfm} />}
          {page === "profile" && <ProfileSection theme={theme} profile={profile} setProfile={setProfile} />}
          {page === "watchlist" && (
            <WatchQueueSection theme={theme} watchlist={watchlist} setWatchlist={setWatchlist} genres={profile.genres} delay={0} />
          )}
          {page === "trackers" && (
            <CustomTrackersSection
              theme={theme}
              trackers={trackers}
              setTrackers={setTrackers}
              trackerHistory={history.trackers}
              onRecordTracker={recordTracker}
            />
          )}
          {page === "goals" && <GoalsBoardSection theme={theme} data={goals} setData={setGoals} delay={0} />}
          {page === "videos" && <VideoLibrarySection theme={theme} integrations={integrations} setIntegrations={setIntegrations} />}
          {page === "journal" && <JournalSection theme={theme} data={journal} setData={setJournal} delay={0} />}
          {page === "habits" && <HabitsSection theme={theme} state={habits} setState={setHabits} />}
          {page === "mealplanning" && <MealPlanningPage theme={theme} state={mealPlanning} setState={setMealPlanning} />}
          {page === "resume" && <ResumeSectionPage theme={theme} data={resume} setData={setResume} />}
          {page === "birthdays" && <BirthdaysSection theme={theme} state={birthdays} setState={setBirthdays} />}
          {page === "reading" && <ReadingSection theme={theme} state={reading} setState={setReading} />}
          {page === "movies" && (
            <>
              <MovieWatchSuggestions theme={theme} profile={profile} watchlist={watchlist} setWatchlist={setWatchlist} />
              <FeedSection
                theme={theme}
                state={feeds}
                setState={setFeeds}
                categories={FEED_CATEGORIES.filter((c) => c.group === "screen")}
                title="Movies & TV"
                icon={<IconClapper />}
                intro="Release dates, casting, box office, premieres, renewals and cancellations."
              />
            </>
          )}
          {page === "gaming" && (
            <FeedSection
              theme={theme}
              state={feeds}
              setState={setFeeds}
              categories={FEED_CATEGORIES.filter((c) => c.group === "gaming")}
              title="Gaming"
              icon={<IconGamepad />}
              intro="Releases, reveals, studio news and esports."
            />
          )}
          {page === "games" && <GamesSection theme={theme} state={games} setState={setGames} />}
          {page === "news" && (
            <FeedSection
              theme={theme}
              state={feeds}
              setState={setFeeds}
              categories={FEED_CATEGORIES.filter((c) => c.group === "news")}
              title="Headlines"
              icon={<IconNews />}
              intro="World, national, business, science, sports and cybersecurity headlines, refreshed on demand."
            />
          )}
          {page === "sports" && <SportsSection theme={theme} state={sports} setState={setSports} />}
          {page === "subscriptions" && <SubscriptionsSection theme={theme} subs={subscriptions} setSubs={setSubscriptions} />}
          {page === "mo" && (
            moTool ? (
              <LazyMoModals
                theme={theme}
                moTool={moTool}
                openMoTool={openMoTool}
                moSnapshots={moSnapshots}
                setMoSnapshots={setMoSnapshots}
                pkiReport={pkiReport}
                setPkiReport={setPkiReport}
                moPolicies={moPolicies}
                setMoPolicies={setMoPolicies}
                deck={deck}
                setDeck={setDeck}
                moAppNotice={moAppNotice}
                setMoAppNotice={setMoAppNotice}
                dailyLog={dailyLog}
                setDailyLog={setDailyLog}
                kev={kev}
                setKev={setKev}
                cveWatchlist={cveWatchlist}
                setCveWatchlist={setCveWatchlist}
              />
            ) : (
              <MoDashboard
                theme={theme}
                snapshots={moSnapshots}
                policies={moPolicies}
                dailyLog={dailyLog}
                cveWatchlist={cveWatchlist}
                appNotice={moAppNotice}
                links={moLinks}
                setLinks={setMoLinks}
                onOpenTool={openMoTool}
              />
            )
          )}
          {page === "securityx" && <LazySecurityXSection theme={theme} />}
          {page === "ravenseye" && (
            <LazyRavenSection theme={theme} products={ravenProducts} setProducts={setRavenProducts} />
          )}
          {page === "jobsearch" && <LazyJobSearchPage theme={theme} resume={resume} />}
          </PageErrorBoundary>
        </div>
        </PageIdContext.Provider>
      </main>

      <ToastHost theme={theme} />

      {lock.enabled && locked && (
        <LockScreen theme={theme} lock={lock} onUnlock={() => setLocked(false)} />
      )}

      {paletteOpen && !(lock.enabled && locked) && (
        <CommandPalette
          theme={theme}
          data={{
            journal, watchlist, goals, trackers, events: allEvents, transactions, policies: moPolicies,
            financialAccounts: financial.accounts, subscriptions, habits: habits.items, books: reading.books, savedRecipes: mealPlanning.savedRecipes,
          }}
          onNavigate={navigate}
          onOpenMoTool={openMoTool}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {showDirectory && !(lock.enabled && locked) && (
        <AllPagesDirectory
          theme={theme}
          page={page}
          pageVisits={pageVisits}
          onNavigate={navigate}
          onOpenMoTool={openMoTool}
          onClose={() => setShowDirectory(false)}
        />
      )}

      {briefingOpen && suggestions.length > 0 && (
        <BriefingModal theme={theme} suggestions={suggestions} weather={weather} onClose={dismissBriefing} />
      )}
    </div>
  );
}


function MoModalLoadingOverlay({ theme, error, onRetry, onClose }) {
  const panelRef = useRef(null);
  useOverlayBehaviour(onClose, panelRef);
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10,10,14,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{ background: theme.cardBg, borderRadius: theme.cardRadius, padding: "28px 32px", minWidth: "260px", maxWidth: "340px", textAlign: "center", boxShadow: theme.cardShadow }}
        onClick={(e) => e.stopPropagation()}
      >
        {error ? (
          <>
            <div style={{ color: theme.danger, fontWeight: 700, marginBottom: "8px" }}>Couldn't load this tool</div>
            <div style={{ color: theme.textFaint, fontSize: "13px", marginBottom: "16px" }}>{error}</div>
            <button
              className="v-btn"
              style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700, padding: "8px 16px", borderRadius: "8px" }}
              onClick={onRetry}
            >
              Try again
            </button>
          </>
        ) : (
          <div style={{ color: theme.textMuted, fontSize: "13px" }}>Loading…</div>
        )}
      </div>
    </div>
  );
}

// The Mechanical Orchard security-tooling suite (Vulnerability Analyzer, PKI
// report generator, policy tracker, deck builder, and the rest) plus the
// SecurityX study tool now ship as one shared chunk (see loadChunk()/
// window.__v near the bottom of this file) instead of every page's bundle —
// same rationale as Raven's Eye and Golf. Only the tools themselves, opened
// on demand, are lazy-loaded; MoDashboard (the "#mo" landing page) is core so
// it renders instantly. Rendered wrapped in <MoEmbedContext.Provider
// value={true}> — every modal inside opens as a plain page panel, not a
// portal dialog, because it's a tool on the Mechanical Orchard page now, not
// an overlay floating above whatever page you were on.
function LazyMoModals({
  theme, moTool, openMoTool,
  moSnapshots, setMoSnapshots,
  pkiReport, setPkiReport,
  moPolicies, setMoPolicies,
  deck, setDeck,
  moAppNotice, setMoAppNotice,
  dailyLog, setDailyLog,
  kev, setKev,
  cveWatchlist, setCveWatchlist,
}) {
  const [mod, setMod] = useState(() => (window.__vChunks && window.__vChunks.mechanicalorchard) ? window.__vChunks.mechanicalorchard : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("mechanicalorchard", "chunk-mechanicalorchard.js").then(setMod).catch((err) => setError(err.message || "Couldn't load this tool."));
  }

  useEffect(() => {
    if (!moTool || mod) return;
    let cancelled = false;
    loadChunk("mechanicalorchard", "chunk-mechanicalorchard.js")
      .then((m) => { if (!cancelled) setMod(m); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load this tool."); });
    return () => { cancelled = true; };
  }, [moTool, mod]);

  if (!moTool) return null;

  // A separate component so useOverlayBehaviour (Escape/focus-trap/scroll-lock)
  // only runs for the lifetime of this placeholder — LazyMoModals itself is
  // always mounted (so the hook would fire, and re-lock scroll, on every
  // App() render regardless of whether a tool is even open, which is exactly
  // what broke page scrolling everywhere until this was split out).
  if (!mod) {
    return <MoModalLoadingOverlay theme={theme} error={error} onRetry={attemptLoad} onClose={() => openMoTool(null)} />;
  }

  const {
    VulnerabilityAnalyzerModal, PkiReportModal, PolicyTrackerModal, DeckBuilderModal,
    AppNoticeModal, DailyLogModal, KevLookupModal, VulnTrendModal, SecurityToolkitModal,
    PhishHeaderModal, CveWatchlistModal, PasswordBreachModal,
  } = mod;

  return (
    <MoEmbedContext.Provider value={true}>
      {(moTool === "vuln-s1" || moTool === "vuln-iru") && (
        <VulnerabilityAnalyzerModal
          theme={theme}
          initialSource={moTool === "vuln-iru" ? "iru" : "s1"}
          snapshots={moSnapshots}
          setSnapshots={setMoSnapshots}
          onClose={() => openMoTool(null)}
        />
      )}
      {moTool === "pki" && (
        <PkiReportModal theme={theme} values={pkiReport} setValues={setPkiReport} onClose={() => openMoTool(null)} />
      )}
      {moTool === "policy" && (
        <PolicyTrackerModal theme={theme} policies={moPolicies} setPolicies={setMoPolicies} onClose={() => openMoTool(null)} />
      )}
      {moTool === "deck" && (
        <DeckBuilderModal theme={theme} deck={deck} setDeck={setDeck} snapshots={moSnapshots} onClose={() => openMoTool(null)} />
      )}
      {moTool === "appnotice" && (
        <AppNoticeModal theme={theme} state={moAppNotice} setState={setMoAppNotice} onClose={() => openMoTool(null)} />
      )}
      {moTool === "dailylog" && (
        <DailyLogModal theme={theme} snapshots={moSnapshots} notices={(moAppNotice && moAppNotice.history) || []} policies={moPolicies} state={dailyLog} setState={setDailyLog} onClose={() => openMoTool(null)} />
      )}
      {moTool === "kev" && (
        <KevLookupModal theme={theme} state={kev} setState={setKev} onClose={() => openMoTool(null)} />
      )}
      {moTool === "vulntrend" && (
        <VulnTrendModal theme={theme} snapshots={moSnapshots} onClose={() => openMoTool(null)} />
      )}
      {moTool === "toolkit" && (
        <SecurityToolkitModal theme={theme} onClose={() => openMoTool(null)} />
      )}
      {moTool === "phish" && (
        <PhishHeaderModal theme={theme} onClose={() => openMoTool(null)} />
      )}
      {moTool === "cve-watch" && (
        <CveWatchlistModal theme={theme} watchlist={cveWatchlist} setWatchlist={setCveWatchlist} onClose={() => openMoTool(null)} />
      )}
      {moTool === "pwned-pw" && (
        <PasswordBreachModal theme={theme} onClose={() => openMoTool(null)} />
      )}
    </MoEmbedContext.Provider>
  );
}

function LazySecurityXSection({ theme }) {
  const [mod, setMod] = useState(() => (window.__vChunks && window.__vChunks.mechanicalorchard) ? window.__vChunks.mechanicalorchard : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("mechanicalorchard", "chunk-mechanicalorchard.js").then(setMod).catch((err) => setError(err.message || "Couldn't load SecurityX."));
  }

  useEffect(() => {
    if (mod) return;
    let cancelled = false;
    loadChunk("mechanicalorchard", "chunk-mechanicalorchard.js")
      .then((m) => { if (!cancelled) setMod(m); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load SecurityX."); });
    return () => { cancelled = true; };
  }, [mod]);

  if (error) {
    return (
      <EmptyState
        theme={theme}
        art="search"
        title="Couldn't load SecurityX"
        message={error}
        action={
          <button
            className="v-btn"
            style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700 }}
            onClick={attemptLoad}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (!mod) {
    return <EmptyState theme={theme} art="search" title="Loading SecurityX…" />;
  }
  const { SecurityXSection } = mod;
  return <SecurityXSection theme={theme} />;
}

function LazyJobSearchPage({ theme, resume }) {
  const [mod, setMod] = useState(() => (window.__vChunks && window.__vChunks.jobsearch) ? window.__vChunks.jobsearch : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("jobsearch", "chunk-jobsearch.js").then(setMod).catch((err) => setError(err.message || "Couldn't load Job Search."));
  }

  useEffect(() => {
    if (mod) return;
    let cancelled = false;
    loadChunk("jobsearch", "chunk-jobsearch.js")
      .then((m) => { if (!cancelled) setMod(m); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load Job Search."); });
    return () => { cancelled = true; };
  }, [mod]);

  if (error) {
    return (
      <EmptyState
        theme={theme}
        art="search"
        title="Couldn't load Job Search"
        message={error}
        action={
          <button
            className="v-btn"
            style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700 }}
            onClick={attemptLoad}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (!mod) {
    return <EmptyState theme={theme} art="search" title="Loading Job Search…" />;
  }
  const { JobSearchPage } = mod;
  return <JobSearchPage theme={theme} resume={resume} />;
}

// Raven's Eye now ships as its own chunk (see loadChunk()/window.__v near
// the bottom of this file) instead of being part of every page's bundle.
// This wrapper triggers the load the first time the page is opened, holds
// the resolved component in state once it lands (a plain <script> tag has
// no import() of its own to await, so this is the bridge), and renders a
// lightweight placeholder for the one-time fetch in between.
function LazyRavenSection({ theme, ...rest }) {
  const [Comp, setComp] = useState(() => (window.__vChunks && window.__vChunks.ravenseye) ? window.__vChunks.ravenseye.RavenSection : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("ravenseye", "chunk-ravenseye.js")
      .then((mod) => setComp(() => mod.RavenSection))
      .catch((err) => setError(err.message || "Couldn't load Raven's Eye."));
  }

  useEffect(() => {
    if (Comp) return;
    let cancelled = false;
    loadChunk("ravenseye", "chunk-ravenseye.js")
      .then((mod) => { if (!cancelled) setComp(() => mod.RavenSection); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load Raven's Eye."); });
    return () => { cancelled = true; };
  }, [Comp]);

  if (error) {
    return (
      <EmptyState
        theme={theme}
        art="search"
        title="Couldn't load Raven's Eye"
        message={error}
        action={
          <button
            className="v-btn"
            style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700 }}
            onClick={attemptLoad}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (!Comp) {
    return <EmptyState theme={theme} art="search" title="Loading Raven's Eye…" />;
  }
  return <Comp theme={theme} {...rest} />;
}

// The Fantasy tab (Sleeper/Yahoo data + trade analyzer + mock draft + cheat
// sheets, ported from "The War Room") ships as its own chunk for the same
// reason as Raven's Eye above — same load/error/placeholder shape.
function LazyFantasySection(props) {
  const { theme } = props;
  const [Comp, setComp] = useState(() => (window.__vChunks && window.__vChunks.fantasy) ? window.__vChunks.fantasy.FFPage : null);
  const [error, setError] = useState(null);

  function attemptLoad() {
    setError(null);
    loadChunk("fantasy", "chunk-fantasy.js")
      .then((mod) => setComp(() => mod.FFPage))
      .catch((err) => setError(err.message || "Couldn't load Fantasy."));
  }

  useEffect(() => {
    if (Comp) return;
    let cancelled = false;
    loadChunk("fantasy", "chunk-fantasy.js")
      .then((mod) => { if (!cancelled) setComp(() => mod.FFPage); })
      .catch((err) => { if (!cancelled) setError(err.message || "Couldn't load Fantasy."); });
    return () => { cancelled = true; };
  }, [Comp]);

  if (error) {
    return (
      <EmptyState
        theme={theme}
        art="search"
        title="Couldn't load Fantasy"
        message={error}
        action={
          <button
            className="v-btn"
            style={{ color: theme.accent, background: "transparent", border: `1px solid ${theme.cardBorder}`, fontWeight: 700 }}
            onClick={attemptLoad}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (!Comp) {
    return <EmptyState theme={theme} art="search" title="Loading Fantasy…" />;
  }
  return <Comp {...props} />;
}

/* ----------------------------------------------------------------------
   LAZY-LOADED PAGE CHUNKS

   This script is one IIFE with everything closed over everything else, so a
   page chunk compiled as a separate file/IIFE (see build.js) can't reach
   these functions/consts by ordinary lexical scoping. window.__v is the
   bridge: core exposes what chunks need to read here, and a chunk exposes
   what core needs to render via window.__vChunks (set at the bottom of the
   chunk's own file). loadChunk() injects the chunk's <script> tag on first
   use and caches the result, same pattern as the other lazy-loaded
   libraries in this file (loadFflate, loadMsal, etc.) — just for this
   app's own code instead of a third-party one.
---------------------------------------------------------------------- */
window.__v = {
  loadPdfJs,
  moDownload,
  vantageIsDarkTheme,
  IconRavenEye,
  RAVEN_THREAT_MODEL_STATUS,
  RAVEN_PENTEST_STATUS,
  RAVEN_FINDING_STATUS,
  RAVEN_SEVERITY,
  ravenEmptyThreatModel,
  ravenEmptyPenTest,
  ravenLoadPdfMake,
  Card,
  EmptyState,
  SectionLabel,
  IconClose,
  IconGolf,
  convertHeicIfNeeded,
  dbDeletePhoto,
  dbGetPhotosByIds,
  dbPutPhoto,
  DEFAULT_APP_NOTICE,
  DEFAULT_DAILY_LOG,
  DEFAULT_KEV,
  IconCertificate,
  IconClipboard,
  IconDeck,
  IconEnvelope,
  IconMegaphone,
  IconShield,
  IconWrench,
  MoButton,
  STORAGE_KEYS,
  cardBackgroundStyle,
  formatBytes,
  moDefaultPolicies,
  moFormatTs,
  saveJSON,
  timeAgo,
  truncate,
  usePersistentState,
  useOverlayBehaviour,
  MoEmbedContext,
  toast,
  IconBookOpen,
  IconBulb,
  IconChecklist,
  IconLock,
  IconShare,
  IconTrendingUp,
  IconUpload,
  IconBriefcase,
  MO_SEVERITY_ORDER,
  MO_SOURCE_HINTS,
  moFindingKeyOf,
  moDiffFindings,
  focusField,
  toastUndo,
  Segmented,
};
window.__vChunks = window.__vChunks || {};
window.__vChunkPromises = {};
function loadChunk(name, src) {
  if (window.__vChunks[name]) return Promise.resolve(window.__vChunks[name]);
  if (window.__vChunkPromises[name]) return window.__vChunkPromises[name];
  window.__vChunkPromises[name] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => {
      if (window.__vChunks[name]) resolve(window.__vChunks[name]);
      else {
        window.__vChunkPromises[name] = null;
        reject(new Error("This page's code failed to load."));
      }
    };
    s.onerror = () => {
      window.__vChunkPromises[name] = null;
      reject(new Error("Couldn't load this page (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__vChunkPromises[name];
}

// Custom hover tooltips for icon-only buttons. Swaps `title` for `data-tip`
// on hover/focus-in so the CSS pill (index.shell.html) can render it via
// content: attr(data-tip) — and so the browser's own slow, unstyled title
// tooltip never gets a chance to show up alongside it. composedPath()[0]
// rather than e.target: mouseover/mouseout/focusin/focusout are composed
// events, so this one document-level listener also catches elements inside
// Fantasy's and Raven's Eye's shadow roots (each of which layers its own
// copy of the tooltip CSS on top, since shadow DOM doesn't inherit this
// document's <style>).
function initTooltipDelegation() {
  function show(e) {
    const el = e.composedPath()[0].closest && e.composedPath()[0].closest("[title]");
    if (!el) return;
    el.setAttribute("data-tip", el.getAttribute("title"));
    el.removeAttribute("title");
  }
  function hide(e) {
    const el = e.composedPath()[0].closest && e.composedPath()[0].closest("[data-tip]");
    if (!el) return;
    el.setAttribute("title", el.getAttribute("data-tip"));
    el.removeAttribute("data-tip");
  }
  document.addEventListener("mouseover", show);
  document.addEventListener("mouseout", hide);
  document.addEventListener("focusin", show);
  document.addEventListener("focusout", hide);
}
initTooltipDelegation();

runMigrations();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
