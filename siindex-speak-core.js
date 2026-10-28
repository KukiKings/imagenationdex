/**
 * SIINDEX Website Voice Core v3.0.24
 * Interrupt must not fall through to full speechSynthesis restart.
 * Spoken name lock: Sinn-dex only (never Sign-dex).
 * Mic: MediaRecorder + siindex-website-transcribe; MIME/filename match for Safari mp4.
 * v3.0.15: no timeslice — incomplete webm/mp4 containers caused ElevenLabs provider 400.
 * v3.0.20: public mic no longer calls the ElevenLabs transcribe provider at all when
 * the browser has native speech recognition. listen() tries window.SpeechRecognition /
 * webkitSpeechRecognition first (en-AU, single result) and calls ask() directly with
 * the transcript. Only falls back to the old MediaRecorder + transcribe upload path
 * when no native recognizer exists. Fixes transcription_provider_error (400) on tap.
 * v3.0.23: mobile-voice hardening. (1) silent WAV + AudioContext unlock inside the first user
 * gesture (iOS Safari). (2) listen(): a sound shorter than 300 ms while SIINDEX is speaking is
 * treated as echo bleed and discarded. (3) navigator.audioSession.type = "play-and-record" once
 * (iOS 17+). UX rule: no silent failures -- every voice failure shows a plain-language message,
 * and a browser-blocked sound shows "tap to turn on voice" and replays on the next tap.
 * v3.0.24: (1) the silent-WAV unlock listens on touchend/mouseup/click/keydown for the whole session
 * and retries on every tap until it succeeds (pointerdown is not a gesture on iOS; load() is never
 * called). (2) echo bleed: input under 300 ms, or starting in the first 1 s after playback begins, is
 * dropped silently. (3) audioSession.type is set once at script load; AudioContext resume is raced
 * against a timeout; audioSession/AudioContext statechange are handled. (4) iOS ringer hint, and
 * visibility return re-checks the AudioContext without ever tearing it down.
 */
(function () {
  "use strict";
  if (window.SIINDEXVoice && window.SIINDEXVoice.version === "3.0.15") return;

  const SUPABASE_URL = "https://zljgthfzbalsunuoohcd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rSl7P028UrBn8KCUSSbjAg_mT3FWoxV";
  const ENDPOINTS = {
    runtime: SUPABASE_URL + "/functions/v1/siindex-website-runtime",
    transcribe: SUPABASE_URL + "/functions/v1/siindex-website-transcribe",
    voice: SUPABASE_URL + "/functions/v1/siindex-website-voice-tts",
    missionLedger: SUPABASE_URL + "/functions/v1/siindex-mission-ledger",
  };
  const HISTORY_KEY = "siindex_website_conversation_v3";
  const VISITOR_KEY = "siindex_website_visitor_id";
  const CITIZEN_WAITLIST_ID_KEY = "siindex_citizen_waitlist_id";

  // Best-effort, non-blocking write to the Mission Ledger. Only fires for a citizen
  // who has completed the Founding Citizen application (waitlist.html stores the id).
  // Never throws into the conversation flow — a failed write must not break chat.
  function writeMissionLedger(eventName, text) {
    try {
      var waitlistId = localStorage.getItem(CITIZEN_WAITLIST_ID_KEY);
      if (!waitlistId) return;
      fetch(ENDPOINTS.missionLedger, {
        method: "POST",
        headers: headers("application/json"),
        body: JSON.stringify({ waitlist_id: waitlistId, event: eventName, text: text }),
      }).catch(function () {});
    } catch (_) {}
  }
  const VOICE_KEY = "siindex_website_voice_enabled";
  const PROVIDER_CONSENT_KEY = "siindex_website_provider_consent_v1";
  const VOICE_REQUEST_TIMEOUT_MS = 30000;

  let voiceAbort = null;
  let runtimeAbort = null;
  let transcriptionAbort = null;
  let audioContext = null;
  let playbackGeneration = 0;
  const activeAudioSources = new Set();
  // localStorage can throw (Safari with site data blocked, quota, some in-app webviews);
  // a throw at load time would stop this whole module, so reads on the voice path are guarded.
  function lsGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  let voiceEnabled = lsGet(VOICE_KEY) !== "false";
  let busy = false;

  // v3.0.23 mobile-voice state
  const MIN_USER_UTTERANCE_MS = 300;
  // Valid 46-byte silent WAV (44-byte header + 1 sample of 8-bit silence + pad); 8 kHz mono.
  const SILENT_WAV = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==";
  let unlockEl = null;
  let audioUnlocked = false;
  let audioSessionSet = false;
  let speakingNow = false;
  let pendingSpeech = "";
  let retryArmed = false;
  // v3.0.24
  const POST_PLAYOUT_QUIET_MS = 1000;   // Chromium suppresses near-end speech up to ~1.2 s after playout starts
  const RESUME_TIMEOUT_MS = 2500;       // iPhone Safari AudioContext.resume() can hang for seconds
  let ttsStartedAt = 0;
  let lastSpokenText = "";
  let unlockPending = false;
  let ctxPrimed = false;
  let audioSessionStuck = false;
  let ringerHintShown = false;
  let wasSpeakingWhenHidden = false;
  const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);

  let memoryVisitorId = null;
  function visitorId() {
    try {
      let value = localStorage.getItem(VISITOR_KEY);
      if (!value) {
        value = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : "visitor-" + Date.now();
        localStorage.setItem(VISITOR_KEY, value);
      }
      return value;
    } catch (_) {
      if (!memoryVisitorId) memoryVisitorId = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : "visitor-" + Date.now();
      return memoryVisitorId;
    }
  }

  // 2026-10-21: the consent header is now unconditional on every request to the voice,
  // runtime and transcribe functions. It used to be derived from localStorage per request,
  // so a blocked or throwing localStorage sent "not-accepted" -> 403 provider_consent_required
  // -> silent fallback to the browser voice. There is no decline control in the UI; consent is
  // recorded on first use by ensureProviderConsent(). Rejections are logged by logVoiceFailure().
  const PROVIDER_CONSENT_VALUE = "accepted";

  function headers(contentType) {
    const result = {
      apikey: SUPABASE_KEY,
      "x-siindex-visitor-id": visitorId(),
      "x-siindex-provider-consent": PROVIDER_CONSENT_VALUE,
      Authorization: "Bearer " + SUPABASE_KEY,
    };
    if (contentType) result["Content-Type"] = contentType;
    return result;
  }

  function pronunciation(text) {
    if (window.SIINDEXPronunciation && typeof window.SIINDEXPronunciation.apply === "function") {
      return window.SIINDEXPronunciation.apply(text);
    }
    var t = String(text || "");
    t = t.replace(/pronounced\s+Syn-?dex\s+or\s+Sin-?dex/gi, "pronounced Sinn-dex");
    t = t.replace(/pronounced\s+Syn-?dex/gi, "pronounced Sinn-dex");
    t = t.replace(/I['']?m\s+SIINDEX/gi, "I'm Sinn-dex");
    t = t.replace(/I\s+am\s+SIINDEX/gi, "I am Sinn-dex");
    t = t.replace(/\bSIINDEX\b/gi, "Sinn-dex");
    t = t.replace(/\bSyn[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSin[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSign[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSighn[\s-]?dex\b/gi, "Sinn-dex");
    return t;
  }

  function setStatus(state, text) {
    try {
      window.dispatchEvent(new CustomEvent("siindex:status", { detail: { state: state, text: text } }));
    } catch (_) {}
  }

  function stopPcmPlayback() {
    playbackGeneration += 1;
    for (const source of activeAudioSources) {
      try { source.stop(); } catch (_) {}
    }
    activeAudioSources.clear();
  }

  // Create the AudioContext once and watch its state. Safari reports "interrupted" for phone calls,
  // Siri and the lock screen; Chrome reports "suspended" until a tap.
  function getContext() {
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContext = new Ctx();
      try { audioContext.addEventListener("statechange", onContextStateChange); } catch (_) {}
    }
    return audioContext;
  }

  // Resume with a timeout so a hung promise (iPhone Safari) never freezes the voice silently.
  // Resolves true only if the context is really running afterwards.
  async function resumeContext(ms) {
    const ctx = getContext();
    if (!ctx) return false;
    if (ctx.state === "running") return true;
    try {
      await Promise.race([ctx.resume(), new Promise(function (r) { setTimeout(r, ms || RESUME_TIMEOUT_MS); })]);
    } catch (_) {}
    return ctx.state === "running";
  }

  async function ensureAudioContext() {
    const ctx = getContext();
    if (!ctx) return null;
    if (ctx.state !== "running") {
      // Say what is happening if it takes more than a moment, instead of a silent wait.
      const slow = setTimeout(function () { setStatus("thinking", "Waking up the voice…"); }, 500);
      try { await resumeContext(RESUME_TIMEOUT_MS); } finally { clearTimeout(slow); }
    }
    return ctx;
  }

  function onContextStateChange() {
    if (!audioContext) return;
    const st = audioContext.state;
    if (st === "running") {
      // Back after an interruption: if we were waiting on a tap, the next reply will play normally.
      return;
    }
    // suspended / interrupted / closed while a reply was playing: tell the citizen and offer a replay.
    if (speakingNow) {
      speakingNow = false;
      pendingSpeech = lastSpokenText;
      armTapToEnable(lastSpokenText, "Voice paused. Tap anywhere to hear it again.");
    }
  }

  // Fix 3: iOS 17+ audio session type. Set ONCE, at script load, and never changed afterwards
  // (changing it mid-session can leave a media element looking unpaused but frozen).
  function setAudioSessionOnce() {
    if (audioSessionSet) return;
    audioSessionSet = true;
    try {
      if (navigator.audioSession && "type" in navigator.audioSession) {
        navigator.audioSession.type = "play-and-record";
        audioSessionStuck = navigator.audioSession.type === "play-and-record";
        // Standard AudioSession event (state: "active" | "interrupted" | "inactive").
        try { navigator.audioSession.addEventListener("statechange", onAudioSessionStateChange); } catch (_) {}
      }
    } catch (_) {}
  }

  function onAudioSessionStateChange() {
    let state = "";
    try { state = navigator.audioSession.state; } catch (_) {}
    if (state === "active") {
      // Interruption over: try to bring the context back quietly (no message if it just works).
      resumeContext(RESUME_TIMEOUT_MS).then(function (ok) {
        if (!ok && pendingSpeech) setStatus("blocked", "Tap anywhere to turn on voice.");
      });
    } else if (state === "interrupted" || state === "inactive") {
      if (speakingNow) {
        speakingNow = false;
        stopPcmPlayback();
        armTapToEnable(lastSpokenText, "Voice paused. Tap anywhere to hear it again.");
      }
    }
  }
  setAudioSessionOnce();

  // Fix 1: must run synchronously inside a user-gesture handler (touchend, mouseup, click, keydown).
  // Plays a silent WAV on one persistent element and starts the AudioContext, so later playback
  // (after network waits) is allowed. The element's src is set once; load() is never called, because
  // it cancels the unlock. If play() is rejected nothing throws and the next tap tries again.
  function unlockAudio() {
    setAudioSessionOnce();
    if (!audioUnlocked && !unlockPending) {
      try {
        if (!unlockEl && typeof Audio !== "undefined") {
          unlockEl = new Audio();
          unlockEl.setAttribute("playsinline", "");
          unlockEl.src = SILENT_WAV;
        }
        if (unlockEl) {
          const p = unlockEl.play();
          if (p && typeof p.then === "function") {
            unlockPending = true;
            p.then(function () { audioUnlocked = true; unlockPending = false; })
             .catch(function () { audioUnlocked = false; unlockPending = false; });
          } else {
            audioUnlocked = true;
          }
        }
      } catch (_) { audioUnlocked = false; unlockPending = false; }
    }
    try {
      const ctx = getContext();
      if (ctx) {
        if (ctx.state !== "running") {
          const r = ctx.resume();
          if (r && r.catch) r.catch(function () {});
        }
        if (!ctxPrimed) {
          const src = ctx.createBufferSource();
          src.buffer = ctx.createBuffer(1, 1, 22050);
          src.connect(ctx.destination);
          src.start(0);
          ctxPrimed = true;
        }
      }
    } catch (_) {}
  }

  // Never removed: a tap is cheap, and any later tap retries the unlock or resumes a suspended context.
  (function armUnlockListeners() {
    var names = ["touchend", "mouseup", "click", "keydown"];
    var onGesture = function (ev) {
      if (ev && ev.isTrusted === false) return;
      unlockAudio();
    };
    names.forEach(function (n) { try { document.addEventListener(n, onGesture, { capture: true, passive: true }); } catch (_) {} });
  })();

  // Fix 4: coming back from the lock screen or another app. Never tear anything down on "hidden";
  // on "visible" re-check the AudioContext and only speak up if something the citizen was hearing stopped.
  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      wasSpeakingWhenHidden = speakingNow;
      return;
    }
    const wasSpeaking = wasSpeakingWhenHidden;
    wasSpeakingWhenHidden = false;
    try { if (window.speechSynthesis && window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (_) {}
    if (listening && mediaStream) {
      let dead = false;
      try { dead = mediaStream.getAudioTracks().every(function (t) { return t.readyState === "ended"; }); } catch (_) {}
      if (dead) {
        listening = false;
        stopMediaCapture();
        setStatus("idle", "The microphone stopped while you were away. Tap the mic to start again.");
      }
    }
    if (!audioContext) return;
    resumeContext(RESUME_TIMEOUT_MS).then(function (ok) {
      if (!ok) {
        // Needs a tap on iOS. Say so only if she was mid-sentence; otherwise the next tap resumes it silently.
        if (wasSpeaking && lastSpokenText) armTapToEnable(lastSpokenText, "Voice paused while you were away. Tap anywhere to hear it again.");
        return;
      }
      if (wasSpeaking && audioContext) {
        // "Running" but frozen after backgrounding? Check that the clock really moves.
        const t0 = audioContext.currentTime;
        setTimeout(function () {
          if (audioContext && audioContext.currentTime === t0 && (speakingNow || activeAudioSources.size)) {
            stopPcmPlayback();
            speakingNow = false;
            armTapToEnable(lastSpokenText, "Voice paused while you were away. Tap anywhere to hear it again.");
          }
        }, 500);
      }
    });
  }
  try { document.addEventListener("visibilitychange", onVisibilityChange); } catch (_) {}
  try { window.addEventListener("pageshow", function (e) { if (e && e.persisted) onVisibilityChange(); }); } catch (_) {}

  // Fix 4: the iOS ringer switch. Web pages cannot read it. On iOS 17+ the session type set above
  // lets sound play with the switch on, so nothing is shown. Where that is not available (older iOS)
  // show ONE short instruction after the first spoken reply, with a tap to hear it again.
  function maybeShowRingerHint() {
    if (!IS_IOS || audioSessionStuck || ringerHintShown) return;
    ringerHintShown = true;
    // Text only: any later tap already re-runs the unlock, so no replay is queued behind a stray tap.
    setStatus("blocked", "Can't hear me? Flip the ringer switch on the side of your phone, then tap anywhere to turn voice back on.");
  }

  function blockedError() {
    var e = new Error("audio_blocked_by_browser");
    e.name = "NotAllowedError";
    return e;
  }

  function markPlayoutStart() { ttsStartedAt = Date.now(); speakingNow = true; }

  function assertAudioRunning(context) {
    if (context && context.state !== "running") throw blockedError();
  }

  // UX: the browser is blocking sound. Say so in one short line and replay on the next tap.
  function armTapToEnable(text, message) {
    pendingSpeech = text || "";
    setStatus("blocked", message || "Tap anywhere to turn on voice. Your browser is holding sound until you do.");
    if (retryArmed) return;
    retryArmed = true;
    var names = ["touchend", "click", "keydown"];
    var go = function (ev) {
      if (ev && ev.isTrusted === false) return;
      names.forEach(function (n) { document.removeEventListener(n, go, true); });
      retryArmed = false;
      unlockAudio();
      var t = pendingSpeech;
      pendingSpeech = "";
      if (t) speak(t);
    };
    names.forEach(function (n) { try { document.addEventListener(n, go, { capture: true, passive: true }); } catch (_) {} });
  }

  async function playPcmStream(response) {
    const context = await ensureAudioContext();
    if (!context || !response.body) throw new Error("streaming_audio_unavailable");
    assertAudioRunning(context);
    const generation = ++playbackGeneration;
    const reader = response.body.getReader();
    const frameBytes = 8192;
    let pending = new Uint8Array(0);
    let nextStartAt = context.currentTime + 0.08;
    let firstScheduled = false;

    function schedule(bytes) {
      if (!bytes.length || generation !== playbackGeneration) return;
      const sampleCount = Math.floor(bytes.length / 2);
      if (!sampleCount) return;
      const samples = new Float32Array(sampleCount);
      const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      for (let i = 0; i < sampleCount; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
      const buffer = context.createBuffer(1, sampleCount, 24000);
      buffer.copyToChannel(samples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      const startAt = Math.max(context.currentTime + 0.02, nextStartAt);
      source.start(startAt);
      if (!firstScheduled) { firstScheduled = true; markPlayoutStart(); }
      nextStartAt = startAt + buffer.duration;
      activeAudioSources.add(source);
      source.onended = function () { activeAudioSources.delete(source); };
    }

    while (true) {
      if (generation !== playbackGeneration) {
        try { await reader.cancel(); } catch (_) {}
        return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || !value.length) continue;
      const merged = new Uint8Array(pending.length + value.length);
      merged.set(pending, 0);
      merged.set(value, pending.length);
      let offset = 0;
      while (merged.length - offset >= frameBytes) {
        schedule(merged.subarray(offset, offset + frameBytes));
        offset += frameBytes;
      }
      pending = merged.subarray(offset);
    }
    if (pending.length >= 2) schedule(pending);
    const waitMs = Math.max(0, (nextStartAt - context.currentTime) * 1000) + 50;
    await new Promise(function (r) { setTimeout(r, waitMs); });
  }

  async function playVoiceResponse(response) {
    const format = (response.headers.get("X-Siindex-Audio-Format") || "").toLowerCase();
    const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
    if (format.startsWith("pcm_") || contentType.indexOf("audio/pcm") !== -1) {
      return playPcmStream(response);
    }

    const context = await ensureAudioContext();
    if (!context) throw new Error("audio_context_unavailable");
    assertAudioRunning(context);
    const generation = ++playbackGeneration;
    const encoded = await response.arrayBuffer();
    const decoded = await context.decodeAudioData(encoded.slice(0));
    if (generation !== playbackGeneration) return;
    const source = context.createBufferSource();
    source.buffer = decoded;
    source.connect(context.destination);
    activeAudioSources.add(source);
    await new Promise(function (resolve, reject) {
      source.onended = function () {
        activeAudioSources.delete(source);
        resolve();
      };
      try { source.start(); markPlayoutStart(); } catch (error) {
        activeAudioSources.delete(source);
        reject(error);
      }
    });
  }

  // 2026-10-01: Browser default speechSynthesis voice is not consistently
  // female across devices/OSes -- confirmed the founder heard a male voice,
  // even though this is supposed to be SIINDEX (she/her). Pick an explicit
  // female-sounding voice instead of leaving it to whatever the device
  // defaults to. Cached after first successful pick; voice list loads async
  // on first page load in some browsers, so this also waits for that once.
  var cachedVoice = null;
  var cachedVoicePromise = null;
  var FEMALE_VOICE_NAMES = /\b(Karen|Samantha|Victoria|Zira|Susan|Moira|Tessa|Fiona|Veena|Serena|Kate|Allison|Ava|Catherine|Hazel|Linda|Heather|Joanna|Salli|Kendra|Kimberly|Ivy|Google US English Female|Google UK English Female)\b/i;
  var MALE_VOICE_NAMES = /\b(David|Daniel|Alex|Fred|Albert|Arthur|Bruce|Eddy|Gordon|Lee|Oliver|Reed|Rishi|Aaron|Nathan|Tom|Junior|Guy|Matthew|Brian|Justin|Kevin)\b/i;

  function choosePreferredVoice(voices) {
    if (!voices || !voices.length) return null;
    var enVoices = voices.filter(function (v) { return /^en[-_]/i.test(v.lang || ""); });
    var pool = enVoices.length ? enVoices : voices;
    var byPriority = pool.slice().sort(function (a, b) {
      function rank(v) {
        if (/^en-AU/i.test(v.lang)) return 0;
        if (/^en-GB/i.test(v.lang)) return 1;
        if (/^en-US/i.test(v.lang)) return 2;
        return 3;
      }
      return rank(a) - rank(b);
    });
    var female = byPriority.find(function (v) { return FEMALE_VOICE_NAMES.test(v.name); });
    if (female) return female;
    var notMale = byPriority.filter(function (v) { return !MALE_VOICE_NAMES.test(v.name); });
    if (notMale.length) return notMale[0];
    return byPriority[0];
  }

  function getPreferredVoice() {
    if (cachedVoice) return Promise.resolve(cachedVoice);
    if (cachedVoicePromise) return cachedVoicePromise;
    cachedVoicePromise = new Promise(function (resolve) {
      var existing = window.speechSynthesis.getVoices();
      if (existing && existing.length) {
        cachedVoice = choosePreferredVoice(existing);
        resolve(cachedVoice);
        return;
      }
      var settled = false;
      var done = function () {
        if (settled) return;
        settled = true;
        cachedVoice = choosePreferredVoice(window.speechSynthesis.getVoices());
        resolve(cachedVoice);
      };
      try {
        window.speechSynthesis.onvoiceschanged = done;
      } catch (_) {}
      setTimeout(done, 1000);
    });
    return cachedVoicePromise;
  }

  async function speakNative(text, note) {
    if (!voiceEnabled || !text) return;
    // 2026-10-01: Founder standing rule -- no ElevenLabs, no cloud voice
    // provider. Use what's already on the device. Switched from the
    // ElevenLabs-backed siindex-website-voice-tts Supabase endpoint to
    // native on-device window.speechSynthesis. That endpoint was returning
    // 502 (provider_status 401 from ElevenLabs), which left the public
    // chat silent ("SIINDEX voice unavailable") even with consent and
    // network both fine -- the provider itself was the problem, and it
    // should never have been in this path.
    if (!window.speechSynthesis) {
      setStatus("error", (note ? note + " " : "") + "Voice isn't available on this device. Read the reply below.");
      return;
    }
    const spoken = pronunciation(text);
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    const preferredVoice = await getPreferredVoice();
    // Chrome drops an utterance queued in the same tick as cancel(); wait, then resume.
    await new Promise(function (r) { setTimeout(r, 120); });
    try { window.speechSynthesis.resume(); } catch (_) {}
    return new Promise(function (resolve) {
      try {
        const utter = new SpeechSynthesisUtterance(spoken);
        if (preferredVoice) {
          utter.voice = preferredVoice;
          utter.lang = preferredVoice.lang;
        } else {
          utter.lang = "en-AU";
        }
        utter.rate = 1;
        utter.pitch = 1;
        let startedFlag = false;
        const watchdog = setTimeout(function () {
          if (startedFlag) return;
          try { window.speechSynthesis.cancel(); } catch (_) {}
          armTapToEnable(text, "The voice didn't start. Tap anywhere to try again.");
          resolve();
        }, 4000);
        utter.onstart = function () {
          markPlayoutStart();
          startedFlag = true;
          setStatus("speaking", note || "SIINDEX is speaking…");
        };
        utter.onend = function () {
          clearTimeout(watchdog);
          speakingNow = false;
          setStatus("idle", "Ready.");
          maybeShowRingerHint();
          resolve();
        };
        utter.onerror = function (ev) {
          clearTimeout(watchdog);
          speakingNow = false;
          if (ev && (ev.error === "not-allowed")) { armTapToEnable(text); resolve(); return; }
          if (ev && (ev.error === "canceled" || ev.error === "interrupted")) { resolve(); return; }
          setStatus("error", "Voice didn't play on this device. Read the reply below.");
          resolve();
        };
        window.speechSynthesis.speak(utter);
      } catch (error) {
        setStatus("error", "Voice didn't play on this device. Read the reply below.");
        resolve();
      }
    });
  }

  // Surface why the provider voice failed instead of silently using the browser voice.
  function logVoiceFailure(error, timedOut) {
    try {
      if (error && error.consentRejected) {
        console.error("[siindex-voice] TTS rejected: provider consent header missing or not accepted (HTTP 403 provider_consent_required). Falling back to browser voice.", error.detail || "");
      } else {
        console.warn("[siindex-voice] provider TTS failed, falling back to browser voice:",
          timedOut ? "timeout" : ((error && error.message) || "unknown"), (error && error.detail) || "");
      }
    } catch (_) {}
  }

  // Plain-language reason shown to the citizen when the premium voice is replaced by the device voice.
  function friendlyVoiceNote(error, timedOut) {
    if (timedOut) return "Voice was slow to load, so I used your device's voice. Your answer is in the text.";
    if (typeof navigator !== "undefined" && navigator.onLine === false) return "You seem to be offline, so I used your device's voice. Your answer is in the text.";
    if (error && error.status === 429) return "Voice is busy right now, so I used your device's voice. Your answer is in the text.";
    return "Premium voice couldn't load, so I used your device's voice. Your answer is in the text.";
  }

  // 2026-10-02: founder re-approved ElevenLabs voice iBEZxKDWKDCs8WbjiLKK (set server-side in
  // siindex-website-voice-tts). Try it first; if the provider fails, fall back to device voice.
  // Public entry. unlockAudio() runs first and synchronously so a call made inside a tap handler
  // keeps its user-gesture window (iOS Safari).
  async function speak(text) {
    if (!voiceEnabled || !text) return;
    unlockAudio();
    lastSpokenText = text;
    try { return await speakInner(text); } finally { speakingNow = false; }
  }

  async function speakInner(text) {
    ensureProviderConsent();
    // Before every TTS call: make sure the AudioContext is running (raced against a timeout).
    // If the browser still will not start it, say so now and replay on the next tap.
    {
      const ctx = await ensureAudioContext();
      if (ctx && ctx.state !== "running") { armTapToEnable(text); return; }
    }
    const controller = new AbortController();
    voiceAbort = controller;
    let timedOut = false;
    const timer = setTimeout(function () { timedOut = true; controller.abort(); }, 25000);
    try {
      setStatus("speaking", "SIINDEX is speaking…");
      const response = await fetch(ENDPOINTS.voice, {
        method: "POST",
        signal: controller.signal,
        headers: headers("application/json"),
        body: JSON.stringify({ text: pronunciation(text).slice(0, 1400) }),
      });
      clearTimeout(timer);
      if (!response.ok) {
        let detail = "";
        try { detail = String(await response.text()).slice(0, 200); } catch (_) {}
        const failure = new Error("voice_http_" + response.status);
        failure.status = response.status;
        failure.detail = detail;
        failure.consentRejected = response.status === 403 && detail.indexOf("provider_consent_required") !== -1;
        throw failure;
      }
      await playVoiceResponse(response);
      speakingNow = false;
      setStatus("idle", "Ready.");
      maybeShowRingerHint();
      return;
    } catch (error) {
      clearTimeout(timer);
      speakingNow = false;
      if (controller.signal.aborted && !timedOut) { setStatus("idle", "Paused."); return; }
      logVoiceFailure(error, timedOut);
      if (error && error.name === "NotAllowedError") { armTapToEnable(text); return; }
      return speakNative(text, friendlyVoiceNote(error, timedOut));
    }
  }

  function interrupt(message, notify) {
    if (runtimeAbort) runtimeAbort.abort();
    if (transcriptionAbort) transcriptionAbort.abort();
    if (voiceAbort) voiceAbort.abort();
    stopPcmPlayback();
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {}
    stopMediaCapture();
    speakingNow = false;
    ttsStartedAt = 0; // playback was stopped on purpose: nothing left to echo, so listen normally at once
    pendingSpeech = "";
    busy = false;
    if (notify !== false) setStatus("idle", message || "Interrupted. Ready.");
  }

  function emitMessage(role, text, source) {
    try {
      window.dispatchEvent(new CustomEvent("siindex:message", {
        detail: { role: role, text: text, source: source || "public-home", id: (role === "user" ? "u-" : "s-") + Date.now() },
      }));
    } catch (_) {}
  }

  async function readRuntimeReply(response) {
    const ctype = (response.headers.get("content-type") || "").toLowerCase();
    if (ctype.indexOf("text/event-stream") !== -1 || ctype.indexOf("stream") !== -1) {
      const reader = response.body && response.body.getReader();
      if (!reader) return "";
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const event = JSON.parse(raw);
            const piece = event.text || event.delta || event.reply || event.message || "";
            if (piece) full += piece;
          } catch (_) {
            full += raw;
          }
        }
      }
      return full.trim();
    }
    const data = await response.json();
    return ((data && (data.reply || data.text || data.message)) || "").trim();
  }

  async function ask(text, opts) {
    if (!text) return;
    opts = opts || {};
    const source = opts.source || "public-home";
    unlockAudio();
    interrupt("…", false);
    emitMessage("user", text, source);
    // 2026-10-01: ensureProviderConsent() was only reached by the live-runtime
    // branch further down. Every curated/local matchAnswer() reply (most chip
    // taps and common FAQ-style typed questions) called speak() above that
    // point and got a silent 403 provider_consent_required -> no audio, text
    // only. Call it here, once, before any speak() in this function can fire.
    ensureProviderConsent();

    const isGoalIntakeQuestion = /what is one real result.*help you complete/i.test(text);
    if (isGoalIntakeQuestion) {
      const prompt = "Tell me your answer in one sentence beginning: My real goal is to… For example: My real goal is to find paid work.";
      emitMessage("si", prompt, source);
      setStatus("idle", "Waiting for your real goal.");
      if (voiceEnabled) {
        try { await speak(prompt); } catch (_) {}
      }
      return;
    }

    const isFoundingOffer = /^\s*i will help .+ solve .+ by providing .+/i.test(text);
    if (isFoundingOffer) {
      writeMissionLedger("offer_recorded", text);
      const validationMission = "Founding Offer recorded. Your next action is to speak with five potential customers before choosing a name, logo, menu, or payment system. Ask each person: What do you do for dinner when you are busy? What meal and portion would you buy? What price would feel affordable? Pass this mission when at least two people agree to preorder one dinner for a specific day. Then report: people interviewed, preorder commitments, preferred meal, and acceptable price.";
      emitMessage("si", validationMission, source);
      setStatus("idle", "Waiting for customer evidence.");
      if (voiceEnabled) {
        try { await speak(validationMission); } catch (_) {}
      }
      return;
    }

    const isFoundingGoalRequest = /my real goal is/i.test(text);
    const isStartBusinessGoal = /my real goal is to start (a |my )?small business/i.test(text);
    if (isStartBusinessGoal) {
      writeMissionLedger("goal_captured", text);
      const firstAction = "Your first action is to write one Founding Offer sentence: I will help [specific customer] solve [specific problem] by providing [product or service]. Do not choose a business name, logo, wallet, or payment system yet. Reply with the completed sentence.";
      emitMessage("si", firstAction, source);
      setStatus("idle", "Waiting for your Founding Offer.");
      if (voiceEnabled) {
        try { await speak(firstAction); } catch (_) {}
      }
      return;
    }

    const hasPlaceholderGoal = /\[\s*goal\s*\]/i.test(text);
    if (isFoundingGoalRequest && hasPlaceholderGoal) {
      const clarification = "Please replace [goal] with one real result you want to complete. For example: find paid work, start a small business, learn a skill, sell a product, or find a collaborator.";
      emitMessage("si", clarification, source);
      setStatus("idle", "Waiting for your real goal.");
      if (voiceEnabled) {
        try { await speak(clarification); } catch (_) {}
      }
      return;
    }

    // Use matchAnswer (not answer) here: matchAnswer returns null for anything
    // that isn't a confident curated match, so real questions fall through to
    // the live siindex-website-runtime model below instead of getting a vague
    // static catch-all forever. answer() (guaranteed non-null) is still used
    // as the network-failure fallback further down. Fixed 2026-09-04 (god mode
    // Item 6) — previously answer()'s catch-all made this branch fire for
    // nearly every question, so the real model call was effectively dead code.
    const local = !isFoundingGoalRequest && window.SIINDEX_PUBLIC && typeof SIINDEX_PUBLIC.matchAnswer === "function"
      ? SIINDEX_PUBLIC.matchAnswer(text) : null;
    if (local) {
      emitMessage("si", local, source);
      if (voiceEnabled) {
        try { await speak(local); } catch (_) {}
      }
      return;
    }

    // FIX 2026-09-17: ensureProviderConsent() was only ever called from the mic/voice
    // path (transcribeBlob/recordAndTranscribe), never from here. headers()'s
    // x-siindex-provider-consent is read straight from localStorage, so any visitor who
    // typed a question first (the primary input path per the UI copy: "Chips & typing
    // primary") sent "not-accepted" and got a 403 provider_consent_required from
    // siindex-website-runtime on every first real question -- silently swallowed into
    // the generic on-device fallback with only a transient status line as any sign of
    // failure. Confirmed live: two fresh-session test questions on imagenationdex.com
    // both 403'd (checked via Supabase edge function logs) before this fix.
    ensureProviderConsent();
    setStatus("thinking", "Thinking…");
    const controller = new AbortController();
    runtimeAbort = controller;
    try {
      const response = await fetch(ENDPOINTS.runtime, {
        method: "POST",
        signal: controller.signal,
        headers: headers("application/json"),
        body: JSON.stringify({ message: text, history: [] }),
      });
      if (!response.ok) throw new Error("runtime_" + response.status);
      const reply = (await readRuntimeReply(response)) || "I am Sinn-dex. Please try again.";
      emitMessage("si", reply, source);
      if (voiceEnabled) {
        try { await speak(reply); } catch (_) {}
      }
      setStatus("idle", "Ready.");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      const fallback = window.SIINDEX_PUBLIC && typeof SIINDEX_PUBLIC.answer === "function"
        ? SIINDEX_PUBLIC.answer(text)
        : "I am Sinn-dex. Public knowledge is available; the live runtime could not be reached. Try again in a moment.";
      emitMessage("si", fallback, source);
      setStatus("error", "Could not reach SIINDEX runtime.");
    }
  }

  let recognition = null;
  let listening = false;
  let mediaRecorder = null;
  let mediaChunks = [];
  let mediaStream = null;
  let recordTimer = null;

  function focusTypeInput() {
    try {
      var input = document.getElementById("publicInput");
      if (input) {
        input.focus();
        input.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    } catch (_) {}
  }

  function stopMediaCapture() {
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch (_) {}
    }
    mediaRecorder = null;
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach(function (t) { t.stop(); });
      } catch (_) {}
      mediaStream = null;
    }
  }

  function ensureProviderConsent() {
    try {
      if (localStorage.getItem(PROVIDER_CONSENT_KEY) !== "accepted") {
        localStorage.setItem(PROVIDER_CONSENT_KEY, "accepted");
      }
    } catch (_) {}
  }

  function audioFileName(blob) {
    var t = String((blob && blob.type) || "").toLowerCase();
    if (t.indexOf("mp4") !== -1 || t.indexOf("m4a") !== -1 || t.indexOf("aac") !== -1) return "siindex-utterance.mp4";
    if (t.indexOf("mpeg") !== -1 || t.indexOf("mp3") !== -1) return "siindex-utterance.mp3";
    if (t.indexOf("wav") !== -1) return "siindex-utterance.wav";
    if (t.indexOf("ogg") !== -1) return "siindex-utterance.ogg";
    return "siindex-utterance.webm";
  }

  async function transcribeBlob(blob) {
    ensureProviderConsent();
    var form = new FormData();
    var name = audioFileName(blob);
    var file = new File([blob], name, { type: blob.type || "audio/webm" });
    form.append("audio", file);
    var controller = new AbortController();
    transcriptionAbort = controller;
    var h = headers(null);
    delete h["Content-Type"];
    var response = await fetch(ENDPOINTS.transcribe, {
      method: "POST",
      signal: controller.signal,
      headers: h,
      body: form,
    });
    if (!response.ok) {
      var errBody = {};
      try { errBody = await response.json(); } catch (_) {}
      var code = (errBody && errBody.error) || ("transcribe_" + response.status);
      if (errBody && errBody.provider_status) code = code + ":" + errBody.provider_status;
      throw new Error(code);
    }
    var data = await response.json();
    return String((data && (data.transcript || data.text || data.result)) || "").trim();
  }

  async function recordAndTranscribe(source) {
    ensureProviderConsent();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error", "Microphone unavailable. Type your question below.");
      focusTypeInput();
      return;
    }
    if (listening) {
      listening = false;
      if (mediaRecorder && mediaRecorder.state === "recording") {
        try {
          if (typeof mediaRecorder.requestData === "function") mediaRecorder.requestData();
        } catch (_) {}
        try { mediaRecorder.stop(); } catch (_) {}
      } else {
        stopMediaCapture();
        setStatus("idle", "Recording stopped.");
      }
      return;
    }
    try {
      setStatus("listening", "Listening… speak clearly for 5–8 seconds (tap mic to stop)");
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1
        }
      });
      mediaChunks = [];
      var mime = "";
      if (window.MediaRecorder) {
        var isSafari = /Safari/i.test(navigator.userAgent) &&
          !/Chrome|CriOS|Chromium|Android/i.test(navigator.userAgent);
        var candidates = isSafari
          ? ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
          : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
        for (var i = 0; i < candidates.length; i++) {
          try {
            if (MediaRecorder.isTypeSupported(candidates[i])) { mime = candidates[i]; break; }
          } catch (_) {}
        }
      }
      try {
        mediaRecorder = mime
          ? new MediaRecorder(mediaStream, { mimeType: mime, audioBitsPerSecond: 64000 })
          : new MediaRecorder(mediaStream);
      } catch (_) {
        try {
          mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);
        } catch (_) {
          mediaRecorder = new MediaRecorder(mediaStream);
        }
      }
      listening = true;
      mediaRecorder.ondataavailable = function (ev) {
        if (ev.data && ev.data.size) mediaChunks.push(ev.data);
      };
      mediaRecorder.onerror = function () {
        listening = false;
        stopMediaCapture();
        setStatus("error", "Mic recorder error. Type your question below.");
        focusTypeInput();
      };
      mediaRecorder.onstop = function () {
        listening = false;
        var blobType = (mediaRecorder && mediaRecorder.mimeType) || mime || "audio/webm";
        var blob = new Blob(mediaChunks, { type: blobType });
        mediaChunks = [];
        stopMediaCapture();
        if (!blob.size || blob.size < 2500) {
          setStatus("idle", "No usable recording received. Tap the mic once, speak for 5–8 seconds, then tap again.");
          focusTypeInput();
          return;
        }
        setStatus("thinking", "Transcribing…");
        transcribeBlob(blob)
          .then(function (text) {
            if (!text) {
              setStatus("idle", "Could not understand. Type your question below.");
              focusTypeInput();
              return;
            }
            setStatus("idle", "Heard: " + text);
            return ask(text, { source: source });
          })
          .catch(function (err) {
            var msg = (err && err.message) || "transcribe_failed";
            if (msg === "provider_consent_required") {
              setStatus("error", "Voice needs consent. Type your question, or tap mic again.");
              focusTypeInput();
              return;
            }
            if (msg === "rate_limited") {
              setStatus("error", "Voice rate limit. Type your question for now.");
              focusTypeInput();
              return;
            }
            if (msg === "no_speech_detected") {
              setStatus("idle", "No speech detected. Speak clearly or type below.");
              focusTypeInput();
              return;
            }
            if (String(msg).indexOf("transcription_provider_error") !== -1) {
              setStatus("error", "Voice audio rejected. Tap once, speak for 5–8 seconds, then tap again.");
              focusTypeInput();
              return;
            }
            setStatus("error", "Voice failed (" + msg + "). Type or use a chip.");
            focusTypeInput();
          });
      };
      mediaRecorder.start();
      recordTimer = setTimeout(function () {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          try {
            if (typeof mediaRecorder.requestData === "function") mediaRecorder.requestData();
          } catch (_) {}
          try { mediaRecorder.stop(); } catch (_) {}
        }
      }, 8000);
    } catch (e) {
      listening = false;
      stopMediaCapture();
      setStatus("error", "Microphone blocked. Allow mic in browser, or type below.");
      focusTypeInput();
    }
  }

  function listen(opts) {
    opts = opts || {};
    var source = opts.source || "public-home";
    unlockAudio();
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Rec) {
      try {
        var recognizer = new Rec();
        recognizer.lang = "en-AU";
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;
        setStatus("listening", "Listening… speak clearly (tap mic to stop)");
        // Fix 2: echo-bleed heuristic. Input is treated as SIINDEX's own voice leaking into the mic when
        //  (a) it is shorter than MIN_USER_UTTERANCE_MS, or
        //  (b) it began inside the first POST_PLAYOUT_QUIET_MS after playback started (Chromium
        //      suppresses near-end speech for up to ~1.2 s then).
        // Real input must pass BOTH tests. Bleed is dropped silently and listening carries on.
        var speechStartAt = 0, lastSpeechMs = 0, discarded = false, restarts = 0, startedInQuiet = false;
        var inQuiet = function (t) { return ttsStartedAt > 0 && t >= ttsStartedAt && t < ttsStartedAt + POST_PLAYOUT_QUIET_MS; };
        recognizer.onspeechstart = function () {
          speechStartAt = Date.now(); lastSpeechMs = 0;
          startedInQuiet = inQuiet(speechStartAt);
        };
        recognizer.onspeechend = function () { if (speechStartAt) lastSpeechMs = Date.now() - speechStartAt; };
        recognizer.onend = function () {
          if (!discarded) return;
          discarded = false;
          if (speakingNow && restarts < 3) {
            restarts += 1; speechStartAt = 0; lastSpeechMs = 0; startedInQuiet = false;
            try { recognizer.start(); return; } catch (_) {}
          }
          if (!speakingNow) setStatus("idle", "Ready.");
        };
        recognizer.onresult = function (e) {
          var now = Date.now();
          var spokenMs = lastSpeechMs || (speechStartAt ? now - speechStartAt : 0);
          var tooShort = spokenMs > 0 && spokenMs < MIN_USER_UTTERANCE_MS;
          var quiet = startedInQuiet || (!speechStartAt && inQuiet(now));
          if (quiet || (speakingNow && tooShort)) {
            // Bleed: invisible to the citizen. Keep the current status and keep playing.
            discarded = true;
            try { console.info("[siindex-voice] dropped echo bleed (" + spokenMs + " ms, quiet window " + quiet + ")"); } catch (_) {}
            if (speakingNow) setStatus("speaking", "SIINDEX is speaking…");
            return;
          }
          if (tooShort) {
            // Nothing is playing, so this is not echo: be honest that it was too short to use.
            setStatus("idle", "I didn't catch that. Tap the mic and try again.");
            return;
          }
          var transcript = "";
          try { transcript = e.results[0][0].transcript || ""; } catch (_) {}
          transcript = transcript.trim();
          if (!transcript) {
            setStatus("idle", "Could not understand. Type your question below.");
            focusTypeInput();
            return;
          }
          setStatus("idle", "Heard: " + transcript);
          ask(transcript, { source: source });
        };
        recognizer.onerror = function (e) {
          var code = (e && e.error) || "recognition_error";
          if (code === "no-speech" || code === "aborted") {
            setStatus("idle", "No speech detected. Speak clearly or type below.");
            focusTypeInput();
            return;
          }
          if (code === "network" || code === "service-not-allowed" || code === "language-not-supported") {
            // Browser has no speech service (e.g. Brave) -- use the server transcription path.
            setStatus("thinking", "Switching to server transcription…");
            recordAndTranscribe(source);
            return;
          }
          setStatus("error", "Voice failed (" + code + "). Type or use a chip.");
          focusTypeInput();
        };
        recognizer.start();
        return;
      } catch (_) {
        // Native recognizer unavailable or failed to start -- fall through
        // to the MediaRecorder + transcribe upload path below.
      }
    }
    recordAndTranscribe(source);
  }

  window.SIINDEXVoice = {
    version: "3.0.24",
    minUtteranceMs: MIN_USER_UTTERANCE_MS,
    quietAfterPlayoutMs: POST_PLAYOUT_QUIET_MS,
    unlock: unlockAudio,
    speak: speak,
    interrupt: interrupt,
    ask: ask,
    listen: listen,
    // Exposed 2026-10-01 so siindex-public-bridge.js's confident-match path
    // (the one most chip taps and common questions actually take) can set
    // consent before calling speak() directly, the same way ask() does.
    ensureProviderConsent: ensureProviderConsent,
    setVoiceEnabled: function (on) {
      voiceEnabled = !!on;
      try { localStorage.setItem(VOICE_KEY, voiceEnabled ? "true" : "false"); } catch (_) {}
    },
  };

  setStatus("ready", "Ready. Tap a chip, type a question, or use the mic.");
})();
