/**
 * SIINDEX agent entry (filesystem-first / EVE-style scaffold)
 * Runtime today: website + siindex-m2m. This file is the canonical config map.
 */
export const siindexAgent = {
  id: "siindex",
  brand: "IN$DEX",
  soul: "./SOUL.md",
  instructions: "./instructions.md",
  agents: "./AGENTS.md",
  pronunciation: "Syn-dex",
  phoneticTts: "Sinn-dex",
  mode: "visitor", // accounts/payments not live
  model: process.env.SIINDEX_MODEL || "runtime-default",
  gates: {
    funds: false,
    keys: false,
    publish: "aj",
    deploy: "aj",
  },
  channels: ["web-chat", "voice"],
  subagents: ["context", "voice", "media", "ops", "verify"],
} as const;

export default siindexAgent;
