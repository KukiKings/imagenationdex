import * as context from "./context.mjs";
import * as voice from "./voice.mjs";
import * as ops from "./ops.mjs";
import * as verify from "./verify.mjs";
import * as media from "./media.mjs";

export const agents = {
  context: context.run,
  voice: voice.run,
  ops: ops.run,
  verify: verify.run,
  media: media.run,
};
