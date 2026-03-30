/**
 * Hiraya Skin — AI Chat Widget
 * Self-contained: injects all HTML and CSS dynamically.
 * Replace WEBHOOK_URL with your actual n8n webhook endpoint.
 */

const WEBHOOK_URL = 'http://localhost:5678/webhook/hiraya-chat';

// ─── Session ID ─────────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let sessionId = sessionStorage.getItem('hiraya_session_id');
if (!sessionId) {
  sessionId = generateUUID();
  sessionStorage.setItem('hiraya_session_id', sessionId);
}

// ─── Inject CSS ──────────────────────────────────────────────
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Widget button ── */
    #hs-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9000;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #2D5016;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(45, 80, 22, 0.3), 0 2px 6px rgba(0,0,0,0.12);
      transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }
    #hs-widget-btn:hover {
      background: #4a7c28;
      transform: scale(1.06);
      box-shadow: 0 6px 20px rgba(45, 80, 22, 0.38), 0 2px 8px rgba(0,0,0,0.15);
    }
    #hs-widget-btn:focus-visible {
      outline: 2px solid #2D5016;
      outline-offset: 3px;
    }
    #hs-widget-btn:active { transform: scale(0.96); }

    #hs-widget-btn svg {
      width: 24px;
      height: 24px;
      color: white;
      transition: opacity 0.15s ease;
    }
    #hs-widget-btn .icon-chat  { display: block; }
    #hs-widget-btn .icon-close { display: none; }
    #hs-widget-btn.open .icon-chat  { display: none; }
    #hs-widget-btn.open .icon-close { display: block; }

    /* ── Badge on button ── */
    #hs-widget-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #F2C4B0;
      border: 2px solid white;
    }

    /* ── Panel ── */
    #hs-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      z-index: 9000;
      width: 360px;
      height: 500px;
      background: #ffffff;
      border: 1px solid #e8e3dc;
      border-radius: 12px;
      box-shadow: 0 20px 56px rgba(45, 80, 22, 0.16), 0 4px 16px rgba(0, 0, 0, 0.07);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'DM Sans', system-ui, sans-serif;
      opacity: 0;
      transform: translateY(12px) scale(0.97);
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    #hs-widget-panel.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* ── Panel header ── */
    #hs-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #e8e3dc;
      flex-shrink: 0;
      background: #FAF8F5;
    }
    #hs-panel-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #hs-online-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4a7c28;
      box-shadow: 0 0 0 2px rgba(74, 124, 40, 0.2);
      flex-shrink: 0;
    }
    #hs-panel-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1a1a1a;
      letter-spacing: -0.01em;
    }
    #hs-panel-sub {
      font-size: 0.6875rem;
      color: #6b6b6b;
      margin-top: 0.5px;
    }
    #hs-panel-close {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b6b6b;
      transition: background 0.15s ease, color 0.15s ease;
    }
    #hs-panel-close:hover { background: #e8e3dc; color: #1a1a1a; }
    #hs-panel-close:focus-visible { outline: 2px solid #2D5016; outline-offset: 2px; }

    /* ── Messages area ── */
    #hs-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #hs-messages::-webkit-scrollbar { width: 4px; }
    #hs-messages::-webkit-scrollbar-track { background: transparent; }
    #hs-messages::-webkit-scrollbar-thumb { background: #e8e3dc; border-radius: 4px; }

    /* ── Message bubbles ── */
    .hs-msg {
      display: flex;
      flex-direction: column;
      max-width: 82%;
      gap: 2px;
      animation: hs-fade-in 0.18s ease;
    }
    @keyframes hs-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hs-msg.user { align-self: flex-end; align-items: flex-end; }
    .hs-msg.bot  { align-self: flex-start; align-items: flex-start; }

    .hs-bubble {
      padding: 9px 13px;
      border-radius: 12px;
      font-size: 0.875rem;
      line-height: 1.55;
      word-break: break-word;
    }
    .hs-msg.user .hs-bubble {
      background: #2D5016;
      color: #ffffff;
      border-radius: 12px 12px 2px 12px;
    }
    .hs-msg.bot .hs-bubble {
      background: #ffffff;
      color: #1a1a1a;
      border: 1px solid #e8e3dc;
      border-radius: 12px 12px 12px 2px;
    }
    .hs-msg-time {
      font-size: 0.6375rem;
      color: #a0a0a0;
      padding: 0 4px;
    }

    /* ── Typing indicator ── */
    #hs-typing {
      display: none;
      align-self: flex-start;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #e8e3dc;
      border-radius: 12px 12px 12px 2px;
      gap: 4px;
      align-items: center;
    }
    #hs-typing.visible { display: flex; }
    .hs-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #b0b0b0;
      animation: hs-pulse 1.2s ease-in-out infinite;
    }
    .hs-dot:nth-child(1) { animation-delay: 0s; }
    .hs-dot:nth-child(2) { animation-delay: 0.18s; }
    .hs-dot:nth-child(3) { animation-delay: 0.36s; }
    @keyframes hs-pulse {
      0%, 60%, 100% { opacity: 0.3; transform: scale(0.9); }
      30%            { opacity: 1;   transform: scale(1.1); }
    }

    /* ── Input area ── */
    #hs-input-area {
      border-top: 1px solid #e8e3dc;
      padding: 10px 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
      background: #FAF8F5;
    }
    #hs-input {
      flex: 1;
      border: 1.5px solid #e8e3dc;
      border-radius: 8px;
      padding: 8px 12px;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.875rem;
      color: #1a1a1a;
      background: #ffffff;
      outline: none;
      resize: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      line-height: 1.45;
      max-height: 80px;
      overflow-y: auto;
    }
    #hs-input:focus {
      border-color: #2D5016;
      box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
    }
    #hs-input::placeholder { color: #b0b0b0; }

    #hs-send {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2D5016;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s ease, transform 0.15s ease;
    }
    #hs-send:hover { background: #4a7c28; }
    #hs-send:active { transform: scale(0.92); }
    #hs-send:focus-visible { outline: 2px solid #2D5016; outline-offset: 3px; }
    #hs-send svg { width: 16px; height: 16px; color: white; }
    #hs-send:disabled { opacity: 0.45; cursor: default; }

    /* ── Mobile ── */
    @media (max-width: 420px) {
      #hs-widget-panel {
        width: calc(100vw - 24px);
        right: 12px;
        left: 12px;
        bottom: 84px;
      }
      #hs-widget-btn {
        right: 16px;
        bottom: 16px;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ─── Inject HTML ─────────────────────────────────────────────
(function injectHTML() {
  // Button
  const btn = document.createElement('button');
  btn.id = 'hs-widget-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `
    <span class="hs-badge-dot" id="hs-widget-badge"></span>
    <svg class="icon-chat" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
    </svg>
    <svg class="icon-close" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  // Panel
  const panel = document.createElement('div');
  panel.id = 'hs-widget-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Hiraya Skin chat support');
  panel.innerHTML = `
    <div id="hs-panel-header">
      <div id="hs-panel-title-wrap">
        <div id="hs-online-dot" aria-hidden="true"></div>
        <div>
          <div id="hs-panel-title">Hiraya Skin Support</div>
          <div id="hs-panel-sub">Usually replies instantly</div>
        </div>
      </div>
      <button id="hs-panel-close" aria-label="Close chat">
        <svg fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div id="hs-messages" aria-live="polite" aria-label="Chat messages">
      <div id="hs-typing" aria-label="Hiraya is typing">
        <div class="hs-dot"></div>
        <div class="hs-dot"></div>
        <div class="hs-dot"></div>
      </div>
    </div>

    <div id="hs-input-area">
      <textarea
        id="hs-input"
        placeholder="Ask about products, shipping, promos…"
        rows="1"
        aria-label="Type your message"
        maxlength="500"
      ></textarea>
      <button id="hs-send" aria-label="Send message">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);
})();

// ─── Widget Logic ────────────────────────────────────────────
(function initWidget() {
  const btn = document.getElementById('hs-widget-btn');
  const panel = document.getElementById('hs-widget-panel');
  const closeBtn = document.getElementById('hs-panel-close');
  const messages = document.getElementById('hs-messages');
  const input = document.getElementById('hs-input');
  const sendBtn = document.getElementById('hs-send');
  const typing = document.getElementById('hs-typing');
  const badge = document.getElementById('hs-widget-badge');

  let isOpen = false;
  let hasGreeted = false;
  let isWaiting = false;

  // ── Helpers ──
  function getTime() {
    return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage(text, role) {
    // Remove typing indicator first (it's always last), re-add after
    const wasVisible = typing.classList.contains('visible');

    const wrap = document.createElement('div');
    wrap.className = `hs-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'hs-bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'hs-msg-time';
    time.textContent = getTime();

    wrap.appendChild(bubble);
    wrap.appendChild(time);

    // Insert before the typing indicator
    messages.insertBefore(wrap, typing);

    if (wasVisible) scrollBottom();
    else scrollBottom();
  }

  function showTyping() {
    typing.classList.add('visible');
    // Move typing indicator to the end visually (it's already last in DOM)
    messages.appendChild(typing);
    scrollBottom();
  }

  function hideTyping() {
    typing.classList.remove('visible');
  }

  function setInputState(disabled) {
    input.disabled = disabled;
    sendBtn.disabled = disabled;
    isWaiting = disabled;
  }

  // ── Open / close ──
  function openPanel() {
    isOpen = true;
    panel.classList.add('visible');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    badge.style.display = 'none';

    // Auto-greeting on first open
    if (!hasGreeted) {
      hasGreeted = true;
      setTimeout(() => {
        appendMessage("Hi! I'm Hiraya's virtual assistant. Ask me anything about our products, shipping, or promos! 🌿", 'bot');
      }, 300);
    }

    setTimeout(() => input.focus(), 100);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('visible');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  // ── Auto-resize textarea ──
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  // ── Send message ──
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isWaiting) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Show user message
    appendMessage(text, 'user');
    setInputState(true);
    showTyping();

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      hideTyping();

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Support various response shapes: { reply }, { message }, { output }, or plain string
      let reply = '';
      if (typeof data === 'string') {
        reply = data;
      } else if (data.reply) {
        reply = data.reply;
      } else if (data.message) {
        reply = data.message;
      } else if (data.output) {
        reply = data.output;
      } else if (data.text) {
        reply = data.text;
      } else {
        reply = 'Got it! Is there anything else I can help you with?';
      }

      appendMessage(reply, 'bot');

    } catch (err) {
      hideTyping();
      appendMessage("Sorry, I'm having trouble connecting right now. Please try again.", 'bot');
      console.warn('[Hiraya Widget] Fetch error:', err);
    } finally {
      setInputState(false);
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ── Show badge after 3s (soft nudge) ──
  setTimeout(() => {
    if (!isOpen) {
      badge.style.display = 'block';
    }
  }, 3000);

})();
