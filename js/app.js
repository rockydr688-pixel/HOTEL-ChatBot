// ChatGPT Platform UI Application Controller
(() => {
  // DOM Elements
  const app = document.getElementById("app");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
  const sidebarMobileToggle = document.getElementById("sidebarMobileToggle");
  const sidebarNewChat = document.getElementById("sidebarNewChat");
  const newChatTopBtn = document.getElementById("newChatTopBtn");
  const chatSessionsList = document.getElementById("chatSessionsList");
  const activeBookingsSidebar = document.getElementById("activeBookingsSidebar");
  const bookingCountBadge = document.getElementById("bookingCountBadge");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleText = document.getElementById("themeToggleText");

  const chatContainer = document.getElementById("chatContainer");
  const chatHero = document.getElementById("chatHero");
  const chat = document.getElementById("chat");
  const chips = document.getElementById("chips");
  const input = document.getElementById("input");
  const send = document.getElementById("send");
  const voiceBtn = document.getElementById("voiceBtn");
  const quickActionAttachBtn = document.getElementById("quickActionAttachBtn");

  // Modals
  const pyqModal = document.getElementById("pyqModal");
  const closePyqModal = document.getElementById("closePyqModal");
  const pyqListContainer = document.getElementById("pyqListContainer");
  const pyqSearchInput = document.getElementById("pyqSearchInput");
  const pyqCategoryFilters = document.getElementById("pyqCategoryFilters");
  const navPyqBtn = document.getElementById("navPyqBtn");
  const topbarPyqBtn = document.getElementById("topbarPyqBtn");

  const bookingsModal = document.getElementById("bookingsModal");
  const closeBookingsModal = document.getElementById("closeBookingsModal");
  const bookingsListContainer = document.getElementById("bookingsListContainer");
  const navBookingsBtn = document.getElementById("navBookingsBtn");
  const topbarBookingsBtn = document.getElementById("topbarBookingsBtn");
  const navRoomTypesBtn = document.getElementById("navRoomTypesBtn");
  const toast = document.getElementById("toast");

  // State Management
  const SESSIONS_STORE = "hv_chat_sessions";
  const THEME_STORE = "hv_theme";
  let sessions = loadSessions();
  let currentSessionId = null;
  let isBusy = false;
  let recognition = null;
  let isListening = false;

  const BOT_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10l8-5 8 5v10M9 20v-5h6v5"/></svg>`;

  /* ---------- Helpers ---------- */
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  
  function parseMarkdown(text) {
    if (!text) return "";
    let s = esc(text);
    // Bold
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italics
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Line breaks
    s = s.replace(/\n\n/g, "<br><br>");
    s = s.replace(/\n• /g, "<br>• ");
    s = s.replace(/\n(\d+)\. /g, "<br>$1. ");
    return s;
  }

  const scrollBottom = () => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
  }

  /* ---------- Theme Handling ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_STORE) || "dark";
    setTheme(saved);
  }

  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_STORE, t);
    themeToggleText.textContent = t === "dark" ? "Dark mode" : "Light mode";
  }

  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  });

  /* ---------- Sessions Storage ---------- */
  function loadSessions() {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_STORE)) || [];
    } catch {
      return [];
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(SESSIONS_STORE, JSON.stringify(sessions));
    } catch {}
    renderSessionsList();
  }

  function createNewSession() {
    const id = "sess_" + Date.now();
    const newSess = {
      id,
      title: "New Reservation Chat",
      timestamp: Date.now(),
      messages: []
    };
    sessions.unshift(newSess);
    currentSessionId = id;
    saveSessions();
    Bot.reset();
    renderChatHistory();
    setChips(["Book a room", "Room types & prices", "Hotel PYQs & FAQs", "Check-in & check-out"]);
    input.focus();
  }

  function switchSession(id) {
    currentSessionId = id;
    Bot.reset();
    renderSessionsList();
    renderChatHistory();
    closeMobileSidebar();
  }

  function deleteSession(id, e) {
    if (e) e.stopPropagation();
    sessions = sessions.filter(s => s.id !== id);
    if (currentSessionId === id) {
      if (sessions.length > 0) {
        currentSessionId = sessions[0].id;
      } else {
        createNewSession();
        return;
      }
    }
    saveSessions();
    renderChatHistory();
  }

  function renderSessionsList() {
    chatSessionsList.innerHTML = "";
    if (sessions.length === 0) {
      chatSessionsList.innerHTML = `<div style="padding: 8px 12px; font-size: 0.78rem; color: var(--text-muted);">No saved chats yet</div>`;
      return;
    }
    sessions.forEach(s => {
      const el = document.createElement("div");
      el.className = "session-item" + (s.id === currentSessionId ? " active" : "");
      el.innerHTML = `
        <span class="session-title">${esc(s.title)}</span>
        <button class="session-delete-btn" title="Delete conversation" type="button">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      el.addEventListener("click", () => switchSession(s.id));
      el.querySelector(".session-delete-btn").addEventListener("click", e => deleteSession(s.id, e));
      chatSessionsList.appendChild(el);
    });
  }

  /* ---------- Bookings Sidebar & Badges ---------- */
  function updateBookingsUI() {
    const all = Bot.getBookings();
    const refs = Object.keys(all);
    bookingCountBadge.textContent = refs.length;

    activeBookingsSidebar.innerHTML = "";
    if (refs.length === 0) {
      activeBookingsSidebar.innerHTML = `<div style="padding: 4px 10px; font-size: 0.76rem; color: var(--text-muted);">No active reservations</div>`;
      return;
    }

    refs.slice(-4).reverse().forEach(ref => {
      const b = all[ref];
      const isConfirmed = b.status === "Confirmed";
      const card = document.createElement("div");
      card.className = "booking-pill-card";
      card.innerHTML = `
        <div class="booking-pill-top">
          <span class="booking-pill-ref">${esc(b.ref)}</span>
          <span class="booking-pill-status ${isConfirmed ? 'confirmed' : 'cancelled'}">${esc(b.status)}</span>
        </div>
        <div class="booking-pill-desc">${esc(b.room)} · ${esc(b.nights)} night${b.nights > 1 ? 's' : ''}</div>
      `;
      card.addEventListener("click", () => {
        closeMobileSidebar();
        submit(b.ref);
      });
      activeBookingsSidebar.appendChild(card);
    });
  }

  /* ---------- Messages Rendering ---------- */
  function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId);
  }

  function renderChatHistory() {
    const s = getCurrentSession();
    chat.innerHTML = "";
    if (!s || s.messages.length === 0) {
      chatHero.style.display = "flex";
      setChips(["Book a room", "Room types & prices", "Hotel PYQs & FAQs", "Check-in & check-out"]);
    } else {
      chatHero.style.display = "none";
      s.messages.forEach(m => {
        appendMessageRow(m.role, m.text, m.card, m.extra, false);
      });
      if (s.chips && s.chips.length > 0) {
        setChips(s.chips);
      }
    }
    scrollBottom();
  }

  function appendMessageRow(role, text, card = null, extra = {}, animate = true) {
    chatHero.style.display = "none";
    const row = document.createElement("div");
    row.className = `msg-row ${role}`;

    let avatarHTML = "";
    if (role === "bot") {
      avatarHTML = `<div class="msg-avatar">${BOT_ICON}</div>`;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "msg-content-wrapper";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = parseMarkdown(text);
    wrapper.appendChild(bubble);

    // Interactive Room Cards
    if (extra && extra.roomCards) {
      const roomContainer = document.createElement("div");
      roomContainer.className = "bot-room-cards";
      extra.roomCards.forEach(room => {
        const rc = document.createElement("div");
        rc.className = "room-card";
        rc.innerHTML = `
          <span class="room-card-badge">${esc(room.badge || 'Available')}</span>
          <h4 class="room-card-title">${esc(room.name)}</h4>
          <div class="room-card-meta">${esc(room.beds)} · ${esc(room.size)} · ${esc(room.view)}</div>
          <div class="room-card-price">
            <span class="amount">$${esc(room.price)}</span>
            <span class="period">/ night + tax</span>
          </div>
          <ul class="room-features-list">
            ${room.features.slice(0, 4).map(f => `<li>${esc(f)}</li>`).join("")}
          </ul>
          <button class="btn-select-room" type="button">Book ${esc(room.name)}</button>
        `;
        rc.querySelector(".btn-select-room").addEventListener("click", () => {
          submit(room.name);
        });
        roomContainer.appendChild(rc);
      });
      wrapper.appendChild(roomContainer);
    }

    // Interactive Folio / Receipt Card
    if (card && Array.isArray(card)) {
      const receipt = document.createElement("div");
      receipt.className = "reservation-receipt-card";
      let refCode = "";
      card.forEach(([k, v]) => {
        if (String(k).includes("Reference") || String(k).includes("Code")) refCode = String(v);
      });

      receipt.innerHTML = `
        <div class="receipt-header">
          <div class="receipt-hotel-brand">
            <h4>${esc(HOTEL.name)}</h4>
            <p>Official Reservation Folio</p>
          </div>
          ${refCode ? `<div class="receipt-ref-code">${esc(refCode)}</div>` : ""}
        </div>
        <dl class="receipt-grid">
          ${card.map(([k, v]) => `
            <dt>${esc(String(k))}</dt>
            <dd class="${String(k).toLowerCase().includes('total') ? 'highlight' : ''}">${esc(String(v))}</dd>
          `).join("")}
        </dl>
        <div class="receipt-footer-actions">
          ${refCode ? `
            <button class="btn-receipt-action" id="btnCopyRef_${refCode}" type="button">Copy Reference</button>
            <button class="btn-receipt-action danger" id="btnCancelRef_${refCode}" type="button">Cancel Stay</button>
          ` : `
            <button class="btn-receipt-action" id="btnPrintFolio" type="button">Print Folio</button>
          `}
        </div>
      `;

      if (refCode) {
        receipt.querySelector(`#btnCopyRef_${refCode}`).addEventListener("click", () => {
          navigator.clipboard.writeText(refCode);
          showToast(`Copied reference ${refCode} to clipboard!`);
        });
        receipt.querySelector(`#btnCancelRef_${refCode}`).addEventListener("click", () => {
          submit(`Cancel reservation ${refCode}`);
        });
      } else {
        const printBtn = receipt.querySelector("#btnPrintFolio");
        if (printBtn) printBtn.addEventListener("click", () => window.print());
      }
      wrapper.appendChild(receipt);
    }

    // Message action buttons for Assistant
    if (role === "bot") {
      const actions = document.createElement("div");
      actions.className = "msg-actions-toolbar";
      actions.innerHTML = `
        <button class="btn-msg-action" title="Copy reply" type="button" data-action="copy">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="btn-msg-action" title="Read aloud" type="button" data-action="tts">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        <button class="btn-msg-action" title="Helpful" type="button" data-action="thumbsup">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
        </button>
      `;

      actions.querySelector('[data-action="copy"]').addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        showToast("Response copied to clipboard");
      });

      actions.querySelector('[data-action="tts"]').addEventListener("click", () => {
        speakResponse(text);
      });

      actions.querySelector('[data-action="thumbsup"]').addEventListener("click", (e) => {
        e.currentTarget.style.color = "var(--accent-openai)";
        showToast("Thank you for your feedback!");
      });

      wrapper.appendChild(actions);
    }

    row.innerHTML = avatarHTML;
    row.appendChild(wrapper);
    chat.appendChild(row);
    scrollBottom();
    return bubble;
  }

  /* ---------- Simulated Streaming Typewriter Effect ---------- */
  async function streamAssistantReply(bubble, text) {
    bubble.innerHTML = '<span class="streaming-cursor"></span>';
    const words = text.split(/(\s+)/);
    let accumulator = "";

    for (let i = 0; i < words.length; i++) {
      accumulator += words[i];
      bubble.innerHTML = parseMarkdown(accumulator) + '<span class="streaming-cursor"></span>';
      scrollBottom();
      if (words[i].trim()) {
        await wait(14);
      }
    }
    // Remove streaming cursor at end
    bubble.innerHTML = parseMarkdown(accumulator);
    scrollBottom();
  }

  /* ---------- Quick Reply Chips ---------- */
  function setChips(list) {
    chips.innerHTML = "";
    if (!list || list.length === 0) return;
    list.forEach(label => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip-btn";
      b.textContent = label;
      b.addEventListener("click", () => submit(label));
      chips.appendChild(b);
    });
  }

  /* ---------- Submit & Interaction Cycle ---------- */
  async function submit(text) {
    text = (text ?? input.value).trim();
    if (!text || isBusy) return;

    isBusy = true;
    send.disabled = true;
    input.value = "";
    autosize();
    setChips([]);

    // Ensure session exists
    let s = getCurrentSession();
    if (!s) {
      createNewSession();
      s = getCurrentSession();
    }

    // Auto-rename session on first message
    if (s.messages.length === 0) {
      s.title = text.length > 28 ? text.substring(0, 28) + "..." : text;
      saveSessions();
    }

    // 1. Render User Message
    s.messages.push({ role: "user", text });
    appendMessageRow("user", text, null, null, true);
    saveSessions();

    // 2. Typing Indicator
    const typingBubble = appendMessageRow("bot", '<span class="typing-dots"><span></span><span></span><span></span></span>', null, null, false);
    await wait(380);

    // 3. Obtain Bot Brain Response
    const response = Bot.respond(text);

    // Remove typing indicator & stream bot response
    typingBubble.innerHTML = "";
    await streamAssistantReply(typingBubble, response.text);

    // If response contains cards or extra objects, re-render complete message row for perfection
    if (response.card || response.roomCards) {
      // replace placeholder row with complete formatted card block
      const lastBotRow = chat.lastElementChild;
      if (lastBotRow) lastBotRow.remove();
      appendMessageRow("bot", response.text, response.card, { roomCards: response.roomCards }, false);
    }

    // Save bot message in session
    s.messages.push({
      role: "bot",
      text: response.text,
      card: response.card,
      extra: { roomCards: response.roomCards }
    });
    s.chips = response.chips || [];
    saveSessions();

    // Set chips
    setChips(response.chips || []);
    updateBookingsUI();

    isBusy = false;
    updateSend();
    input.focus();
  }

  /* ---------- Composer Utilities & Voice Dictation ---------- */
  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  }

  function updateSend() {
    send.disabled = isBusy || !input.value.trim();
  }

  function setupVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceBtn.title = "Voice recognition not supported in this browser";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      voiceBtn.classList.add("listening");
      showToast("Listening... Speak your hotel question or booking request");
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      input.value = transcript;
      autosize();
      updateSend();
      submit(transcript);
    };

    recognition.onerror = () => {
      isListening = false;
      voiceBtn.classList.remove("listening");
      showToast("Could not recognize voice. Please try typing.");
    };

    recognition.onend = () => {
      isListening = false;
      voiceBtn.classList.remove("listening");
    };

    voiceBtn.addEventListener("click", () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  function speakResponse(text) {
    if (!("speechSynthesis" in window)) {
      showToast("Text-to-speech not supported");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#•]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast("Reading response aloud...");
  }

  /* ---------- PYQ Bank Modal ---------- */
  function renderPYQList(filterText = "", category = "all") {
    pyqListContainer.innerHTML = "";
    let list = HOTEL.pyq;

    if (category !== "all") {
      list = list.filter(item => item.category === category);
    }

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(item =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q))
      );
    }

    if (list.length === 0) {
      pyqListContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No PYQs found matching "${esc(filterText)}". Try asking our AI concierge directly!</div>`;
      return;
    }

    list.forEach(item => {
      const itemEl = document.createElement("div");
      itemEl.className = "pyq-accordion-item";
      itemEl.innerHTML = `
        <div class="pyq-accordion-header">
          <div>
            <div class="pyq-q-title">${esc(item.question)}</div>
            <div class="pyq-q-category">${esc(item.category)}</div>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="pyq-accordion-body">
          <div>${parseMarkdown(item.answer)}</div>
          <button class="pyq-ask-btn" type="button">Ask in Chat</button>
        </div>
      `;

      itemEl.querySelector(".pyq-accordion-header").addEventListener("click", () => {
        itemEl.classList.toggle("open");
      });

      itemEl.querySelector(".pyq-ask-btn").addEventListener("click", () => {
        closeModals();
        submit(item.question);
      });

      pyqListContainer.appendChild(itemEl);
    });
  }

  function setupPYQModal() {
    renderPYQList();

    pyqSearchInput.addEventListener("input", (e) => {
      const activeCat = pyqCategoryFilters.querySelector(".filter-pill.active")?.dataset.category || "all";
      renderPYQList(e.target.value, activeCat);
    });

    pyqCategoryFilters.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;
      pyqCategoryFilters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      renderPYQList(pyqSearchInput.value, pill.dataset.category);
    });

    const openPyq = () => {
      closeMobileSidebar();
      pyqModal.classList.add("active");
      pyqSearchInput.value = "";
      renderPYQList();
      pyqSearchInput.focus();
    };

    navPyqBtn.addEventListener("click", openPyq);
    topbarPyqBtn.addEventListener("click", openPyq);
    quickActionAttachBtn.addEventListener("click", openPyq);
    closePyqModal.addEventListener("click", () => pyqModal.classList.remove("active"));
  }

  /* ---------- Bookings Modal ---------- */
  function renderBookingsModal() {
    const all = Bot.getBookings();
    const refs = Object.keys(all);
    bookingsListContainer.innerHTML = "";

    if (refs.length === 0) {
      bookingsListContainer.innerHTML = `
        <div class="empty-bookings-notice">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h4>No Reservations Yet</h4>
          <p>Book your first luxury stay at Harbor View Hotel in moments.</p>
          <button class="btn-select-room" id="modalStartBookBtn" style="max-width: 200px; margin: 16px auto 0;" type="button">Book a Room</button>
        </div>
      `;
      const bookBtn = bookingsListContainer.querySelector("#modalStartBookBtn");
      if (bookBtn) {
        bookBtn.addEventListener("click", () => {
          closeModals();
          submit("Book a room");
        });
      }
      return;
    }

    refs.reverse().forEach(ref => {
      const b = all[ref];
      const isConfirmed = b.status === "Confirmed";
      const card = document.createElement("div");
      card.className = "reservation-receipt-card";
      card.innerHTML = `
        <div class="receipt-header">
          <div class="receipt-hotel-brand">
            <h4>${esc(b.room)}</h4>
            <p>Guest: ${esc(b.name)} · ${esc(b.guests)} Guest${b.guests > 1 ? 's' : ''}</p>
          </div>
          <div class="receipt-ref-code">${esc(b.ref)}</div>
        </div>
        <dl class="receipt-grid">
          <dt>Status</dt>
          <dd class="${isConfirmed ? 'highlight' : ''}">${esc(b.status)}</dd>
          <dt>Stay Duration</dt>
          <dd>${esc(b.nights)} night${b.nights > 1 ? 's' : ''}</dd>
          <dt>Total Amount</dt>
          <dd class="highlight">$${Number(b.total).toFixed(2)}</dd>
        </dl>
        <div class="receipt-footer-actions">
          <button class="btn-receipt-action" id="openChat_${b.ref}" type="button">View in Chat</button>
          ${isConfirmed ? `<button class="btn-receipt-action danger" id="cancelStay_${b.ref}" type="button">Cancel</button>` : ""}
        </div>
      `;

      card.querySelector(`#openChat_${b.ref}`).addEventListener("click", () => {
        closeModals();
        submit(b.ref);
      });

      if (isConfirmed) {
        card.querySelector(`#cancelStay_${b.ref}`).addEventListener("click", () => {
          closeModals();
          submit(`Cancel reservation ${b.ref}`);
        });
      }

      bookingsListContainer.appendChild(card);
    });
  }

  function setupBookingsModal() {
    const openBookings = () => {
      closeMobileSidebar();
      renderBookingsModal();
      bookingsModal.classList.add("active");
    };

    navBookingsBtn.addEventListener("click", openBookings);
    topbarBookingsBtn.addEventListener("click", openBookings);
    closeBookingsModal.addEventListener("click", () => bookingsModal.classList.remove("active"));
  }

  function closeModals() {
    pyqModal.classList.remove("active");
    bookingsModal.classList.remove("active");
  }

  // Close modals on backdrop click or Escape key
  [pyqModal, bookingsModal].forEach(m => {
    m.addEventListener("click", e => {
      if (e.target === m) closeModals();
    });
  });

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModals();
    // Ctrl+N or Cmd+N for New Chat
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      createNewSession();
    }
  });

  /* ---------- Sidebar Navigation & Mobile Toggles ---------- */
  function setupSidebar() {
    sidebarCollapseBtn.addEventListener("click", () => {
      app.classList.toggle("sidebar-collapsed");
    });

    sidebarMobileToggle.addEventListener("click", () => {
      app.classList.toggle("sidebar-mobile-open");
    });

    sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    sidebarNewChat.addEventListener("click", () => {
      createNewSession();
      closeMobileSidebar();
    });

    newChatTopBtn.addEventListener("click", () => {
      createNewSession();
    });

    navRoomTypesBtn.addEventListener("click", () => {
      closeMobileSidebar();
      submit("What are your room types, features, and nightly prices?");
    });
  }

  function closeMobileSidebar() {
    app.classList.remove("sidebar-mobile-open");
  }

  /* ---------- Hero PYQ Cards Click Handlers ---------- */
  function setupHeroPYQCards() {
    const cards = document.querySelectorAll(".pyq-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const prompt = card.getAttribute("data-prompt");
        if (prompt) submit(prompt);
      });
    });
  }

  /* ---------- Input & Listeners ---------- */
  function setupInputEvents() {
    input.addEventListener("input", () => {
      autosize();
      updateSend();
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });

    send.addEventListener("click", () => submit());
  }

  /* ---------- Application Initialization ---------- */
  function init() {
    initTheme();
    setupSidebar();
    setupInputEvents();
    setupVoice();
    setupPYQModal();
    setupBookingsModal();
    setupHeroPYQCards();
    updateBookingsUI();

    // Load or create active session
    if (sessions.length > 0) {
      currentSessionId = sessions[0].id;
      renderSessionsList();
      renderChatHistory();
    } else {
      createNewSession();
    }

    updateSend();
  }

  init();
})();
