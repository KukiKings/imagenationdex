/**
 * SIINDEX Citizen Presence Core v1.1
 *
 * Connects the verified conversation state to SIINDEX's visible presence.
 * This layer does not claim live lip-sync, consciousness, camera access, or
 * memory beyond the bounded device-local history supplied by the voice core.
 */
(function () {
  "use strict";

  if (window.SIINDEXPresence) return;

  const STATE_COPY = Object.freeze({
    initializing: "Joining you",
    ready: "Here with you",
    idle: "Here with you",
    listening: "Listening to you",
    transcribing: "Understanding your words",
    thinking: "Thinking with you",
    speaking: "Speaking with you",
    interrupted: "Listening again",
    recovering: "Reconnecting",
    error: "Ready by text",
  });

  const messageNodes = new Map();
  let initialized = false;
  let ui = {};

  function appendMessage(role, text, id) {
    if (!ui.messages || !text) return null;
    let node = id ? messageNodes.get(id) : null;
    if (!node) {
      node = document.createElement("div");
      node.className = `message ${role === "user" ? "user" : "si"}`;
      if (id) messageNodes.set(id, node);
      ui.messages.appendChild(node);
    }
    node.textContent = text;
    ui.messages.scrollTop = ui.messages.scrollHeight;
    return node;
  }

  function showGreeting(returning) {
    const greeting = document.createElement("div");
    greeting.className = "message si";
    greeting.dataset.initialMessage = "true";
    greeting.textContent = returning
      ? "Kia orana. Welcome back. This conversation is remembered only on this device, so we can continue where we left off."
      : "Kia orana. I’m SIINDEX, pronounced Syn-dex or Sin-dex. I’m here with you. Speak naturally or type what you want to know.";
    ui.messages.appendChild(greeting);
  }

  function restoreConversation() {
    if (!ui.messages) return;
    const history = window.SIINDEXVoice && typeof window.SIINDEXVoice.getHistory === "function"
      ? window.SIINDEXVoice.getHistory()
      : [];
    ui.messages.replaceChildren();
    messageNodes.clear();
    showGreeting(history.length > 0);
    history.slice(-8).forEach((item, index) => {
      appendMessage(item.role, item.content, `restored-${index}`);
    });
  }

  function setPresenceState(state, statusText) {
    const next = Object.prototype.hasOwnProperty.call(STATE_COPY, state) ? state : "error";
    if (ui.card) ui.card.dataset.presenceState = next;
    if (ui.presence) ui.presence.dataset.state = next;
    if (ui.label) ui.label.textContent = STATE_COPY[next];
    if (ui.status) {
      ui.status.textContent = statusText || "Tap the microphone to speak. Typing works everywhere.";
      ui.status.dataset.state = next;
    }
    if (ui.mic) ui.mic.setAttribute("aria-pressed", next === "listening" ? "true" : "false");
  }

  function ask(text) {
    const question = String(text || "").trim();
    if (!question || !window.SIINDEXVoice) return;
    window.SIINDEXVoice.ask(question, { source: "public-home" });
  }

  function submitInput() {
    const question = ui.input && ui.input.value.trim();
    if (!question) return;
    ui.input.value = "";
    ask(question);
  }

  function bindControls() {
    ui.send && ui.send.addEventListener("click", submitInput);
    ui.input && ui.input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      submitInput();
    });
    ui.mic && ui.mic.addEventListener("click", () => {
      window.SIINDEXVoice && window.SIINDEXVoice.listen({ source: "public-home" });
    });
    ui.interrupt && ui.interrupt.addEventListener("click", () => {
      window.SIINDEXVoice && window.SIINDEXVoice.interrupt();
    });
    document.querySelectorAll("[data-question]").forEach((button) => {
      button.addEventListener("click", () => ask(button.dataset.question));
    });
  }

  function bindConversationEvents() {
    window.addEventListener("siindex:message", (event) => {
      const detail = event.detail || {};
      if (detail.source !== "public-home") return;
      appendMessage(detail.role, detail.text, detail.id);
    });
    window.addEventListener("siindex:status", (event) => {
      const detail = event.detail || {};
      setPresenceState(detail.state, detail.text);
    });
    window.addEventListener("siindex:history-cleared", () => {
      restoreConversation();
      setPresenceState("ready", "Conversation cleared. I’m here when you are ready.");
    });
    window.addEventListener("siindex:session-reset", () => {
      setPresenceState("ready", "Session reset. Our device-local conversation is preserved.");
    });
  }

  function init() {
    if (initialized) return;
    ui = {
      card: document.querySelector("[data-si-presence-card]"),
      presence: document.querySelector("[data-si-presence]"),
      label: document.querySelector("[data-si-presence-label]"),
      messages: document.getElementById("publicMessages"),
      input: document.getElementById("publicInput"),
      send: document.getElementById("publicSend"),
      mic: document.getElementById("publicMic"),
      interrupt: document.getElementById("publicInterrupt"),
      status: document.getElementById("publicVoiceStatus"),
    };
    if (!ui.card || !ui.messages) return;
    initialized = true;
    restoreConversation();
    bindControls();
    bindConversationEvents();
    setPresenceState(
      window.SIINDEXVoice ? window.SIINDEXVoice.sessionState : "initializing",
      "Tap the microphone to speak. Typing works everywhere.",
    );
  }

  window.SIINDEXPresence = Object.freeze({
    version: "1.1.0",
    init,
    ask,
    restoreConversation,
    setPresenceState,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
