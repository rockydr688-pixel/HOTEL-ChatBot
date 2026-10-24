// Chatbot brain: Natural language intent matching, PYQ retrieval & stateful booking flow.
const Bot = (() => {
  const STORE = "hv_bookings";
  let state = { flow: null, step: null, draft: {} };

  /* ---------- helpers ---------- */
  const money = n => "$" + Number(n).toFixed(2).replace(/\.00$/, "");
  const fmt = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const has = (t, re) => re.test(t);

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = b => { try { localStorage.setItem(STORE, JSON.stringify(b)); } catch {} };

  const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const DAYS = ["sun","mon","tue","wed","thu","fri","sat"];

  function parseDate(t) {
    if (!t) return null;
    t = t.toLowerCase().trim();
    const base = today();
    if (/\btoday\b/.test(t)) return base;
    if (/\btomorrow\b/.test(t)) return addDays(base, 1);
    if (/\bday after tomorrow\b/.test(t)) return addDays(base, 2);
    if (/\bthis weekend\b|\bweekend\b/.test(t)) {
      const diff = (6 - base.getDay() + 7) % 7 || 7;
      return addDays(base, diff);
    }
    let m = t.match(/in (\d+) days?/);
    if (m) return addDays(base, +m[1]);
    m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const mon = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*";
    m = t.match(new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s*)?" + mon)) ||
        t.match(new RegExp(mon + "\\s*(\\d{1,2})"));
    if (m) {
      const [day, month] = /^\d/.test(m[1]) ? [+m[1], m[2]] : [+m[2], m[1]];
      let d = new Date(base.getFullYear(), MONTHS.indexOf(month.substring(0, 3)), day);
      if (d < base) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    m = t.match(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*/);
    if (m) {
      const diff = (DAYS.indexOf(m[1].substring(0, 3)) - base.getDay() + 7) % 7 || 7;
      return addDays(base, diff);
    }
    return null;
  }

  const findRoom = t => {
    t = t.toLowerCase();
    return HOTEL.rooms.find((r, i) =>
      t.includes(r.id) || t.includes(r.name.toLowerCase()) ||
      (r.id === "standard" && /queen|standard|cheap|basic|budget/.test(t)) ||
      (r.id === "deluxe" && /king|deluxe|sea|ocean|balcony/.test(t)) ||
      (r.id === "suite" && /family|suite|presidential|large|vip/.test(t)) ||
      t.trim() === String(i + 1)
    );
  };

  const reply = (text, chips = [], card = null, extra = {}) => ({ text, chips, card, ...extra });
  const MAIN = ["Book a room", "Room types & prices", "Hotel PYQs & FAQs", "Check-in & check-out", "Manage my booking"];

  /* ---------- Booking Flow ---------- */
  function startBooking(t) {
    state = { flow: "book", step: "checkin", draft: {} };
    const d = parseDate(t);
    if (d) return bookingStep(t);
    return reply(
      "I am pleased to assist with your reservation. What is your preferred **check-in date**?\nYou may indicate dates such as **“tomorrow”**, **“this Friday”**, **“Nov 15”**, or **“2026-11-20”**.",
      ["Tomorrow", "This Friday", "In 3 days"]
    );
  }

  function bookingStep(t) {
    const d = state.draft;
    switch (state.step) {
      case "checkin": {
        const date = parseDate(t);
        if (!date) {
          return reply(
            "Please provide a valid date format, such as **“tomorrow”**, **“Nov 12”**, or **“2026-11-05”**.",
            ["Tomorrow", "This Friday", "Nov 1"]
          );
        }
        if (date < today()) {
          return reply("The specified date is in the past. Please select today or a future date.");
        }
        d.checkin = date;
        state.step = "checkout";
        return reply(
          `Check-in scheduled for **${fmt(date)}**.\n\nHow many **nights** will you be staying, or what is your **check-out date**?`,
          ["1 night", "2 nights", "3 nights", "5 nights"]
        );
      }
      case "checkout": {
        let out = null;
        const n = t.match(/(\d+)\s*nights?/i);
        if (n) {
          out = addDays(d.checkin, +n[1]);
        } else {
          out = parseDate(t);
        }
        if (!out) {
          return reply("Please specify either a check-out date or length of stay (e.g., **“2 nights”** or **“Nov 15”**).", ["1 night", "2 nights", "3 nights"]);
        }
        const nights = Math.round((out - d.checkin) / 864e5);
        if (nights < 1) {
          return reply("Check-out must be at least one day after check-in. Please provide a valid departure date or night count.", ["1 night", "2 nights", "3 nights"]);
        }
        if (nights > 30) {
          return reply(`For stays exceeding 30 nights, please contact our Reservations Desk directly at ${HOTEL.phone}.`, ["Modify stay", "Main menu"]);
        }
        d.checkout = out;
        d.nights = nights;
        state.step = "guests";
        return reply(
          `Confirmed: **${nights} night${nights > 1 ? "s" : ""}** (Check-out: **${fmt(out)}**).\n\nHow many **guests** will be staying?`,
          ["1 guest", "2 guests", "3 guests", "4 guests"]
        );
      }
      case "guests": {
        const g = parseInt(t.match(/\d+/)?.[0], 10);
        if (!g || g < 1) {
          return reply("Please enter a valid guest count (e.g. **1**, **2**, or **4**).", ["1 guest", "2 guests", "3 guests", "4 guests"]);
        }
        if (g > 5) {
          return reply(
            `Our largest Presidential Suite accommodates up to 5 guests. For group reservations, please contact us at ${HOTEL.phone}.`,
            ["5 guests", "Main menu"]
          );
        }
        d.guests = g;
        state.step = "room";
        const fit = HOTEL.rooms.filter(r => r.sleeps >= g);
        return reply(
          `Accommodations available for **${g} guest${g > 1 ? "s" : ""}**:\n\nPlease select your preferred room:`,
          fit.map(r => r.name),
          null,
          { roomCards: fit, nights: d.nights }
        );
      }
      case "room": {
        const r = findRoom(t);
        const fit = HOTEL.rooms.filter(x => x.sleeps >= d.guests);
        if (!r) {
          return reply(
            "Please select one of our available accommodations below:",
            fit.map(x => x.name),
            null,
            { roomCards: fit, nights: d.nights }
          );
        }
        if (r.sleeps < d.guests) {
          return reply(
            `The **${r.name}** accommodates up to ${r.sleeps} guests. For ${d.guests} guests, please select a larger room:`,
            fit.map(x => x.name),
            null,
            { roomCards: fit, nights: d.nights }
          );
        }
        d.room = r;
        state.step = "name";
        return reply(
          `The **${r.name}** (${money(r.price)} per night) is selected.\n\nUnder what **full name** should this reservation be registered?`,
          ["Use John Doe", "Use Jane Smith"]
        );
      }
      case "name": {
        const name = t.replace(/^(my name is|i am|i'm|it's|its|name:?)\s+/i, "").trim();
        if (name.length < 2 || /\d/.test(name)) {
          return reply("Please provide a valid primary guest name (first and last name).");
        }
        d.name = name.replace(/\b\w/g, c => c.toUpperCase());
        state.step = "confirm";
        const sub = d.room.price * d.nights;
        const tax = sub * HOTEL.taxRate;
        const total = sub + tax;
        return reply(
          `Here is your **Reservation Summary**.\n\nPlease review your details below and confirm when you are ready:`,
          ["Yes, confirm booking", "Change room", "Start over"],
          summary(d),
          { bookingPreview: { ...d, sub, tax, total } }
        );
      }
      case "confirm": {
        if (has(t, /\b(yes|confirm|ok|okay|sure|book it|proceed|agree)\b/i)) {
          return confirmBooking();
        }
        if (has(t, /\b(change room|room)\b/i)) {
          state.step = "room";
          const fit = HOTEL.rooms.filter(r => r.sleeps >= d.guests);
          return reply("Which accommodation would you prefer instead?", fit.map(r => r.name), null, { roomCards: fit, nights: d.nights });
        }
        if (has(t, /\b(no|start over|cancel|restart|reset)\b/i)) {
          state = { flow: null, step: null, draft: {} };
          return reply("Reservation cancelled. Please let me know whenever you wish to reserve or ask a question.", MAIN);
        }
        return reply("Would you like to confirm this reservation? Reply **'Yes, confirm'** to finalize or **'Start over'** to cancel.", ["Yes, confirm booking", "Start over"]);
      }
    }
  }

  function summary(d) {
    const sub = d.room.price * d.nights;
    const tax = sub * HOTEL.taxRate;
    return [
      ["Primary Guest", d.name],
      ["Accommodation", d.room.name + " (" + d.room.beds + ")"],
      ["Check-In Date", fmt(d.checkin) + " (From " + HOTEL.checkIn + ")"],
      ["Check-Out Date", fmt(d.checkout) + " (By " + HOTEL.checkOut + ")"],
      ["Duration of Stay", d.nights + " night" + (d.nights > 1 ? "s" : "")],
      ["Total Guests", d.guests + " guest" + (d.guests > 1 ? "s" : "")],
      ["Room Rate", money(d.room.price) + " / night"],
      ["Subtotal (" + d.nights + " nights)", money(sub)],
      ["Taxes & Surcharges (12%)", money(tax)],
      ["Grand Total", money(sub + tax)],
      ["Payment Terms", "Pay at check-in (No advance deposit)"]
    ];
  }

  function confirmBooking() {
    const d = state.draft;
    const ref = "HV-" + Math.floor(10000 + Math.random() * 90000);
    const sub = d.room.price * d.nights;
    const tax = sub * HOTEL.taxRate;
    const total = sub + tax;
    const booking = {
      ref,
      name: d.name,
      room: d.room.name,
      roomId: d.room.id,
      nights: d.nights,
      guests: d.guests,
      checkin: d.checkin.toISOString(),
      checkout: d.checkout.toISOString(),
      subtotal: sub,
      tax: tax,
      total: total,
      createdAt: new Date().toISOString(),
      status: "Confirmed"
    };

    const all = load();
    all[ref] = booking;
    save(all);

    state = { flow: null, step: null, draft: {} };
    return reply(
      `**Your reservation is confirmed.**\n\nYour Booking Reference is **${ref}**.\n\nYou can review your stay anytime in the **'My Bookings'** tab or by typing your reference number.\n\n• **Check-in starts**: ${HOTEL.checkIn} on ${fmt(d.checkin)}\n• **Cancellation**: Free until 48 hours prior to check-in.\n• **Payment**: Settled upon arrival.`,
      ["View booking details", "Hotel PYQs & FAQs", "Directions & Airport shuttle", "Book another room"],
      [
        ["Reference Code", ref],
        ["Guest", booking.name],
        ["Accommodation", booking.room],
        ["Check-In", fmt(d.checkin)],
        ["Check-Out", fmt(d.checkout)],
        ["Status", "Confirmed"],
        ["Total Due at Check-In", money(total)]
      ],
      { confirmedBooking: booking }
    );
  }

  /* ---------- Manage Bookings ---------- */
  function showBooking(ref) {
    const all = load();
    const b = all[ref.toUpperCase()];
    if (!b) {
      return reply(
        `I could not locate booking reference **${ref.toUpperCase()}** on this device.\n\nPlease check the code (format: **HV-12345**) or contact our Front Desk at ${HOTEL.phone}.`,
        ["Book a room", "Main menu"]
      );
    }
    const checkinDate = new Date(b.checkin);
    const checkoutDate = new Date(b.checkout);

    return reply(
      `Verified reservation details for **${b.ref}**:`,
      b.status === "Confirmed" ? [`Cancel reservation ${b.ref}`, "Directions & Parking", "Main menu"] : ["Book a new room", "Main menu"],
      [
        ["Reservation Code", b.ref],
        ["Status", b.status === "Confirmed" ? "Confirmed" : "Cancelled"],
        ["Guest Name", b.name],
        ["Accommodation", b.room],
        ["Check-in", fmt(checkinDate) + " (" + HOTEL.checkIn + ")"],
        ["Check-out", fmt(checkoutDate) + " (" + HOTEL.checkOut + ")"],
        ["Stay Length", b.nights + " night" + (b.nights > 1 ? "s" : "")],
        ["Guests", b.guests + " guest" + (b.guests > 1 ? "s" : "")],
        ["Total Amount", money(b.total)]
      ],
      { bookingData: b }
    );
  }

  function askCancel(ref) {
    const all = load();
    const b = all[ref.toUpperCase()];
    if (!b) return reply(`I cannot find reservation **${ref.toUpperCase()}**.`);
    if (b.status !== "Confirmed") return reply(`Reservation **${b.ref}** is already cancelled.`);
    state = { flow: "cancel", step: "confirm", draft: { ref: b.ref } };
    return reply(
      `Are you sure you wish to cancel reservation **${b.ref}** (${b.room}, check-in ${fmt(new Date(b.checkin))})?\n\nPolicy: ${HOTEL.policies.cancellation}`,
      ["Yes, cancel reservation", "No, keep my reservation"]
    );
  }

  function cancelStep(t) {
    const ref = state.draft.ref;
    state = { flow: null, step: null, draft: {} };
    if (has(t, /\b(yes|cancel|confirm|proceed)\b/i)) {
      const all = load();
      if (all[ref]) {
        all[ref].status = "Cancelled";
        save(all);
      }
      return reply(
        `Reservation **${ref}** has been cancelled. No cancellation penalty was charged.\n\nMay I assist you with another booking or question?`,
        MAIN
      );
    }
    return reply("Your reservation remains **Confirmed** and unchanged. Let me know if you need any other assistance.", MAIN);
  }

  /* ---------- PYQ Matcher ---------- */
  function matchPYQ(query) {
    const q = query.toLowerCase();
    for (const item of HOTEL.pyq) {
      if (item.keywords.some(k => q.includes(k))) {
        return item;
      }
    }
    for (const item of HOTEL.pyq) {
      const words = item.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matches = words.filter(w => q.includes(w));
      if (matches.length >= 2) {
        return item;
      }
    }
    return null;
  }

  /* ---------- Main Intent Dispatcher ---------- */
  function respond(input) {
    const t = input.trim();
    const ref = t.match(/HV-\d{5}/i)?.[0];

    // Interrupt active flow
    if (state.flow && has(t, /^(stop|never ?mind|exit|quit|cancel|main menu|menu|back)$/i)) {
      state = { flow: null, step: null, draft: {} };
      return reply("Request cancelled. How else may I assist you today?", MAIN);
    }

    // Active sub-flows
    if (state.flow === "book") return bookingStep(t);
    if (state.flow === "cancel") return cancelStep(t);

    // Explicit Reference / Cancellation Commands
    if (has(t, /\bcancel\b/i) && ref) return askCancel(ref);
    if (ref) return showBooking(ref);

    // Check PYQs bank
    const pyqMatch = matchPYQ(t);
    if (pyqMatch && !has(t, /^(book|reserve|room for)\b/i)) {
      return reply(
        `**${pyqMatch.question}**\n\n${pyqMatch.answer}`,
        ["Book a room", "More PYQs & FAQs", "Manage my booking"]
      );
    }

    // Manage Booking
    if (has(t, /\b(manage|my booking|my reservation|find booking|check reservation|lookup|status)\b/i) && !has(t, /policy/i)) {
      const all = load();
      const refs = Object.keys(all);
      if (refs.length > 0) {
        const lastRef = refs[refs.length - 1];
        return reply(
          `Please provide your booking reference code (e.g., **HV-12345**), or choose one of your recent bookings:`,
          [lastRef, ...refs.slice(-3).reverse(), "Book a new room"]
        );
      }
      return reply("Please provide your 5-digit booking reference, such as **HV-12345**, to check or modify your reservation.", ["Book a room"]);
    }

    // Booking Intent
    if (has(t, /\b(book|reserve|reservation|stay at|vacanc|room for)\b/i) && !has(t, /policy|rate|price|type|cost/i)) {
      return startBooking(t);
    }

    // Room Types and Pricing Intent
    if (has(t, /\b(room|rooms|price|prices|rate|rates|cost|suite|suites|types|bed|beds)\b/i)) {
      const list = HOTEL.rooms.map(r =>
        `**${r.name}** (${money(r.price)} per night)\n• ${r.beds} · ${r.size} · ${r.view}\n• Highlights: ${r.features.slice(0, 3).join(", ")}\n*${r.info}*`
      ).join("\n\n");
      return reply(
        `Available accommodations:\n\n${list}\n\n*All rates are subject to ${Math.round(HOTEL.taxRate * 100)}% hospitality tax.*`,
        ["Book a room", "Standard Queen", "Deluxe King", "Presidential Suite"],
        null,
        { roomCards: HOTEL.rooms }
      );
    }

    // PYQ / FAQ Overview Intent
    if (has(t, /\b(pyq|faq|faqs|frequently asked|popular questions|questions)\b/i)) {
      const topPYQs = HOTEL.pyq.slice(0, 5).map((p, i) => `${i + 1}. **${p.question}**`).join("\n");
      return reply(
        `Frequently Asked Questions (PYQs):\n\n${topPYQs}\n\nSelect a question below or enter your inquiry directly:`,
        HOTEL.pyq.slice(0, 4).map(p => p.question.substring(0, 26) + "...")
      );
    }

    // Check-in / Check-out Intent
    if (has(t, /check.?in|check.?out|arrival|departure|early|late/i)) {
      return reply(
        `Standard check-in begins at **${HOTEL.checkIn}** and check-out is by **${HOTEL.checkOut}**.\n\n• **Early Arrival**: ${HOTEL.earlyCheckIn}\n• **Late Departure**: ${HOTEL.lateCheckOut}\n\nFor custom arrangements, please contact the concierge desk at ${HOTEL.phone}.`,
        ["Book a room", "Amenities", "Hotel PYQs & FAQs"]
      );
    }

    // Amenities Intent
    if (has(t, /amenit|wifi|wi-fi|pool|gym|fitness|spa|breakfast|dining|food|parking|shuttle/i)) {
      return reply(
        `**Harbor View Hotel Amenities & Services**:\n\n• ${HOTEL.amenities.join("\n• ")}\n\nWould you like to reserve a room or inquire about a specific service?`,
        ["Book a room", "Room types & prices", "Rooftop Pool details"]
      );
    }

    // Cancellation & Policies Intent
    if (has(t, /cancellation|refund|policy|policies|rules/i)) {
      return reply(
        `**Cancellation & Guarantee Policy**:\n\n${HOTEL.policies.cancellation}\n\n• **Pets**: ${HOTEL.policies.pets}\n• **Children**: ${HOTEL.policies.children}\n• **Payment**: ${HOTEL.policies.payment}`,
        ["Book a room", "Manage my booking", "Main menu"]
      );
    }

    // Pets Intent
    if (has(t, /\bpets?\b|\bdogs?\b|\bcats?\b/i)) {
      return reply(HOTEL.policies.pets, ["Book a room", "Hotel PYQs & FAQs"]);
    }

    // Contact & Location Intent
    if (has(t, /location|address|where|direction|map|contact|phone|email|call|talk to human|agent/i)) {
      return reply(
        `**${HOTEL.name}**\n\n• **Address**: ${HOTEL.address}\n• **Phone**: ${HOTEL.phone} (24/7 Front Desk)\n• **Email**: ${HOTEL.email}\n• **Concierge**: Available in this chat 24/7`,
        ["Book a room", "Airport shuttle & parking", "Hotel PYQs & FAQs"]
      );
    }

    // Small Talk / Greetings
    if (has(t, /\b(hi|hello|hey|good morning|good evening|good afternoon|howdy)\b/i)) {
      return reply(
        `Welcome to **${HOTEL.name}**. How may I assist with your stay today?`,
        MAIN
      );
    }

    if (has(t, /\b(thank|thanks|thx|appreciate)\b/i)) {
      return reply("It is our pleasure to assist you. Please let me know if you require anything further.", MAIN);
    }

    if (has(t, /\b(bye|goodbye|see you)\b/i)) {
      return reply("Thank you for choosing Harbor View Hotel. We look forward to welcoming you soon.");
    }

    // Fallback response
    return reply(
      `I am your **Harbor View Concierge**. I can assist with:\n\n• **Room Reservations** with current rates\n• **Hotel PYQs** (Check-in/out, policies, breakfast, shuttle)\n• **Managing or Cancelling Stays** with your reference code\n\nHow may I help you?`,
      MAIN
    );
  }

  const greeting = () => reply(
    `Welcome to **${HOTEL.name}**.\n\nI am your 24/7 AI Concierge. I can assist you with reserving a room, checking rates, answering hotel questions (PYQ), or managing an existing reservation.\n\nHow may I help you today?`,
    MAIN
  );

  const reset = () => { state = { flow: null, step: null, draft: {} }; };

  return { respond, greeting, reset, getBookings: load, cancelBooking: askCancel };
})();
