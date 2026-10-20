/*
 * SIINDEX real-time voice (OpenAI Realtime over WebRTC).
 * Additional voice channel only: it does not touch text Q&A, the board, the log or mailto flows.
 * Audio goes browser -> OpenAI directly. The long-lived key stays in the siindex-realtime-token
 * edge function; this file only ever holds a 60-second ephemeral client secret.
 * The voice is an OpenAI built-in voice, NOT the locked ElevenLabs voice (iBEZxKDWKDCs8WbjiLKK).
 *
 * API:  SIINDEXRealtime.start(opts) / .stop() / .isActive() / .state()
 * opts: { onState(state, detail), onTranscript(role, text, final), onError(message) }
 * states: idle | connecting | listening | thinking | speaking | error
 */
(function () {
  "use strict";
  if (window.SIINDEXRealtime) return;

  var TOKEN_URL = "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-realtime-token";
  var CALLS_URL = "https://api.openai.com/v1/realtime/calls";

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

  function setState(next, detail) {
    if (current === next && !detail) return;
    current = next;
    try { if (opts.onState) opts.onState(next, detail || ""); } catch (e) {}
  }

  function fail(message) {
    try { console.warn("[siindex-realtime]", message); } catch (e) {}
    try { if (opts.onError) opts.onError(message); } catch (e) {}
    teardown();
    setState("error", message);
  }

  // Hard close: everything is torn down synchronously, nothing is left running.
  function teardown() {
    generation++;
    if (abort) { try { abort.abort(); } catch (e) {} abort = null; }
    if (dc) { try { dc.onmessage = null; dc.onclose = null; dc.close(); } catch (e) {} dc = null; }
    if (pc) {
      try { pc.ontrack = null; pc.onconnectionstatechange = null; } catch (e) {}
      try { pc.getSenders().forEach(function (s) { if (s.track) s.track.stop(); }); } catch (e) {}
      try { pc.close(); } catch (e) {}
      pc = null;
    }
    if (stream) { try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} stream = null; }
    if (audioEl) { try { audioEl.pause(); audioEl.srcObject = null; audioEl.remove(); } catch (e) {} audioEl = null; }
    partial = { user: "", assistant: "" };
  }

  function send(evt) {
    if (dc && dc.readyState === "open") { try { dc.send(JSON.stringify(evt)); } catch (e) {} }
  }

  function onEvent(raw) {
    var e;
    try { e = JSON.parse(raw); } catch (err) { return; }
    switch (e.type) {
      case "input_audio_buffer.speech_started":
        // Barge-in: cut the reply off immediately instead of waiting for the server.
        if (current === "speaking" || current === "thinking") {
          send({ type: "response.cancel" });
          send({ type: "output_audio_buffer.clear" });
        }
        partial.user = "";
        setState("listening", "you are speaking");
        break;
      case "input_audio_buffer.speech_stopped":
        setState("thinking");
        break;
      case "conversation.item.input_audio_transcription.delta":
        partial.user += e.delta || "";
        try { if (opts.onTranscript) opts.onTranscript("user", partial.user, false); } catch (x) {}
        break;
      case "conversation.item.input_audio_transcription.completed":
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
        setState("listening");
        break;
      case "response.done":
        if (current !== "speaking") setState("listening");
        break;
      case "error":
        fail((e.error && (e.error.message || e.error.code)) || "provider error");
        break;
    }
  }

  async function start(options) {
    if (current !== "idle" && current !== "error") return;
    opts = options || {};
    var gen = ++generation;
    setState("connecting");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof RTCPeerConnection === "undefined") {
      return fail("This browser cannot do live voice. Use the text box.");
    }
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
        throw new Error("token HTTP " + tokenRes.status + " " + body);
      }
      var tok = await tokenRes.json();
      if (!tok || !tok.client_secret) throw new Error("token response had no client_secret");
      if (gen !== generation) return;

      // 2. Microphone.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (gen !== generation) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; return; }

      // 3. WebRTC.
      pc = new RTCPeerConnection();
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      pc.ontrack = function (ev) { if (audioEl) audioEl.srcObject = ev.streams[0]; };
      pc.onconnectionstatechange = function () {
        if (!pc) return;
        if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
          if (current !== "idle") { teardown(); setState("idle", "connection closed"); }
        }
      };
      stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });
      dc = pc.createDataChannel("oai-events");
      dc.onmessage = function (m) { onEvent(m.data); };
      dc.onopen = function () {
        send({ type: "session.update", session: { type: "realtime", audio: { input: { transcription: { model: "gpt-4o-mini-transcribe" } } } } });
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
      var name = err && err.name;
      fail(name === "NotAllowedError" ? "Microphone blocked. Allow the mic, or use the text box."
        : name === "AbortError" ? "Live voice timed out."
        : String((err && err.message) || err));
    }
  }

  function stop() {
    var was = current;
    teardown();
    if (was !== "idle") setState("idle", "stopped");
  }

  window.SIINDEXRealtime = {
    version: "1.0.0",
    start: start,
    stop: stop,
    isActive: function () { return current !== "idle" && current !== "error"; },
    state: function () { return current; }
  };
})();
