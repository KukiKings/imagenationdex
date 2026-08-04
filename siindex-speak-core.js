/**
 * SIINDEX Website Voice Core v3
 *
 * One shared, real conversation controller for the homepage and every page
 * that already includes this file. It has no account access, tools, or
 * transaction authority.
 */
(function () {
  "use strict";

  if (window.SIINDEXVoice && window.SIINDEXVoice.version === "3.0.0") return;

  const SUPABASE_URL = "https://zljgthfzbalsunuoohcd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rSl7P028UrBn8KCUSSbjAg_mT3FWoxV";
  const ENDPOINTS = {
    runtime: `${SUPABASE_URL}/functions/v1/siindex-website-runtime`,
    transcribe: `${SUPABASE_URL}/functions/v1/siindex-website-transcribe`,
    voice: `${SUPABASE_URL}/functions/v1/siindex-website-voice-tts`,
  };
  const HISTORY_KEY = "siindex_website_conversation_v3";
  const VISITOR_KEY = "siindex_website_visitor_id";
  const VOICE_KEY = "siindex_website_voice_enabled";
  const PROVIDER_CONSENT_KEY = "siindex_website_provider_consent_v1";
  const WEBSITE_MODE =
    location.hostname === "imagenationdex.com" ||
    location.hostname === "www.imagenationdex.com" ||
    location.hostname === "imagenationdex.vercel.app" ||
    location.hostname === "imagenationdex-kukikings.vercel.app" ||
    location.hostname === "imagenation-dex.vercel.app" ||
    location.hostname === "imagenation-dex-kukikings.vercel.app" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    (
      location.hostname.startsWith("imagenationdex-") &&
      location.hostname.endsWith("-kukikings.vercel.app")
    ) ||
    (
      location.hostname.startsWith("imagenation-") &&
      location.hostname.endsWith("-kukikings.vercel.app")
    );
  const MAX_HISTORY = 20;
  const MAX_RECORDING_MS = 20_000;

  let runtimeAbort = null;
  let voiceAbort = null;
  let recorder = null;
  let microphoneStream = null;
  let recordingChunks = [];
  let recordingTimer = null;
  let recordingStartedAt = 0;
  let audioContext = null;
  let playbackGeneration = 0;
  const activeAudioSources = new Set();
  let currentStreamMessage = null;
  let busy = false;
  let recording = false;
  let consentPromise = null;
  let voiceEnabled = localStorage.getItem(VOICE_KEY) !== "false";

  class SiindexError extends Error {
    constructor(code, status, detail) {
      super(code);
      this.name = "SiindexError";
      this.code = code;
      this.status = status;
      this.detail = detail;
    }
  }

  function visitorId() {
    let value = localStorage.getItem(VISITOR_KEY);
    if (!value) {
      value = self.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, value);
    }
    return value;
  }

  function headers(contentType) {
    const result = {
      apikey: SUPABASE_KEY,
      "x-siindex-visitor-id": visitorId(),
      "x-siindex-provider-consent":
        localStorage.getItem(PROVIDER_CONSENT_KEY) === "accepted"
          ? "accepted"
          : "not-accepted",
    };
    if (contentType) result["Content-Type"] = contentType;
    return result;
  }

  function getHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch (_) {
      // Conversation still works when private browsing blocks local storage.
    }
  }

  function explain(reason, next, owner, timeframe) {
    return `Reason: ${reason}\nNext: ${next}\nWho can fix it: ${owner}\nExpected time: ${timeframe}`;
  }

  function errorMessage(error, area) {
    const code = error && (error.code || error.message);
    const status = error && error.status;

    if (code === "NotAllowedError" || code === "permission_denied") {
      return explain(
        "Microphone permission is blocked for this site.",
        "Open the browser's site settings, allow Microphone, then tap the microphone once.",
        "You can change the permission; SIINDEX can retry after it is allowed.",
        "About 1 minute.",
      );
    }
    if (code === "NotFoundError") {
      return explain(
        "No working microphone was found on this device.",
        "Connect or enable a microphone, or use the text box.",
        "You can enable the device; typed SIINDEX works now.",
        "Typing is immediate; microphone timing depends on the device.",
      );
    }
    if (code === "provider_consent_required" || code === "provider_consent_declined") {
      return explain(
        "Visitor Mode needs your permission before it sends microphone audio or typed questions to external providers.",
        "Read the provider notice and choose Continue only if you agree. Do not share passwords, seed phrases, private keys, identity documents, or sensitive account details.",
        "Only you can grant this permission. A human steward is not needed.",
        "Immediate after you choose.",
      );
    }
    if (code === "website_only") {
      return explain(
        "This SIINDEX voice service is available only on the official IN$DEX website.",
        "Open imagenationdex.com and try again.",
        "IN$DEX controls access to the website voice service.",
        "Available immediately on the official website.",
      );
    }
    if (code === "no_speech_detected") {
      return explain(
        "I did not hear a clear spoken question.",
        "Tap the microphone, speak after the listening message appears, then tap again to send.",
        "You can retry; SIINDEX handles the transcription.",
        "Immediate.",
      );
    }
    if (code === "rate_limited" || status === 429) {
      return explain(
        "This device has reached the short safety limit for public SIINDEX requests.",
        "Wait briefly, then try one clear question. You can continue reading the site meanwhile.",
        "The limit resets automatically; a human is not needed.",
        "Usually 1 minute.",
      );
    }
    if (
      code === "transcription_provider_not_configured" ||
      code === "transcription_provider_unavailable" ||
      code === "transcription_provider_error"
    ) {
      return explain(
        "The secure speech-to-text service is not available right now.",
        "Type your question in the box so SIINDEX can still answer.",
        "A project administrator must check the ElevenLabs transcription service.",
        "Text works now; microphone recovery depends on the provider check.",
      );
    }
    if (
      code === "model_provider_not_configured" ||
      code === "model_provider_unavailable" ||
      code === "model_provider_error" ||
      status === 502 ||
      status === 503
    ) {
      return explain(
        "SIINDEX's public conversation service could not complete this request.",
        "Check your connection and retry once. If it repeats, use the contact route and include the correlation ID shown with the error.",
        "SIINDEX can retry; a human administrator is needed if it repeats.",
        "Immediate retry; investigation if repeated.",
      );
    }
    if (area === "voice") {
      return explain(
        "The ElevenLabs voice could not play on this device.",
        "Read the reply or use the device-voice fallback. You can keep typing or speaking.",
        "SIINDEX continues in text; a human checks ElevenLabs only if this repeats.",
        "Text is available now.",
      );
    }
    return explain(
      "The request did not complete.",
      "Check your connection and retry once, or type a shorter question.",
      "SIINDEX can retry; a human is needed only if it repeats.",
      "Immediate retry.",
    );
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(`siindex:${name}`, { detail }));
  }

  function setStatus(state, text) {
    if (ui.status) {
      ui.status.textContent = text || "";
      ui.status.dataset.state = state || "idle";
    }
    if (ui.mic) {
      ui.mic.classList.toggle("listening", state === "listening");
      ui.mic.setAttribute("aria-pressed", state === "listening" ? "true" : "false");
    }
    if (ui.interrupt) {
      ui.interrupt.hidden = !["thinking", "speaking", "transcribing"].includes(state);
    }
    emit("status", { state, text });
  }

  function messageId() {
    return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function normalizeAssistantText(text) {
    return String(text || "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/`([^`\n]+)`/g, "$1");
  }

  function emitMessage(role, text, id, streaming, source) {
    emit("message", {
      role,
      text,
      id,
      streaming: !!streaming,
      source: source || "global",
    });
  }

  function renderMessage(role, text, id) {
    if (!ui.messages) return null;
    ui.empty && (ui.empty.hidden = true);
    let row = id ? ui.messages.querySelector(`[data-message-id="${CSS.escape(id)}"]`) : null;
    if (!row) {
      row = document.createElement("div");
      row.className = `siindex-message ${role}`;
      row.dataset.messageId = id || messageId();

      const sender = document.createElement("div");
      sender.className = "siindex-message-sender";
      sender.textContent = role === "user" ? "You" : "SIINDEX";

      const body = document.createElement("div");
      body.className = "siindex-message-body";
      row.append(sender, body);
      ui.messages.appendChild(row);
    }
    row.querySelector(".siindex-message-body").textContent = text;
    ui.messages.scrollTop = ui.messages.scrollHeight;
    return row;
  }

  function showError(error, area, source) {
    const text = errorMessage(error, area);
    const id = messageId();
    renderMessage("assistant", text, id);
    emitMessage("assistant", text, id, false, source);
    setStatus("error", "SIINDEX explained what happened. Typing remains available.");
  }

  function preferredMimeType() {
    if (!window.MediaRecorder) return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function ensureProviderConsent() {
    if (localStorage.getItem(PROVIDER_CONSENT_KEY) === "accepted") {
      return Promise.resolve(true);
    }
    if (consentPromise) return consentPromise;

    consentPromise = new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "siindex-consent-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:20px;" +
        "background:rgba(6,8,14,.88);backdrop-filter:blur(6px);";

      const dialog = document.createElement("section");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "siindex-consent-title");
      dialog.style.cssText =
        "width:min(100%,520px);max-height:88vh;overflow:auto;padding:24px;border-radius:22px;" +
        "border:1px solid rgba(0,212,255,.35);background:#11141f;color:#f4f6ff;" +
        "box-shadow:0 24px 80px rgba(0,0,0,.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
      dialog.innerHTML = `
        <h2 id="siindex-consent-title" style="margin:0 0 12px;font-size:20px;">Before SIINDEX continues</h2>
        <p style="margin:0 0 12px;color:#c8cede;font-size:13px;line-height:1.6;">SIINDEX voice uses external providers:</p>
        <ul style="margin:0 0 14px;padding-left:20px;color:#c8cede;font-size:13px;line-height:1.7;">
          <li>Microphone audio is sent to ElevenLabs for transcription.</li>
          <li>Your transcript or typed question is sent to Anthropic for the answer.</li>
          <li>SIINDEX's reply is sent to ElevenLabs when voice replies are on.</li>
        </ul>
        <p style="margin:0 0 12px;color:#c8cede;font-size:13px;line-height:1.6;">IN$DEX does not store raw audio or the Visitor Mode conversation on its servers. A copy of the conversation stays only on this device until you clear it.</p>
        <p style="margin:0 0 18px;color:#ffcf72;font-size:13px;line-height:1.6;">Never share passwords, seed phrases, private keys, identity documents, or sensitive account information.</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
          <button type="button" data-si-consent-decline style="border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:10px 16px;background:transparent;color:#d6dbea;cursor:pointer;">Not now</button>
          <button type="button" data-si-consent-accept style="border:0;border-radius:20px;padding:10px 16px;background:linear-gradient(135deg,#00d4ff,#2b35d8);color:#fff;font-weight:800;cursor:pointer;">Continue</button>
        </div>`;
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const finish = (accepted) => {
        if (accepted) localStorage.setItem(PROVIDER_CONSENT_KEY, "accepted");
        overlay.remove();
        emit("consent", { accepted });
        consentPromise = null;
        resolve(accepted);
      };
      const accept = dialog.querySelector("[data-si-consent-accept]");
      const decline = dialog.querySelector("[data-si-consent-decline]");
      accept.addEventListener("click", () => finish(true), { once: true });
      decline.addEventListener("click", () => finish(false), { once: true });
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") finish(false);
      });
      accept.focus();
    });
    return consentPromise;
  }

  function stopTracks() {
    if (microphoneStream) {
      microphoneStream.getTracks().forEach((track) => track.stop());
      microphoneStream = null;
    }
  }

  function stopRecording(shouldTranscribe, source) {
    clearTimeout(recordingTimer);
    recordingTimer = null;
    if (!recorder || recorder.state === "inactive") {
      recording = false;
      stopTracks();
      return;
    }
    recorder._shouldTranscribe = shouldTranscribe !== false;
    recorder._source = source || recorder._source || "global";
    try {
      recorder.stop();
    } catch (_) {
      recording = false;
      stopTracks();
    }
  }

  async function startRecording(options) {
    const source = options && options.source || "global";
    const onTranscript = options && options.onTranscript;
    const onError = options && options.onError;
    const onEnd = options && options.onEnd;
    const autoStopMs = Math.min(
      Math.max(Number(options && options.autoStopMs) || MAX_RECORDING_MS, 1000),
      MAX_RECORDING_MS,
    );
    if (recording) {
      stopRecording(true, source);
      return;
    }
    if (!WEBSITE_MODE) {
      const error = new SiindexError("website_only");
      if (typeof onError === "function") onError(error);
      else showError(error, "access", source);
      if (typeof onEnd === "function") onEnd();
      return;
    }
    if (!await ensureProviderConsent()) {
      const error = new SiindexError("provider_consent_declined");
      if (typeof onError === "function") onError(error);
      else showError(error, "consent", source);
      if (typeof onEnd === "function") onEnd();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      const error = new SiindexError("microphone_not_supported");
      if (typeof onError === "function") onError(error);
      else showError(error, "microphone", source);
      if (typeof onEnd === "function") onEnd();
      return;
    }

    interrupt("Microphone opened. Previous speech and response stopped.", false);
    try {
      await ensureAudioContext().catch(() => null);
      microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      const mimeType = preferredMimeType();
      recorder = mimeType
        ? new MediaRecorder(microphoneStream, { mimeType })
        : new MediaRecorder(microphoneStream);
      recordingChunks = [];
      recordingStartedAt = Date.now();
      recorder._source = source;
      recorder._shouldTranscribe = true;
      recorder._onTranscript = onTranscript;
      recorder._onError = onError;
      recorder._onEnd = onEnd;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size) recordingChunks.push(event.data);
      };
      recorder.onerror = (event) => {
        recording = false;
        stopTracks();
        const error = event.error || new Error("recording_failed");
        if (typeof onError === "function") onError(error);
        else showError(error, "microphone", source);
        if (typeof onEnd === "function") onEnd();
      };
      recorder.onstop = async () => {
        const shouldTranscribe = recorder._shouldTranscribe;
        const requestSource = recorder._source || source;
        const transcriptHandler = recorder._onTranscript;
        const errorHandler = recorder._onError;
        const endHandler = recorder._onEnd;
        const mime = recorder.mimeType || mimeType || "audio/webm";
        recording = false;
        stopTracks();
        const duration = Date.now() - recordingStartedAt;
        const blob = new Blob(recordingChunks, { type: mime });
        recordingChunks = [];
        recorder = null;

        if (!shouldTranscribe) {
          setStatus("idle", "Ready. Tap the microphone to speak.");
          if (typeof endHandler === "function") endHandler();
          return;
        }
        if (duration < 350 || blob.size < 500) {
          const error = new SiindexError("no_speech_detected");
          if (typeof errorHandler === "function") errorHandler(error);
          else showError(error, "microphone", requestSource);
          if (typeof endHandler === "function") endHandler();
          return;
        }
        try {
          const transcript = await transcribeAudio(blob, mime, requestSource);
          emit("transcript", { text: transcript, source: requestSource });
          if (typeof transcriptHandler === "function") {
            await transcriptHandler(transcript);
            setStatus("idle", "Voice captured.");
          } else {
            await ask(transcript, { source: requestSource });
          }
        } catch (error) {
          if (typeof errorHandler === "function") errorHandler(error);
          else showError(error, "transcription", requestSource);
        } finally {
          if (typeof endHandler === "function") endHandler();
        }
      };

      recorder.start(250);
      recording = true;
      setStatus(
        "listening",
        "Listening. Speak now, then tap the microphone again to send.",
      );
      recordingTimer = setTimeout(() => stopRecording(true, source), autoStopMs);
    } catch (error) {
      recording = false;
      stopTracks();
      if (typeof onError === "function") onError(error);
      else showError(error, "microphone", source);
      if (typeof onEnd === "function") onEnd();
    }
  }

  function audioExtension(mime) {
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("wav")) return "wav";
    return "webm";
  }

  async function transcribeAudio(blob, mime, source) {
    setStatus("transcribing", "Turning your voice into text. Audio is not being saved.");
    const data = new FormData();
    data.append("audio", blob, `siindex-question.${audioExtension(mime)}`);

    const response = await fetch(ENDPOINTS.transcribe, {
      method: "POST",
      headers: headers(),
      body: data,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new SiindexError(result.error || "transcription_failed", response.status, result);
    }
    const transcript = String(result.transcript || "").trim();
    if (!transcript) throw new SiindexError("no_speech_detected", 422, result);
    return transcript;
  }

  async function readFailure(response) {
    const result = await response.json().catch(() => ({}));
    throw new SiindexError(
      result.error || `request_failed_${response.status}`,
      response.status,
      result,
    );
  }

  async function ask(text, options) {
    const source = options && options.source || "global";
    text = String(text || "").trim();
    if (!text || busy) return;
    if (!WEBSITE_MODE) {
      showError(new SiindexError("website_only"), "access", source);
      return;
    }
    if (!await ensureProviderConsent()) {
      showError(
        new SiindexError("provider_consent_declined"),
        "consent",
        source,
      );
      return;
    }
    if (text.length > 1200) text = text.slice(0, 1200);

    interrupt("Preparing your question…", false);
    busy = true;
    const userId = messageId();
    renderMessage("user", text, userId);
    emitMessage("user", text, userId, false, source);

    const history = getHistory();
    const assistantId = messageId();
    currentStreamMessage = assistantId;
    renderMessage("assistant", "Thinking…", assistantId);
    emitMessage("assistant", "Thinking…", assistantId, true, source);
    setStatus("thinking", "SIINDEX is thinking…");
    runtimeAbort = new AbortController();
    let rawText = "";
    let fullText = "";

    try {
      const response = await fetch(ENDPOINTS.runtime, {
        method: "POST",
        signal: runtimeAbort.signal,
        headers: headers("application/json"),
        body: JSON.stringify({
          message: text,
          history: history.slice(-8),
        }),
      });
      if (!response.ok || !response.body) await readFailure(response);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const event = JSON.parse(raw);
            if (event.text) {
              rawText += event.text;
              fullText = normalizeAssistantText(rawText);
              renderMessage("assistant", fullText, assistantId);
              emitMessage("assistant", fullText, assistantId, true, source);
            }
          } catch (_) {
            // Ignore incomplete SSE lines.
          }
        }
      }
      if (!fullText.trim()) throw new SiindexError("empty_response", 502);

      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: fullText });
      saveHistory(history);
      emitMessage("assistant", fullText, assistantId, false, source);
      setStatus("idle", "Response complete.");
      if (voiceEnabled) await speak(fullText);
    } catch (error) {
      if (error && error.name === "AbortError") {
        const stopped = fullText || "Response interrupted.";
        renderMessage("assistant", stopped, assistantId);
        emitMessage("assistant", stopped, assistantId, false, source);
      } else {
        const textError = errorMessage(error, "runtime");
        renderMessage("assistant", textError, assistantId);
        emitMessage("assistant", textError, assistantId, false, source);
        setStatus("error", "SIINDEX explained what happened. You can retry or type.");
      }
    } finally {
      runtimeAbort = null;
      currentStreamMessage = null;
      busy = false;
    }
  }

  async function ensureAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContext.state === "suspended") await audioContext.resume();
    return audioContext;
  }

  function stopPcmPlayback() {
    playbackGeneration += 1;
    for (const source of activeAudioSources) {
      try {
        source.stop();
      } catch (_) {
        // Source may already be stopped.
      }
    }
    activeAudioSources.clear();
  }

  async function playPcmStream(response) {
    const context = await ensureAudioContext();
    if (!context || !response.body) throw new Error("streaming_audio_unavailable");

    const generation = ++playbackGeneration;
    const reader = response.body.getReader();
    const frameBytes = 8192;
    let pending = new Uint8Array(0);
    let nextStartAt = context.currentTime + 0.12;
    let finalSource = null;

    function schedule(bytes) {
      if (!bytes.length || generation !== playbackGeneration) return;
      const sampleCount = Math.floor(bytes.length / 2);
      if (!sampleCount) return;
      const samples = new Float32Array(sampleCount);
      const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      for (let index = 0; index < sampleCount; index += 1) {
        samples[index] = view.getInt16(index * 2, true) / 32768;
      }
      const buffer = context.createBuffer(1, sampleCount, 24000);
      buffer.copyToChannel(samples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      activeAudioSources.add(source);
      source.onended = () => activeAudioSources.delete(source);
      nextStartAt = Math.max(nextStartAt, context.currentTime + 0.08);
      source.start(nextStartAt);
      nextStartAt += buffer.duration;
      finalSource = source;
      setStatus("speaking", "SIINDEX is speaking. Tap Interrupt or the microphone to stop.");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done || generation !== playbackGeneration) break;
      const merged = new Uint8Array(pending.length + value.length);
      merged.set(pending);
      merged.set(value, pending.length);
      let offset = 0;
      while (merged.length - offset >= frameBytes) {
        schedule(merged.slice(offset, offset + frameBytes));
        offset += frameBytes;
      }
      pending = merged.slice(offset);
    }
    if (generation === playbackGeneration && pending.length >= 2) {
      schedule(pending.slice(0, pending.length - (pending.length % 2)));
    }
    if (finalSource && generation === playbackGeneration) {
      finalSource.addEventListener("ended", () => {
        if (generation === playbackGeneration) setStatus("idle", "Ready.");
      }, { once: true });
    }
  }

  function pronunciation(text) {
    return String(text)
      .replace(/SIINDEX/g, "Sin-dex")
      .replace(/IN\$DEX/g, "in-dex")
      .replace(/\bINDX\b/g, "index")
      .slice(0, 1400);
  }

  async function speak(text) {
    if (!voiceEnabled || !text) return;
    voiceAbort = new AbortController();
    const spoken = pronunciation(text);
    try {
      setStatus("speaking", "Preparing SIINDEX's voice…");
      const response = await fetch(ENDPOINTS.voice, {
        method: "POST",
        signal: voiceAbort.signal,
        headers: headers("application/json"),
        body: JSON.stringify({ text: spoken }),
      });
      if (!response.ok) await readFailure(response);
      if (response.headers.get("X-Siindex-Audio-Format") !== "pcm_24000") {
        throw new SiindexError("unsupported_audio_format", 502);
      }
      await playPcmStream(response);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (!window.speechSynthesis) {
        setStatus("error", errorMessage(error, "voice"));
        return;
      }
      // American accent canon (AJ decision 2026-07-29). Re-applied after the v3 rewrite:
      // this fallback previously selected no voice at all, so it used whatever the device
      // defaults to — on an Australian Mac that is an Australian or British voice, which is
      // the exact complaint this decision resolved. en-US is required here, with any other
      // English kept only as a last resort so the fallback never goes silent.
      const utterance = new SpeechSynthesisUtterance(spoken);
      try {
        const allVoices = speechSynthesis.getVoices() || [];
        const usVoices = allVoices.filter((v) => /^en[-_]US/i.test(v.lang || ""));
        const preferred =
          usVoices.find((v) =>
            /samantha|ava|allison|susan|zoe|nicky|victoria|zira|aria|google us english/i.test(v.name),
          ) ||
          usVoices.find((v) => /female|woman/i.test(v.name)) ||
          usVoices[0] ||
          allVoices.find((v) => /^en/i.test(v.lang || ""));
        if (preferred) utterance.voice = preferred;
      } catch (_) {
        /* voice list unavailable — fall through to the browser default */
      }
      utterance.lang = "en-US";
      utterance.rate = 0.94;
      utterance.pitch = 1.03;
      utterance.onend = () => setStatus("idle", "Ready.");
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      setStatus(
        "speaking",
        "ElevenLabs is unavailable; using this device's voice temporarily.",
      );
    } finally {
      voiceAbort = null;
    }
  }

  function interrupt(message, notify) {
    if (runtimeAbort) runtimeAbort.abort();
    if (voiceAbort) voiceAbort.abort();
    if (recording) stopRecording(false);
    stopPcmPlayback();
    window.speechSynthesis && speechSynthesis.cancel();
    busy = false;
    if (notify !== false) setStatus("idle", message || "Interrupted. Ready.");
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(PROVIDER_CONSENT_KEY);
    if (ui.messages) {
      ui.messages.querySelectorAll(".siindex-message").forEach((node) => node.remove());
      if (ui.empty) ui.empty.hidden = false;
    }
    emit("history-cleared", {});
    emit("consent", { accepted: false });
    setStatus(
      "idle",
      "This device's Visitor Mode conversation and provider consent were cleared.",
    );
  }

  const STYLES = `
    #siindex-fab{position:fixed;right:16px;bottom:78px;width:56px;height:56px;border-radius:50%;border:1px solid rgba(0,212,255,.55);background:linear-gradient(135deg,#00d4ff,#2b35d8);color:#fff;z-index:9998;box-shadow:0 0 24px rgba(0,212,255,.45),0 8px 28px rgba(0,0,0,.42);cursor:pointer;font-size:23px}
    #siindex-fab:hover{transform:scale(1.05)} #siindex-fab:focus-visible{outline:3px solid #fff;outline-offset:3px}
    #siindex-overlay{position:fixed;inset:0;background:rgba(6,8,14,.76);backdrop-filter:blur(4px);z-index:9997;display:none}
    #siindex-overlay.show{display:block}
    #siindex-panel{position:fixed;left:0;right:0;bottom:0;max-width:460px;height:min(82vh,720px);margin:auto;background:#11141f;border:1px solid rgba(0,212,255,.24);border-bottom:0;border-radius:24px 24px 0 0;z-index:9999;transform:translateY(105%);transition:transform .3s ease;display:flex;flex-direction:column;overflow:hidden;color:#f4f6ff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #siindex-panel.open{transform:translateY(0)}
    .siindex-panel-header{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
    .siindex-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#00d4ff,#8b3fe8);font-weight:900}
    .siindex-heading{flex:1}.siindex-name{font-size:15px;font-weight:850;letter-spacing:.08em}.siindex-mode{font-size:10px;color:#00e5a0;margin-top:3px;letter-spacing:.08em;text-transform:uppercase}
    .siindex-icon-btn{border:0;background:transparent;color:#c8cede;font-size:22px;padding:7px;cursor:pointer}
    .siindex-privacy{padding:9px 16px;background:rgba(0,212,255,.06);border-bottom:1px solid rgba(0,212,255,.1);color:#b5c0d3;font-size:11px;line-height:1.45}
    .siindex-messages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
    .siindex-empty{margin:auto;text-align:center;color:#aeb6c8;max-width:300px;font-size:13px;line-height:1.6}
    .siindex-message{max-width:88%;border-radius:16px;padding:10px 13px;white-space:pre-wrap;font-size:13px;line-height:1.5}
    .siindex-message.user{align-self:flex-end;background:linear-gradient(135deg,rgba(43,53,216,.55),rgba(139,63,232,.48));border-bottom-right-radius:4px}
    .siindex-message.assistant{align-self:flex-start;background:linear-gradient(135deg,rgba(0,212,255,.1),rgba(139,63,232,.08));border:1px solid rgba(0,212,255,.18);border-bottom-left-radius:4px}
    .siindex-message-sender{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#00d4ff;margin-bottom:4px;font-weight:800}
    .siindex-message.user .siindex-message-sender{text-align:right;color:#d8d4ff}.siindex-message-body{word-break:break-word}
    .siindex-prompts{display:flex;gap:7px;padding:7px 14px;overflow-x:auto}.siindex-prompt{flex:none;border:1px solid rgba(0,212,255,.2);background:rgba(0,212,255,.06);color:#8ceaff;border-radius:20px;padding:7px 11px;font-size:11px;cursor:pointer}
    .siindex-status{min-height:24px;padding:4px 15px 7px;color:#aeb6c8;font-size:11px;line-height:1.35}.siindex-status[data-state="listening"]{color:#ff8aa0}.siindex-status[data-state="error"]{color:#ffb5c3}.siindex-status[data-state="speaking"]{color:#74edc2}
    .siindex-controls{display:flex;gap:8px;align-items:center;padding:10px 14px 20px;border-top:1px solid rgba(255,255,255,.07)}
    .siindex-input{min-width:0;flex:1;border:1px solid rgba(255,255,255,.13);border-radius:24px;background:rgba(255,255,255,.05);color:#fff;padding:11px 15px;font-size:13px;outline:none}.siindex-input:focus{border-color:#00d4ff}
    .siindex-round{width:42px;height:42px;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#fff;background:linear-gradient(135deg,#00d4ff,#2b35d8);font-size:17px}.siindex-round.listening{background:#ff4d6d;animation:siindexMicPulse .8s infinite}.siindex-round:focus-visible{outline:3px solid #fff;outline-offset:2px}
    .siindex-interrupt{border:1px solid rgba(255,184,0,.5);background:rgba(255,184,0,.1);color:#ffd56a;border-radius:18px;padding:6px 10px;font-size:11px;cursor:pointer;margin-left:14px}
    .siindex-footer-tools{display:flex;align-items:center;justify-content:space-between;padding:0 14px 7px;color:#8e98aa;font-size:10px}.siindex-text-btn{border:0;background:transparent;color:#8ceaff;font-size:10px;cursor:pointer}
    @keyframes siindexMicPulse{50%{transform:scale(1.12);box-shadow:0 0 20px rgba(255,77,109,.65)}}
    @media (min-width:700px){#siindex-panel{left:auto;right:18px;bottom:18px;border-bottom:1px solid rgba(0,212,255,.24);border-radius:24px;width:430px;height:min(78vh,700px)}}
    @media (prefers-reduced-motion:reduce){#siindex-panel,.siindex-round{transition:none!important;animation:none!important}}
  `;

  const ui = {
    panel: null,
    overlay: null,
    fab: null,
    messages: null,
    empty: null,
    status: null,
    input: null,
    mic: null,
    interrupt: null,
    voiceToggle: null,
  };

  function restorePanelHistory() {
    if (!ui.messages) return;
    ui.messages.querySelectorAll(".siindex-message").forEach((node) => node.remove());
    const history = getHistory();
    history.forEach((item) => {
      renderMessage(item.role === "user" ? "user" : "assistant", item.content, messageId());
    });
    if (ui.empty) ui.empty.hidden = history.length > 0;
  }

  function open() {
    if (!ui.panel) return;
    ui.panel.classList.add("open");
    ui.overlay && ui.overlay.classList.add("show");
    if (ui.fab) ui.fab.hidden = true;
    restorePanelHistory();
    setTimeout(() => ui.input && ui.input.focus(), 250);
  }

  function close() {
    if (!ui.panel) return;
    ui.panel.classList.remove("open");
    ui.overlay && ui.overlay.classList.remove("show");
    if (ui.fab) ui.fab.hidden = false;
    if (recording) stopRecording(false);
    stopPcmPlayback();
  }

  function setVoiceEnabled(enabled) {
    voiceEnabled = !!enabled;
    localStorage.setItem(VOICE_KEY, String(voiceEnabled));
    if (ui.voiceToggle) {
      ui.voiceToggle.textContent = voiceEnabled ? "Voice replies on" : "Voice replies off";
    }
    if (!voiceEnabled) interrupt("Voice replies off. Text conversation remains available.", false);
    emit("voice-toggle", { enabled: voiceEnabled });
  }

  function injectWidget() {
    if (window.SIINDEX_NO_GLOBAL_WIDGET) return;
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    ui.overlay = document.createElement("div");
    ui.overlay.id = "siindex-overlay";
    ui.overlay.addEventListener("click", close);

    ui.fab = document.createElement("button");
    ui.fab.id = "siindex-fab";
    ui.fab.type = "button";
    ui.fab.setAttribute("aria-label", "Open SIINDEX conversation");
    ui.fab.title = "Speak to SIINDEX";
    ui.fab.textContent = "🎙";
    ui.fab.addEventListener("click", open);

    ui.panel = document.createElement("section");
    ui.panel.id = "siindex-panel";
    ui.panel.setAttribute("role", "dialog");
    ui.panel.setAttribute("aria-modal", "true");
    ui.panel.setAttribute("aria-label", "SIINDEX Visitor Mode conversation");
    ui.panel.innerHTML = `
      <header class="siindex-panel-header">
        <div class="siindex-avatar" aria-hidden="true">SI</div>
        <div class="siindex-heading">
          <div class="siindex-name">SIINDEX</div>
          <div class="siindex-mode">Synthetic Intelligence · Website Voice</div>
        </div>
        <button type="button" class="siindex-icon-btn" data-si-close aria-label="Close SIINDEX">×</button>
      </header>
      <div class="siindex-privacy">Tap the microphone only when ready. With your permission, audio is sent securely to ElevenLabs for transcription, your transcript or typed question is sent to Anthropic, and SIINDEX replies are sent to ElevenLabs when voice is on. IN$DEX does not store raw audio or website conversations on its servers. Do not share passwords, seed phrases, private keys, identity documents, or sensitive account details. Website Voice cannot access accounts or take actions.</div>
      <div class="siindex-messages" data-si-messages>
        <div class="siindex-empty" data-si-empty>Ask me what is genuinely live, what is planned, how the Pacific-first pilot works, or how to collaborate. Tap the microphone, speak, then tap again to send. You can type at any time.</div>
      </div>
      <div class="siindex-prompts" data-si-prompts></div>
      <button type="button" class="siindex-interrupt" data-si-interrupt hidden>■ Interrupt</button>
      <div class="siindex-status" data-si-status aria-live="polite">Ready. Tap the microphone to speak or type below.</div>
      <div class="siindex-footer-tools">
        <button type="button" class="siindex-text-btn" data-si-voice></button>
        <button type="button" class="siindex-text-btn" data-si-clear>Clear conversation &amp; consent</button>
      </div>
      <div class="siindex-controls">
        <input class="siindex-input" data-si-input type="text" maxlength="1200" placeholder="Ask SIINDEX anything…" autocomplete="off">
        <button type="button" class="siindex-round" data-si-mic aria-label="Start or stop microphone" aria-pressed="false">🎙</button>
        <button type="button" class="siindex-round" data-si-send aria-label="Send question">➤</button>
      </div>`;

    document.body.append(ui.overlay, ui.fab, ui.panel);
    ui.messages = ui.panel.querySelector("[data-si-messages]");
    ui.empty = ui.panel.querySelector("[data-si-empty]");
    ui.status = ui.panel.querySelector("[data-si-status]");
    ui.input = ui.panel.querySelector("[data-si-input]");
    ui.mic = ui.panel.querySelector("[data-si-mic]");
    ui.interrupt = ui.panel.querySelector("[data-si-interrupt]");
    ui.voiceToggle = ui.panel.querySelector("[data-si-voice]");

    const prompts = [
      "What is genuinely live today?",
      "What is planned for the Pacific pilot?",
      "Explain the 50 INDX welcome recognition",
      "What is the verified token status?",
      "How can I collaborate?",
      "Can reporters interview SIINDEX?",
    ];
    const promptArea = ui.panel.querySelector("[data-si-prompts]");
    prompts.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "siindex-prompt";
      button.textContent = text;
      button.addEventListener("click", () => ask(text, { source: "global" }));
      promptArea.appendChild(button);
    });

    ui.panel.querySelector("[data-si-close]").addEventListener("click", close);
    ui.panel.querySelector("[data-si-send]").addEventListener("click", () => {
      const text = ui.input.value;
      ui.input.value = "";
      ask(text, { source: "global" });
    });
    ui.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const text = ui.input.value;
        ui.input.value = "";
        ask(text, { source: "global" });
      }
    });
    ui.mic.addEventListener("click", () => startRecording({ source: "global" }));
    ui.interrupt.addEventListener("click", () => interrupt());
    ui.voiceToggle.addEventListener("click", () => setVoiceEnabled(!voiceEnabled));
    ui.panel.querySelector("[data-si-clear]").addEventListener("click", clearHistory);
    setVoiceEnabled(voiceEnabled);
  }

  window.SIINDEXVoice = {
    open,
    close,
    ask,
    listen: startRecording,
    interrupt,
    speak,
    clearHistory,
    setVoiceEnabled,
    get voiceEnabled() {
      return voiceEnabled;
    },
    get recording() {
      return recording;
    },
    mode: "website",
    version: "3.0.0",
  };

  // Backwards-compatible entrypoint used by a few existing pages.
  window.siindexSpeak = window.SIINDEXVoice;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectWidget, { once: true });
  } else {
    injectWidget();
  }

  class SIINDEXSpeechRecognition {
    constructor() {
      this.lang = "en-AU";
      this.continuous = false;
      this.interimResults = false;
      this.maxAlternatives = 1;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this._active = false;
    }

    start() {
      if (this._active) throw new DOMException("Recognition already started", "InvalidStateError");
      this._active = true;
      if (typeof this.onstart === "function") this.onstart(new Event("start"));
      startRecording({
        source: "legacy-microphone",
        autoStopMs: this.continuous ? MAX_RECORDING_MS : 8000,
        onTranscript: (transcript) => {
          const alternative = { transcript, confidence: 1 };
          const result = [alternative];
          result.isFinal = true;
          const results = [result];
          results.item = (index) => results[index];
          if (typeof this.onresult === "function") {
            this.onresult({ results, resultIndex: 0 });
          }
        },
        onError: (error) => {
          const code = error && (error.code || error.name || error.message);
          const mapped = code === "NotAllowedError"
            ? "not-allowed"
            : code === "no_speech_detected"
            ? "no-speech"
            : "network";
          if (typeof this.onerror === "function") {
            this.onerror({ error: mapped, message: errorMessage(error, "microphone") });
          }
        },
        onEnd: () => {
          this._active = false;
          if (typeof this.onend === "function") this.onend(new Event("end"));
        },
      });
    }

    stop() {
      if (!this._active) return;
      stopRecording(true, "legacy-microphone");
    }

    abort() {
      if (!this._active) return;
      stopRecording(false, "legacy-microphone");
      this._active = false;
    }
  }

  window.SIINDEXNativeSpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  window.SpeechRecognition = SIINDEXSpeechRecognition;
  window.webkitSpeechRecognition = SIINDEXSpeechRecognition;

  emit("ready", { mode: "website", version: "3.0.0" });
})();
