import * as context from "./context.mjs";
import * as voice from "./voice.mjs";
import * as ops from "./ops.mjs";
import * as verify from "./verify.mjs";
import * as media from "./media.mjs";
import * as knowledge from "./knowledge.mjs";
import * as policy_gate from "./policy_gate.mjs";
import * as evidence from "./evidence.mjs";
import * as media_director from "./media_director.mjs";
import * as script from "./script.mjs";
import * as fact_verifier from "./fact_verifier.mjs";
import * as content_atomizer from "./content_atomizer.mjs";
import * as media_qa from "./media_qa.mjs";

export const agents = {
  context: context.run,
  voice: voice.run,
  ops: ops.run,
  verify: verify.run,
  media: media.run,
  knowledge: knowledge.run,
  policy_gate: policy_gate.run,
  evidence: evidence.run,
  media_director: media_director.run,
  script: script.run,
  fact_verifier: fact_verifier.run,
  content_atomizer: content_atomizer.run,
  media_qa: media_qa.run,
};
