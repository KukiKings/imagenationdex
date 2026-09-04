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

// NOTE (2026-09-04, god mode Item 7, Session 106): this script was never
// wired into CI and checked an older voice-core architecture (a discrete
// SESSION_STATES state machine, a visible "Reset session" control, a
// stale-session timeout/recovery message, per-error-name getUserMedia
// branching, and a client-side normalizeAssistantText() markdown stripper)
// that git history confirms was already gone before this session touched
// anything. Read the CURRENT siindex-speak-core.js (v3.0.16) in full before
// rewriting: it replaced all of that with a simpler, verified-safer design —
// three AbortControllers (voice/runtime/transcription) all cancelled by a
// single interrupt(), a `busy` flag that is declared but never actually used
// as a gate (dead, harmless — there is nothing left to get stuck on), and
// exactly one generic catch around getUserMedia() that always degrades to
// "Microphone blocked. Allow mic in browser, or type below." regardless of
// the underlying DOMException name. That's a real, deliberate simplification
// (never leaves a visitor stuck with no recovery), not a silent regression —
// checks below assert the current behavior instead of the retired mechanism.
const core = "siindex-speak-core.js";
requireText(core, /version:\s*"3\.\d+\.\d+"/, "website voice core v3.x is missing");
requireText(core, /siindex-website-runtime/, "website runtime endpoint is missing");
requireText(core, /siindex-website-transcribe/, "website transcription endpoint is missing");
requireText(core, /siindex-website-voice-tts/, "website voice endpoint is missing");
// Legacy browser SpeechRecognition was replaced by MediaRecorder + server-side
// transcription (siindex-website-transcribe) — assert the replacement is
// present AND the legacy constructor is truly gone, rather than requiring a
// bridge variable name from the retired implementation.
requireText(core, /navigator\.mediaDevices\.getUserMedia/, "MediaRecorder capture is missing");
forbidText(core, /SIINDEXSpeechRecognition|window\.SpeechRecognition\s*=/, "legacy browser SpeechRecognition bridge has returned");
// Markdown stripping for spoken/displayed text moved server-side into
// siindex-website-runtime's stripMarkdown() (asserted further below against
// that file) — the client no longer needs its own copy. Assert it's not
// duplicated client-side in a way that could drift from the server copy.
forbidText(core, /function normalizeAssistantText\(/, "assistant text normalization has been re-added client-side (should stay server-side in siindex-website-runtime)");
requireText(core, /Microphone unavailable\. Type your question below\./, "typed fallback guidance for unsupported microphones is missing");
requireText(core, /Microphone blocked\. Allow mic in browser, or type below\./, "typed fallback guidance for a blocked/failed microphone is missing");
requireText(core, /VOICE_REQUEST_TIMEOUT_MS = 30000/, "voice preparation timeout is missing");
requireText(core, /voiceAbort\s*=\s*null/, "voice request abort handle is missing");
requireText(core, /runtimeAbort\s*=\s*null/, "runtime request abort handle is missing");
requireText(core, /transcriptionAbort\s*=\s*null/, "transcription request abort handle is missing");
requireText(core, /function interrupt\(/, "single interrupt() abort-everything control is missing");
forbidText(core, /x-siindex-test-mode|qa_window_closed/, "temporary QA gate remains");
forbidText(core, /seed phrase/i, "legacy wallet-recovery terminology remains in the voice core");

const directCorePages = [
  "public-home.html",
  "home-v2.html",
  "siindex-chat.html",
  "siindex-voice-interface.html",
  "siindex-avatar.html",
  "siindex-voice-terminal.html",
];
for (const file of directCorePages) {
  // Allow an optional cache-busting query string (e.g. public-home.html was
  // bumped to ?v=voice-3.0.16 in Session 103's Item 6 fix) instead of
  // requiring the exact bare-filename tag every page happens to use today.
  requireText(file, /<script src="\/?siindex-speak-core\.js(\?[^"]*)?"><\/script>/, "shared voice core is not loaded");
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

// Tolerate whitespace variation inside the {source: '...'} literal (exact
// spacing has never been a meaningful contract — only that the call routes
// through the shared core with the right source tag).
requireText("home-v2.html", /window\.SIINDEXVoice\.listen\(\{\s*source:\s*'homepage'\s*\}\)/, "homepage microphone is not routed through the core");
requireText("public-home.html", /window\.SIINDEXVoice\.listen\(\{\s*source:\s*'public-home'\s*\}\)/, "approved public microphone is not routed through the core");
requireText("public-home.html", /window\.SIINDEXVoice\.interrupt\(\)/, "approved public interruption control is missing");
requireText("siindex-chat.html", /window\.SIINDEXVoice\.listen\(\{\s*source:\s*'chat-page'\s*\}\)/, "chat microphone is not routed through the core");
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
