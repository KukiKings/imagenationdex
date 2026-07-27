import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function requireText(file, pattern, label) {
  const source = read(file);
  if (!pattern.test(source)) failures.push(`${file}: ${label}`);
}

function forbidText(file, pattern, label) {
  const source = read(file);
  if (pattern.test(source)) failures.push(`${file}: ${label}`);
}

const core = "siindex-speak-core.js";
requireText(core, /version:\s*"3\.0\.0"/, "website voice core v3 is missing");
requireText(core, /siindex-website-runtime/, "website runtime endpoint is missing");
requireText(core, /siindex-website-transcribe/, "website transcription endpoint is missing");
requireText(core, /siindex-website-voice-tts/, "website voice endpoint is missing");
requireText(core, /window\.SpeechRecognition = SIINDEXSpeechRecognition/, "legacy microphone bridge is missing");
requireText(core, /navigator\.mediaDevices\.getUserMedia/, "MediaRecorder capture is missing");
forbidText(core, /x-siindex-test-mode|qa_window_closed/, "temporary QA gate remains");

const directCorePages = [
  "home-v2.html",
  "siindex-chat.html",
  "siindex-voice-interface.html",
  "siindex-avatar.html",
  "siindex-voice-terminal.html",
];
for (const file of directCorePages) {
  requireText(file, /<script src="siindex-speak-core\.js"><\/script>/, "shared voice core is not loaded");
}

const earlyBridgePages = [
  "home-v3.html",
  "search.html",
  "pag.html",
  "siindex-command-center.html",
  "siindex-voice-command-os.html",
  "voice-wallet.html",
];
for (const file of earlyBridgePages) {
  const source = read(file);
  const coreAt = source.indexOf('<script src="siindex-speak-core.js"></script>');
  const speechAt = source.search(/SpeechRecognition|webkitSpeechRecognition/);
  if (coreAt < 0 || speechAt < 0 || coreAt > speechAt) {
    failures.push(`${file}: shared bridge must load before the legacy microphone constructor`);
  }
}

requireText("home-v2.html", /window\.SIINDEXVoice\.listen\(\{ source: 'homepage' \}\)/, "homepage microphone is not routed through the core");
requireText("siindex-chat.html", /window\.SIINDEXVoice\.listen\(\{ source: 'chat-page' \}\)/, "chat microphone is not routed through the core");
forbidText("home-v2.html", /Google's servers|webkitSpeechRecognition|SpeechRecognition/, "homepage still contains the retired Google speech path");

const functions = [
  "supabase/functions/siindex-website-runtime/index.ts",
  "supabase/functions/siindex-website-transcribe/index.ts",
  "supabase/functions/siindex-website-voice-tts/index.ts",
];
for (const file of functions) {
  requireText(file, /host === "imagenationdex\.com"/, "production origin is not allowed");
  requireText(file, /x-siindex-provider-consent/, "provider consent gate is missing");
  requireText(file, /visitorHash/, "visitor rate-limit identity is missing");
  forbidText(file, /QA_EXPIRES_AT|x-siindex-test-mode/, "temporary QA restriction remains");
}

if (failures.length) {
  console.error("SIINDEX voice verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SIINDEX voice verification passed (${directCorePages.length + earlyBridgePages.length} microphone surfaces, 3 production functions).`);
