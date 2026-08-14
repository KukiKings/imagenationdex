import * as context from "./context.mjs";
import * as voice from "./voice.mjs";
import * as ops from "./ops.mjs";
import * as verify from "./verify.mjs";
import * as media from "./media.mjs";
import * as knowledge from "./knowledge.mjs";
import * as policy_gate from "./policy_gate.mjs";
import * as evidence from "./evidence.mjs";

export const agents = {
  context: context.run,
  voice: voice.run,
  ops: ops.run,
  verify: verify.run,
  media: media.run,
  knowledge: knowledge.run,
  policy_gate: policy_gate.run,
  evidence: evidence.run,
};
