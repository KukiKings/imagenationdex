/*
 * SIINDEX real-time voice (OpenAI Realtime over WebRTC).
 * Additional voice channel only: it does not touch text Q&A, the board, the log or mailto flows.
 * Audio goes browser -> OpenAI directly. The long-lived key stays in the siindex-realtime-token
 * edge function; this file only ever holds a 60-second ephemeral client secret.
 * The voice is an OpenAI built-in voice, NOT the locked ElevenLabs voice (iBEZxKDWKDCs8WbjiLKK).
 *
 * API:  SIINDEXRealtime.start(opts) / .stop() / .isActive() / .state()
 * opts: { onState(state, detail), onTranscript(role, text, final), onError(message), onNotice(message) }
 * states: idle | connecting | listening | thinking | speaking | error
 * onNotice(message) is a plain-language line for the screen ("" clears it). It is how a blocked sound,
 * an unstable connection or a paused microphone is shown, so nothing fails silently.
 *
 * v1.1.0 (2026-10-28) mobile-voice hardening:
 *  1. The <audio> element is created and started synchronously inside the tap, before any await, so
 *     iOS keeps the gesture. A blocked or hung play() shows "Tap anywhere to turn on the voice" and
 *     retries on the next tap.
 *  2. Client-side echo guard: mic input shorter than 300 ms, or starting in the first second after
 *     playback begins, is dropped silently (no cancel, no transcript, no reply). To make that possible
 *     the session sets turn_detection.interrupt_response=false and create_response=false, and this file
 *     decides when to cancel a reply and when to ask for one.
 *  3. audioSession.type = "play-and-record" once at session open (where the API exists); AudioSession
 *     state changes and visibilitychange are handled; "disconnected" gets a 5 s grace period.
 *  4. A dropped call, a stopped microphone and every failed start show a plain message on screen.
 */
(function () {
  "use strict";
  if (window.SIINDEXRealtime) return;

  var TOKEN_URL = "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-realtime-token";
  var CALLS_URL = "https://api.openai.com/v1/realtime/calls";
  // Valid 46-byte silent WAV (8 kHz mono); played inside the tap to unlock the <audio> element.
  var SILENT_WAV = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==";
  var MIN_UTTERANCE_MS = 300;
  var POST_PLAYOUT_QUIET_MS = 1000;
  var PLAY_TIMEOUT_MS = 2500;
  var DISCONNECT_GRACE_MS = 5000;
  var DROPPED = "The live voice call dropped. Tap Start live voice to reconnect.";
  // Provider errors that are expected during normal use and must not end the session.
  var BENIGN_ERRORS = { conversation_already_has_active_response: 1, response_cancel_not_active: 1, item_not_found: 1 };

  var pc = null;
  var dc = null;
  var stream = null;
  var audioEl = null;
  var abort = null;
  var current = "idle";
  var generation = 0;
  var opts = {};
  var partial = { user: "", assistant: "" };
  var speakingSince = 0;
  // v1.1.0 state
  var utt = null;            // the utterance currently open on the server VAD
  var lastClosed = null;     // last utterance whose speech_stopped has arrived, waiting for "committed"
  var bleedItems = {};       // conversation item ids of discarded input; their transcripts are not shown
  var audioSessionSet = false;
  var playRetryArmed = false;
  var playRetryGo = null;
  var disconnectTimer = null;
  var RETRY_EVENTS = ["touchend", "mouseup", "click", "keydown"];

  // Client-side cooldown after a failed session start (token HTTP 429 included).
  // The start button (opts.button, else #orb) stays disabled and the state line counts down.
  var COOLDOWN_SECONDS = 60;
  var cooldownUntil = 0;
  var cooldownTimer = null;
  var cooldownLabel = "";

  function setButtonDisabled(flag) {
    try {
      var el = (opts && opts.button) || document.getElementById("orb");
      if (el) el.disabled = !!flag;
    } catch (e) {}
  }

  function cooldownTick() {
    var left = Math.ceil((cooldownUntil - Date.now()) / 1000);
    if (left <= 0) {
      if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
      cooldownUntil = 0;
      setButtonDisabled(false);
      setState("idle", "ready to retry");
      return;
    }
    setButtonDisabled(true);
    setState("error", cooldownLabel + " Try again in " + left + " s.");
  }

  function startCooldown(seconds, label) {
    var secs = Math.max(COOLDOWN_SECONDS, Number(seconds) || 0);
    cooldownUntil = Date.now() + secs * 1000;
    cooldownLabel = label;
    if (cooldownTimer) clearInterval(cooldownTimer);
    cooldownTimer = setInterval(cooldownTick, 1000);
    cooldownTick();
  }

  function setState(next, detail) {
    if (current === next && !detail) return;
    current = next;
    try { if (opts.onState) opts.onState(next, detail || ""); } catch (e) {}
  }

  function notice(message) {
    try { if (opts.onNotice) opts.onNotice(message || ""); } catch (e) {}
  }

  function fail(message) {
    try { console.warn("[siindex-realtime]", message); } catch (e) {}
    try { if (opts.onError) opts.onError(message); } catch (e) {}
    teardown();
    setState("error", message);
  }

  // Plain-language reason for a failed start. The technical detail goes to the console only.
  function describeError(err) {
    var name = err && err.name;
    var msg = String((err && err.message) || err || "");
    try { console.warn("[siindex-realtime] start failed:", name, msg); } catch (e) {}
    if (err && err.status === 429) return { text: "Live voice is busy right now.", limited: true };
    if (name === "NotAllowedError" || name === "SecurityError") return { text: "Live voice needs your microphone. Allow it in your browser settings, then tap Start live voice." };
    if (name === "NotFoundError" || name === "OverconstrainedError") return { text: "No microphone was found on this device." };
    if (name === "NotReadableError") return { text: "Your microphone is being used by another app. Close it and try again." };
    if (name === "AbortError") return { text: "Live voice took too long to connect. Check your connection and try again." };
    if (typeof navigator !== "undefined" && navigator.onLine === false) return { text: "You seem to be offline. Check your connection and try again." };
    var http = /HTTP (\d{3})/.exec(msg);
    if (http) {
      var code = Number(http[1]);
      if (/^token/.test(msg) && code === 403) return { text: "Live voice isn't available from this page." };
      if (code >= 500) return { text: "Live voice is unavailable right now. Please try again soon." };
      return { text: "Couldn't connect to the voice service. Please try again." };
    }
    return { text: "Live voice couldn't start. Please try again." };
  }

  function clearUtt() {
    if (utt && utt.timer) { clearTimeout(utt.timer); utt.timer = null; }
    utt = null;
  }

  function removePlayRetry() {
    if (playRetryGo) { RETRY_EVENTS.forEach(function (n) { try { document.removeEventListener(n, playRetryGo, true); } catch (e) {} }); }
    playRetryGo = null;
    playRetryArmed = false;
  }

  // Hard close: everything is torn down synchronously, nothing is left running.
  function teardown() {
    generation++;
    if (abort) { try { abort.abort(); } catch (e) {} abort = null; }
    if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
    clearUtt();
    lastClosed = null;
    bleedItems = {};
    removePlayRetry();
    if (dc) { try { dc.onmessage = null; dc.onclose = null; dc.close(); } catch (e) {} dc = null; }
    if (pc) {
      try { pc.ontrack = null; pc.onconnectionstatechange = null; } catch (e) {}
      try { pc.getSenders().forEach(function (s) { if (s.track) s.track.stop(); }); } catch (e) {}
      try { pc.close(); } catch (e) {}
      pc = null;
    }
    if (stream) {
      try { stream.getTracks().forEach(function (t) { t.onended = null; t.onmute = null; t.onunmute = null; t.stop(); }); } catch (e) {}
      stream = null;
    }
    if (audioEl) { try { audioEl.pause(); audioEl.srcObject = null; audioEl.remove(); } catch (e) {} audioEl = null; }
    partial = { user: "", assistant: "" };
    speakingSince = 0;
  }

  function send(evt) {
    if (dc && dc.readyState === "open") { try { dc.send(JSON.stringify(evt)); } catch (e) {} }
  }

  // ---- Fix 1: audio element, unlocked inside the tap -------------------------------------------
  // Called synchronously from start(), before any await. The element is started on a silent WAV now;
  // the live stream is attached to the same element later (srcObject replaces src). load() is never
  // called, because it cancels the unlock.
  function prepareAudioElement() {
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    try { audioEl.setAttribute("playsinline", ""); } catch (e) {}
    audioEl.style.display = "none";
    document.body.appendChild(audioEl);
    try {
      audioEl.src = SILENT_WAV;
      var p = audioEl.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  // Start playing the remote stream. A rejected or hung play() shows one line and retries on a tap.
  function playRemote() {
    if (!audioEl) return;
    var el = audioEl;
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; if (el === audioEl) blockedAudio(); }, PLAY_TIMEOUT_MS);
    var p;
    try { p = el.play(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(function () {
      clearTimeout(timer);
      if (el === audioEl) { removePlayRetry(); notice(""); }
    }).catch(function () {
      clearTimeout(timer);
      if (el === audioEl && !timedOut) blockedAudio();
    });
  }

  function blockedAudio() {
    notice("Tap anywhere to turn on the voice. Your browser is holding sound until you do.");
    if (playRetryArmed) return;
    playRetryArmed = true;
    playRetryGo = function (ev) {
      if (ev && ev.isTrusted === false) return;
      removePlayRetry();
      playRemote();
    };
    RETRY_EVENTS.forEach(function (n) { try { document.addEventListener(n, playRetryGo, { capture: true, passive: true }); } catch (e) {} });
  }

  // ---- Fix 3: audio session (iOS 17+) ----------------------------------------------------------
  // Set once at session open, never changed afterwards. Feature-detected: nothing happens where the API is missing.
  function setAudioSessionOnce() {
    if (audioSessionSet) return;
    audioSessionSet = true;
    try {
      if (navigator.audioSession && "type" in navigator.audioSession && navigator.audioSession.type !== "play-and-record") {
        navigator.audioSession.type = "play-and-record";
      }
    } catch (e) {}
  }

  function mediaAlive() {
    try { return !!stream && stream.getAudioTracks().some(function (t) { return t.readyState === "live"; }); } catch (e) { return false; }
  }

  // Returning to the page (or an interruption ending): check what survived and say so if it did not.
  function checkAfterAway() {
    if (!pc) return;
    var cs = pc.connectionState;
    if (cs === "failed" || cs === "closed" || !mediaAlive()) {
      fail("Live voice stopped while you were away. Tap Start live voice to reconnect.");
      return;
    }
    if (audioEl && audioEl.srcObject && audioEl.paused) playRemote();
  }

  try {
    document.addEventListener("visibilitychange", function () {
      // Never tear anything down on "hidden". Only look again when the page is visible.
      if (document.visibilityState === "visible") checkAfterAway();
    });
  } catch (e) {}
  try {
    if (navigator.audioSession && navigator.audioSession.addEventListener) {
      navigator.audioSession.addEventListener("statechange", function () {
        if (!pc) return;
        var state = "";
        try { state = navigator.audioSession.state; } catch (e) {}
        if (state === "interrupted" || state === "inactive") {
          notice("Live voice is paused by a call or another app. It resumes when you return.");
        } else if (state === "active") {
          notice("");
          checkAfterAway();
        }
      });
    }
  } catch (e) {}

  // ---- Fix 2: echo guard + barge-in decided on the client --------------------------------------
  // The session runs with interrupt_response=false and create_response=false, so the server neither
  // cuts a reply off nor answers by itself. Input counts as a real utterance only if it lasts at least
  // MIN_UTTERANCE_MS and did not start in the first POST_PLAYOUT_QUIET_MS after playback began.
  // Anything else is echo of SIINDEX's own voice: no cancel, no state change, no transcript, no reply.
  function acceptUtterance(u) {
    if (utt !== u || u.accepted) return;
    u.accepted = true;
    if (current === "speaking" || current === "thinking") {
      send({ type: "response.cancel" });
      send({ type: "output_audio_buffer.clear" });
    }
    partial.user = "";
    setState("listening", "you are speaking");
  }

  function onSpeechStarted(e) {
    var now = Date.now();
    var talking = current === "speaking";
    var quiet = talking && speakingSince > 0 && (now - speakingSince) < POST_PLAYOUT_QUIET_MS;
    clearUtt();
    var u = { t0: now, ms0: (e && typeof e.audio_start_ms === "number") ? e.audio_start_ms : null, quiet: quiet, accepted: false, bleed: false, valid: false, timer: null };
    utt = u;
    if (quiet) return;
    u.timer = setTimeout(function () { acceptUtterance(u); }, MIN_UTTERANCE_MS);
  }

  function onSpeechStopped(e) {
    var u = utt;
    if (!u) { setState("thinking"); return; }
    if (u.timer) { clearTimeout(u.timer); u.timer = null; }
    var dur = (e && typeof e.audio_end_ms === "number" && u.ms0 !== null) ? (e.audio_end_ms - u.ms0) : (Date.now() - u.t0);
    if (u.quiet || dur < MIN_UTTERANCE_MS) {
      u.bleed = true;
      try { console.info("[siindex-realtime] dropped echo bleed (" + dur + " ms, quiet window " + u.quiet + ")"); } catch (x) {}
    } else {
      if (!u.accepted) acceptUtterance(u);
      u.valid = true;
      setState("thinking");
    }
    lastClosed = u;
    utt = null;
  }

  function onCommitted(e) {
    var u = lastClosed;
    lastClosed = null;
    if (!u) return;
    if (u.bleed) {
      // Take the echo out of the conversation so the model never sees it.
      if (e && e.item_id) {
        bleedItems[e.item_id] = 1;
        send({ type: "conversation.item.delete", item_id: e.item_id });
      }
    } else if (u.valid) {
      send({ type: "response.create" });
    }
  }

  function onEvent(raw) {
    var e;
    try { e = JSON.parse(raw); } catch (err) { return; }
    switch (e.type) {
      case "input_audio_buffer.speech_started":
        onSpeechStarted(e);
        break;
      case "input_audio_buffer.speech_stopped":
        onSpeechStopped(e);
        break;
      case "input_audio_buffer.committed":
        onCommitted(e);
        break;
      case "conversation.item.input_audio_transcription.delta":
        if (e.item_id && bleedItems[e.item_id]) break;
        partial.user += e.delta || "";
        try { if (opts.onTranscript) opts.onTranscript("user", partial.user, false); } catch (x) {}
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (e.item_id && bleedItems[e.item_id]) { delete bleedItems[e.item_id]; partial.user = ""; break; }
        try { if (opts.onTranscript) opts.onTranscript("user", e.transcript || partial.user, true); } catch (x) {}
        partial.user = "";
        break;
      case "response.created":
        partial.assistant = "";
        setState("thinking");
        break;
      case "output_audio_buffer.started":
        speakingSince = Date.now();
        setState("speaking");
        break;
      case "response.output_audio_transcript.delta":
        partial.assistant += e.delta || "";
        try { if (opts.onTranscript) opts.onTranscript("assistant", partial.assistant, false); } catch (x) {}
        break;
      case "response.output_audio_transcript.done":
        try { if (opts.onTranscript) opts.onTranscript("assistant", e.transcript || partial.assistant, true); } catch (x) {}
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        speakingSince = 0;
        setState("listening");
        break;
      case "response.done":
        if (current !== "speaking") setState("listening");
        break;
      case "error":
        if (e.error && BENIGN_ERRORS[e.error.code]) break;
        try { console.warn("[siindex-realtime] provider error:", JSON.stringify(e.error || {}).slice(0, 300)); } catch (x) {}
        fail("Live voice hit a problem and stopped. Tap Start live voice to try again.");
        break;
    }
  }

  async function start(options) {
    if (current !== "idle" && current !== "error") return;
    opts = options || {};
    if (cooldownUntil > Date.now()) { cooldownTick(); return; }
    var gen = ++generation;
    setState("connecting");
    notice("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof RTCPeerConnection === "undefined") {
      return fail("This browser cannot do live voice. Use the text box.");
    }
    // Everything that needs the tap happens here, synchronously, before the first await.
    setAudioSessionOnce();
    prepareAudioElement();
    abort = new AbortController();
    var timer = setTimeout(function () { try { abort.abort(); } catch (e) {} }, 20000);
    try {
      // 1. Short-lived secret from our edge function. The consent header is the same gate the other voice endpoints use.
      var tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        signal: abort.signal,
        headers: { "Content-Type": "application/json", "x-siindex-provider-consent": "accepted" },
        body: "{}"
      });
      if (!tokenRes.ok) {
        var body = ""; try { body = (await tokenRes.text()).slice(0, 200); } catch (e) {}
        var httpErr = new Error("token HTTP " + tokenRes.status + " " + body);
        httpErr.status = tokenRes.status;
        try { httpErr.retryAfter = Number(JSON.parse(body).retry_after_seconds) || 0; } catch (e) {}
        throw httpErr;
      }
      var tok = await tokenRes.json();
      if (!tok || !tok.client_secret) throw new Error("token response had no client_secret");
      if (gen !== generation) return;

      // 2. Microphone.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (gen !== generation) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; return; }
      stream.getAudioTracks().forEach(function (t) {
        t.onended = function () { if (gen === generation && pc) fail("Your microphone stopped. Tap Start live voice to reconnect."); };
        t.onmute = function () { if (gen === generation && pc) notice("Your microphone is paused by your device. It should come back by itself."); };
        t.onunmute = function () { if (gen === generation && pc) notice(""); };
      });

      // 3. WebRTC.
      pc = new RTCPeerConnection();
      pc.ontrack = function (ev) {
        if (!audioEl) return;
        audioEl.srcObject = ev.streams[0];
        playRemote();
      };
      pc.onconnectionstatechange = function () {
        if (!pc) return;
        var cs = pc.connectionState;
        if (cs === "connected") {
          if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; notice(""); }
        } else if (cs === "disconnected") {
          // Often brief on mobile (network switch): give it a few seconds before giving up.
          notice("The connection is unstable. Trying to reconnect…");
          if (!disconnectTimer) {
            disconnectTimer = setTimeout(function () {
              disconnectTimer = null;
              if (pc && pc.connectionState !== "connected") fail(DROPPED);
            }, DISCONNECT_GRACE_MS);
          }
        } else if (cs === "failed" || cs === "closed") {
          if (current !== "idle") fail(DROPPED);
        }
      };
      stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });
      dc = pc.createDataChannel("oai-events");
      dc.onmessage = function (m) { onEvent(m.data); };
      dc.onclose = function () { if (gen === generation && current !== "idle" && current !== "error") fail(DROPPED); };
      dc.onopen = function () {
        // The client decides when to interrupt a reply (echo guard) and when to ask for one, so both
        // server-side automatic behaviours are off. Values are a first choice, not tuned on a device.
        send({
          type: "session.update",
          session: {
            type: "realtime",
            audio: {
              input: {
                transcription: { model: "gpt-4o-mini-transcribe" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.6,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 600,
                  create_response: false,
                  interrupt_response: false
                }
              }
            }
          }
        });
        setState("listening");
      };

      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      var sdpRes = await fetch(CALLS_URL, {
        method: "POST",
        signal: abort.signal,
        headers: { "Authorization": "Bearer " + tok.client_secret, "Content-Type": "application/sdp" },
        body: offer.sdp
      });
      if (!sdpRes.ok) throw new Error("realtime HTTP " + sdpRes.status);
      var answer = await sdpRes.text();
      if (gen !== generation) return;
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      clearTimeout(timer);
    } catch (err) {
      clearTimeout(timer);
      if (gen !== generation) return;
      var info = describeError(err);
      fail(info.text);
      startCooldown(info.limited ? err.retryAfter : 0, info.text);
    }
  }

  function stop() {
    var was = current;
    teardown();
    notice("");
    if (was !== "idle") setState("idle", "stopped");
  }

  window.SIINDEXRealtime = {
    version: "1.1.0",
    start: start,
    stop: stop,
    isActive: function () { return current !== "idle" && current !== "error"; },
    state: function () { return current; }
  };
})();
