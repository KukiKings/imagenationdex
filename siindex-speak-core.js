/**
 * SIINDEX Website Voice Core v3.0.10
 * Interrupt must not fall through to full speechSynthesis restart.
 * Spoken name lock: Sinn-dex only (never Sign-dex).
 * Mic: MediaRecorder + siindex-website-transcribe; MIME/filename match for Safari mp4.
 * v3.0.10: no timeslice — incomplete webm/mp4 containers caused ElevenLabs provider 400.
 */
(function () {
  "use strict";
  if (window.SIINDEXVoice && window.SIINDEXVoice.version === "3.0.10") return;

  const SUPABASE_URL = "https://zljgthfzbalsunuoohcd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rSl7P028UrBn8KCUSSbjAg_mT3FWoxV";
  const ENDPOINTS = {
    runtime: SUPABASE_URL + "/functions/v1/siindex-website-runtime",
    transcribe: SUPABASE_URL + "/functions/v1/siindex-website-transcribe",
    voice: SUPABASE_URL + "/functions/v1/siindex-website-voice-tts",
  };
  const HISTORY_KEY = "siindex_website_conversation_v3";
  const VISITOR_KEY = "siindex_website_visitor_id";
  const VOICE_KEY = "siindex_website_voice_enabled";
  const PROVIDER_CONSENT_KEY = "siindex_website_provider_consent_v1";
  const VOICE_REQUEST_TIMEOUT_MS = 30000;

  let voiceAbort = null;
  let runtimeAbort = null;
  let transcriptionAbort = null;
  let audioContext = null;
  let playbackGeneration = 0;
  const activeAudioSources = new Set();
  let voiceEnabled = localStorage.getItem(VOICE_KEY) !== "false";
  let busy = false;

  function visitorId() {
    let value = localStorage.getItem(VISITOR_KEY);
    if (!value) {
      value = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : "visitor-" + Date.now();
      localStorage.setItem(VISITOR_KEY, value);
    }
    return value;
  }

  function headers(contentType) {
    const result = {
      apikey: SUPABASE_KEY,
      "x-siindex-visitor-id": visitorId(),
      "x-siindex-provider-consent":
        localStorage.getItem(PROVIDER_CONSENT_KEY) === "accepted" ? "accepted" : "not-accepted",
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

  async function ensureAudioContext() {
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContext = new Ctx();
    }
    if (audioContext.state === "suspended") {
      try { await audioContext.resume(); } catch (_) {}
    }
    return audioContext;
  }

  async function playPcmStream(response) {
    const context = await ensureAudioContext();
    if (!context || !response.body) throw new Error("streaming_audio_unavailable");
    const generation = ++playbackGeneration;
    const reader = response.body.getReader();
    const frameBytes = 8192;
    let pending = new Uint8Array(0);
    let nextStartAt = context.currentTime + 0.08;

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
      try { source.start(); } catch (error) {
        activeAudioSources.delete(source);
        reject(error);
      }
    });
  }

  async function speak(text) {
    if (!voiceEnabled || !text) return;
    const controller = new AbortController();
    voiceAbort = controller;
    let voiceTimedOut = false;
    const voiceTimer = setTimeout(function () {
      voiceTimedOut = true;
      controller.abort();
    }, VOICE_REQUEST_TIMEOUT_MS);
    const spoken = pronunciation(text);
    try {
      setStatus("speaking", "SIINDEX is speaking…");
      const response = await fetch(ENDPOINTS.voice, {
        method: "POST",
        signal: controller.signal,
        headers: headers("application/json"),
        body: JSON.stringify({ text: spoken }),
      });
      clearTimeout(voiceTimer);
      if (!response.ok) throw new Error("voice_http_" + response.status);
      await playVoiceResponse(response);
      if (!controller.signal.aborted) setStatus("idle", "Ready.");
    } catch (error) {
      clearTimeout(voiceTimer);
      if (controller.signal.aborted && !voiceTimedOut) {
        setStatus("idle", "Paused.");
        return;
      }
      if (error && error.name === "AbortError" && !voiceTimedOut) {
        setStatus("idle", "Paused.");
        return;
      }
      setStatus("error", "SIINDEX voice unavailable. Response remains available as text.");
    }
  }

  function interrupt(message, notify) {
    if (runtimeAbort) runtimeAbort.abort();
    if (transcriptionAbort) transcriptionAbort.abort();
    if (voiceAbort) voiceAbort.abort();
    stopPcmPlayback();
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {}
    stopMediaCapture();
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
    interrupt("…", false);
    emitMessage("user", text, source);

    const local = window.SIINDEX_PUBLIC && typeof SIINDEX_PUBLIC.answer === "function"
      ? SIINDEX_PUBLIC.answer(text) : null;
    if (local) {
      emitMessage("si", local, source);
      if (voiceEnabled) {
        try { await speak(local); } catch (_) {}
      }
      return;
    }

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
    recordAndTranscribe(source);
  }

  window.SIINDEXVoice = {
    version: "3.0.10",
    speak: speak,
    interrupt: interrupt,
    ask: ask,
    listen: listen,
    setVoiceEnabled: function (on) {
      voiceEnabled = !!on;
      localStorage.setItem(VOICE_KEY, voiceEnabled ? "true" : "false");
    },
  };

  setStatus("ready", "Ready. Tap a chip, type a question, or use the mic.");
})();
