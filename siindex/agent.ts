/**
 * SIINDEX agent entry (filesystem-first scaffold)
 * Runtime today: website + siindex-m2m. This file is the config map.
 */
export const siindexAgent = {
  id: "siindex",
  brand: "IN$DEX",
  soul: "./SOUL.md",
  instructions: "./instructions.md",
  agents: "./AGENTS.md",
  /** Public spoken form — matches TTS rewrite and knowledge layer */
  pronunciation: "Sinn-dex",
  phoneticTts: "Sinn-dex",
  knowledgePublic: "../js/siindex-public-knowledge.js",
  liveStatusSkill: "./skills/live-status.md",
  liveStatusMap: "../siindex-public/live-status.json",
  knowledgeMinVersion: "1.5.0",
  mode: "visitor", // accounts/payments not live
  model: process.env.SIINDEX_MODEL || "runtime-default",
  authority: {
    soul: 1,
    liveStatus: 2,
    publicKnowledge: 3,
    bridgeGuard: 4,
  },
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
