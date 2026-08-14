/**
 * SIINDEX Website Voice Core v3.0.4
 * Interrupt must not fall through to full speechSynthesis restart.
 * Spoken name lock: Sinn-dex only (never Sign-dex).
 */
(function () {
  "use strict";
  if (window.SIINDEXVoice && window.SIINDEXVoice.version === "3.0.4") return;

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
  const TRANSCRIPTION_REQUEST_TIMEOUT_MS = 30000;
  const MAX_RECORDING_MS = 20000;

  let voiceAbort = null;
  let runtimeAbort = null;
  let transcriptionAbort = null;
  let audioContext = null;
  let playbackGeneration = 0;
  const activeAudioSources = new Set();
  let voiceEnabled = localStorage.getItem(VOICE_KEY) !== "false";
  let busy = false;
  let microphoneStream = null;
  let recorder = null;
  let recordingChunks = [];
  let recordingTimer = null;

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
      await playPcmStream(response);
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
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(spoken);
        utterance.lang = "en-US";
        utterance.rate = 0.94;
        utterance.pitch = 1.03;
        utterance.onend = function () { setStatus("idle", "Ready."); };
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      } else {
        setStatus("error", "Voice unavailable.");
      }
    }
  }

  function interrupt(message, notify) {
    if (runtimeAbort) runtimeAbort.abort();
    if (transcriptionAbort) transcriptionAbort.abort();
    if (voiceAbort) voiceAbort.abort();
    stopPcmPlayback();
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {}
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

  function preferredMimeType() {
    if (!window.MediaRecorder) return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    return candidates.find(function (type) {
      return MediaRecorder.isTypeSupported(type);
    }) || "";
  }

  function stopMicrophoneTracks() {
    if (!microphoneStream) return;
    microphoneStream.getTracks().forEach(function (track) {
      try { track.stop(); } catch (_) {}
    });
    microphoneStream = null;
  }

  function requestProviderConsent() {
    if (localStorage.getItem(PROVIDER_CONSENT_KEY) === "accepted") return true;
    const accepted = window.confirm(
      "Before SIINDEX listens: microphone audio is sent to ElevenLabs for transcription. " +
      "The transcript is sent to Anthropic for an answer. IN$DEX does not store raw audio. Continue?"
    );
    if (accepted) localStorage.setItem(PROVIDER_CONSENT_KEY, "accepted");
    return accepted;
  }

  async function transcribeRecording(blob, mimeType, source) {
    setStatus("transcribing", "Turning your voice into text…");
    const form = new FormData();
    const extension = mimeType.indexOf("mp4") !== -1 ? "mp4"
      : mimeType.indexOf("ogg") !== -1 ? "ogg" : "webm";
    form.append("audio", blob, "siindex-question." + extension);

    const controller = new AbortController();
    transcriptionAbort = controller;
    const timer = setTimeout(function () {
      controller.abort();
    }, TRANSCRIPTION_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(ENDPOINTS.transcribe, {
        method: "POST",
        signal: controller.signal,
        headers: headers(),
        body: form,
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || "transcription_" + response.status);
      const transcript = String(data.transcript || "").trim();
      if (!transcript) throw new Error("no_speech_detected");
      await ask(transcript, { source: source });
    } finally {
      clearTimeout(timer);
      if (transcriptionAbort === controller) transcriptionAbort = null;
    }
  }

  async function listen(opts) {
    opts = opts || {};
    const source = opts.source || "public-home";

    if (recorder && recorder.state !== "inactive") {
      clearTimeout(recordingTimer);
      recordingTimer = null;
      recorder.stop();
      setStatus("transcribing", "Voice captured. Preparing your question…");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      setStatus("error", "Microphone recording is unavailable here. Typing still works.");
      emitMessage("si", "Microphone recording is unavailable in this browser. You can type your question below.", source);
      return;
    }
    if (!requestProviderConsent()) {
      setStatus("idle", "Microphone not started. Typing still works.");
      return;
    }

    interrupt("Opening microphone…", false);
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const track = microphoneStream.getAudioTracks()[0];
      if (!track || track.readyState !== "live") throw new Error("microphone_not_live");

      const mimeType = preferredMimeType();
      recorder = mimeType
        ? new MediaRecorder(microphoneStream, { mimeType: mimeType })
        : new MediaRecorder(microphoneStream);
      recordingChunks = [];

      recorder.ondataavailable = function (event) {
        if (event.data && event.data.size) recordingChunks.push(event.data);
      };
      recorder.onerror = function () {
        clearTimeout(recordingTimer);
        recordingTimer = null;
        stopMicrophoneTracks();
        recorder = null;
        setStatus("error", "Microphone recording failed. Typing still works.");
      };
      recorder.onstop = async function () {
        clearTimeout(recordingTimer);
        recordingTimer = null;
        const recordedMime = recorder && recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(recordingChunks, { type: recordedMime });
        recordingChunks = [];
        recorder = null;
        stopMicrophoneTracks();

        if (blob.size < 500) {
          setStatus("error", "I did not hear enough audio. Tap the microphone and try again.");
          return;
        }
        try {
          await transcribeRecording(blob, recordedMime, source);
        } catch (error) {
          if (error && error.name === "AbortError") {
            setStatus("idle", "Transcription stopped. Typing still works.");
          } else {
            setStatus("error", "SIINDEX could not transcribe that recording. Typing still works.");
            emitMessage("si", "I could not transcribe that recording. Please try the microphone again or type your question.", source);
          }
        }
      };

      recorder.start(250);
      setStatus("listening", "Listening… Tap the microphone again when you finish.");
      recordingTimer = setTimeout(function () {
        if (recorder && recorder.state !== "inactive") recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (error) {
      stopMicrophoneTracks();
      recorder = null;
      const name = error && error.name;
      const message = name === "NotAllowedError"
        ? "Microphone permission was denied. Allow access in your browser settings or type your question."
        : name === "NotFoundError"
          ? "No microphone was found. You can type your question."
          : name === "NotReadableError"
            ? "The microphone is busy in another app. Close it there and try again."
            : "SIINDEX could not open the microphone. Typing still works.";
      setStatus("error", message);
      emitMessage("si", message, source);
    }
  }

  window.SIINDEXVoice = {
    version: "3.0.4",
    speak: speak,
    interrupt: interrupt,
    ask: ask,
    listen: listen,
    setVoiceEnabled: function (on) {
      voiceEnabled = !!on;
      localStorage.setItem(VOICE_KEY, voiceEnabled ? "true" : "false");
    },
  };

  setStatus("ready", "Ready. Tap the microphone to speak or type below.");
})();
