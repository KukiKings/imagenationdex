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
requireText(core, /version:\s*"3\.1\.0"/, "website voice core v3.1 is missing");
requireText(core, /siindex-website-runtime/, "website runtime endpoint is missing");
requireText(core, /siindex-website-transcribe/, "website transcription endpoint is missing");
requireText(core, /siindex-website-voice-tts/, "website voice endpoint is missing");
requireText(core, /window\.SpeechRecognition = SIINDEXSpeechRecognition/, "legacy microphone bridge is missing");
requireText(core, /navigator\.mediaDevices\.getUserMedia/, "MediaRecorder capture is missing");
requireText(core, /function normalizeAssistantText\(text\)/, "assistant text normalization is missing");
requireText(core, /code === "microphone_not_supported"/, "typed fallback guidance for unsupported microphones is missing");
requireText(core, /VOICE_REQUEST_TIMEOUT_MS = 30_000/, "voice preparation timeout is missing");
requireText(core, /BUSY_RECOVERY_TIMEOUT_MS = 60_000/, "stale-session recovery timeout is missing");
requireText(core, /The previous session timed out\. SIINDEX reset and is ready\./, "stale-session reset path is missing");
requireText(core, /const SESSION_STATES = new Set/, "session state machine is missing");
requireText(core, /function resetSession\(message\)/, "non-destructive session reset is missing");
requireText(core, /getHistory\(\) \{\s*return getHistory\(\)\.map/, "read-only conversation continuity bridge is missing");
requireText(core, /data-si-reset>Reset session</, "visible session reset control is missing");
requireText(core, /audioTrack\.readyState !== "live"/, "live microphone-track validation is missing");
requireText(core, /code === "NotReadableError"/, "busy microphone-device guidance is missing");
forbidText(core, /x-siindex-test-mode|qa_window_closed/, "temporary QA gate remains");
forbidText(core, /seed phrase/i, "legacy wallet-recovery terminology remains in the voice core");

const normalizeMatch = read(core).match(
  /function normalizeAssistantText\(text\) \{([\s\S]*?)\n  \}/,
);
if (normalizeMatch) {
  const normalizeAssistantText = new Function("text", normalizeMatch[1]);
  const normalized = normalizeAssistantText(
    "## **LIVE**\n> Use `Type Instead`\n[Website](https://imagenationdex.com/)",
  );
  if (normalized !== "LIVE\nUse Type Instead\nWebsite") {
    failures.push("siindex-speak-core.js: assistant text normalization does not remove spoken Markdown");
  }
}

const directCorePages = [
  "public-home.html",
  "home-v2.html",
  "siindex-chat.html",
  "siindex-voice-interface.html",
  "siindex-avatar.html",
  "siindex-voice-terminal.html",
];
for (const file of directCorePages) {
  requireText(file, /<script src="\/?siindex-speak-core\.js"><\/script>/, "shared voice core is not loaded");
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
requireText("public-home.html", /siindex-presence-core\.js/, "approved public presence controller is not loaded");
requireText("siindex-presence-core.js", /window\.SIINDEXVoice\.listen\(\{ source: "public-home" \}\)/, "approved public microphone is not routed through the core");
requireText("siindex-presence-core.js", /window\.SIINDEXVoice\.interrupt\(\)/, "approved public interruption control is missing");
requireText("siindex-chat.html", /window\.SIINDEXVoice\.listen\(\{ source: 'chat-page' \}\)/, "chat microphone is not routed through the core");
forbidText("home-v2.html", /Google's servers|webkitSpeechRecognition|SpeechRecognition/, "homepage still contains the retired Google speech path");
forbidText(core, /Sighn-dex/, "retired SIINDEX pronunciation remains in the voice core");

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
requireText("supabase/functions/siindex-website-runtime/index.ts", /founder-selected launch and genesis reference/, "founder-selected USD $0.24 launch reference is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /function stripMarkdown\(text: string\)/, "server-side plain-text enforcement is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /function safeCut\(buffer: string, index: number\)/, "split-marker protection is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /function flushIndex\(buffer: string\)/, "stable streaming boundary is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /Website Visitor Mode has no phone-call channel/, "unsupported phone-call capability is not explicitly prohibited");
requireText("supabase/functions/siindex-website-runtime/index.ts", /function enforceVerifiedChannels\(text: string\)/, "deterministic communication-channel verification is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /The only verified SIINDEX communication channels are typed chat/, "verified communication-channel allowlist is missing");
forbidText("supabase/functions/siindex-website-runtime/index.ts", /\$0\.36\b/, "retired USD $0.36 launch figure remains");

const channelMatch = read("supabase/functions/siindex-website-runtime/index.ts").match(
  /function enforceVerifiedChannels\(text: string\): string \{([\s\S]*?)\n\}/,
);
if (channelMatch) {
  const enforceVerifiedChannels = new Function("text", channelMatch[1]);
  const corrected = enforceVerifiedChannels(
    "Visitors can talk to SIINDEX through typed chat, phone call, or spoken reply.",
  );
  if (corrected !== "Website Visitor Mode is available only through typed chat and the website microphone.") {
    failures.push("siindex-website-runtime: unsupported affirmative phone-call claim is not corrected");
  }
  const accurateNegative = "Phone calls are not available.";
  if (enforceVerifiedChannels(accurateNegative) !== accurateNegative) {
    failures.push("siindex-website-runtime: accurate negative channel statements are being rewritten");
  }
}

if (failures.length) {
  console.error("SIINDEX voice verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SIINDEX voice verification passed (${directCorePages.length + earlyBridgePages.length} microphone surfaces, 3 production functions).`);
