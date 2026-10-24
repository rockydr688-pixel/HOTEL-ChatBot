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
      const diff = (6 - base.getDay() + 7) % 7 || 7; // coming Saturday
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
      "I'm delighted to assist with your reservation! 🏨\n\nWhat is your preferred **check-in date**?\nYou can say things like **“tomorrow”**, **“this Friday”**, **“Nov 15”**, or **“2026-11-20”**.",
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
            "I couldn't quite detect that date. Please try a format like **“tomorrow”**, **“Nov 12”**, or **“2026-11-05”**.",
            ["Tomorrow", "This Friday", "Nov 1"]
          );
        }
        if (date < today()) {
          return reply("That date appears to be in the past. Please pick today or a future date.");
        }
        d.checkin = date;
        state.step = "checkout";
        return reply(
          `Check-in set for **${fmt(date)}** 📅.\n\nHow many **nights** will you be staying, or what is your **check-out date**?`,
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
          return reply("Please tell me either a check-out date or number of nights (e.g., **“2 nights”** or **“Nov 15”**).", ["1 night", "2 nights", "3 nights"]);
        }
        const nights = Math.round((out - d.checkin) / 864e5);
        if (nights < 1) {
          return reply("Check-out must be at least 1 day after check-in. Could you provide a valid check-out date or night count?", ["1 night", "2 nights", "3 nights"]);
        }
        if (nights > 30) {
          return reply(`For extended stays over 30 nights, please contact our VIP Reservations Desk directly at ${HOTEL.phone}.`, ["Modify stay", "Main menu"]);
        }
        d.checkout = out;
        d.nights = nights;
        state.step = "guests";
        return reply(
          `Got it: **${nights} night${nights > 1 ? "s" : ""}** (Check-out: **${fmt(out)}**).\n\nHow many **guests** (adults + children) will be staying?`,
          ["1 guest", "2 guests", "3 guests", "4 guests"]
        );
      }
      case "guests": {
        const g = parseInt(t.match(/\d+/)?.[0], 10);
        if (!g || g < 1) {
          return reply("Please provide a valid guest number (e.g. **1**, **2**, or **4**).", ["1 guest", "2 guests", "3 guests", "4 guests"]);
        }
        if (g > 5) {
          return reply(
            `Our largest Presidential Suite accommodates up to 5 guests. For larger parties or group room blocks, please speak with our reservations team at ${HOTEL.phone}.`,
            ["5 guests", "Main menu"]
          );
        }
        d.guests = g;
        state.step = "room";
        const fit = HOTEL.rooms.filter(r => r.sleeps >= g);
        return reply(
          `Here are the luxury accommodations available for **${g} guest${g > 1 ? "s" : ""}**:\n\nSelect your preferred room:`,
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
            "Please select one of our available rooms below:",
            fit.map(x => x.name),
            null,
            { roomCards: fit, nights: d.nights }
          );
        }
        if (r.sleeps < d.guests) {
          return reply(
            `The **${r.name}** accommodates up to ${r.sleeps} guests. For ${d.guests} guests, please pick a larger accommodation:`,
            fit.map(x => x.name),
            null,
            { roomCards: fit, nights: d.nights }
          );
        }
        d.room = r;
        state.step = "name";
        return reply(
          `Excellent choice! The **${r.name}** (${money(r.price)}/night) is selected. ✨\n\nUnder what **full name** should this reservation be registered?`,
          ["Use John Doe", "Use Jane Smith"]
        );
      }
      case "name": {
        const name = t.replace(/^(my name is|i am|i'm|it's|its|name:?)\s+/i, "").trim();
        if (name.length < 2 || /\d/.test(name)) {
          return reply("Please provide a valid primary guest name (first and last name preferred).");
        }
        d.name = name.replace(/\b\w/g, c => c.toUpperCase());
        state.step = "confirm";
        const sub = d.room.price * d.nights;
        const tax = sub * HOTEL.taxRate;
        const total = sub + tax;
        return reply(
          `Here is your **Reservation Summary** 📋\n\nPlease review your details below and confirm when you're ready:`,
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
          return reply("No problem! Which room would you prefer instead?", fit.map(r => r.name), null, { roomCards: fit, nights: d.nights });
        }
        if (has(t, /\b(no|start over|cancel|restart|reset)\b/i)) {
          state = { flow: null, step: null, draft: {} };
          return reply("Reservation cancelled. Let me know whenever you'd like to book or ask a question!", MAIN);
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
      ["Payment Terms", "Pay at check-in (No deposit required)"]
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
      `🎉 **Congratulations! Your reservation is confirmed.**\n\nYour Booking Reference is **${ref}**.\n\nA reminder email has been queued. You can view your stay anytime in the **'My Bookings'** tab or by typing your reference number.\n\n• **Check-in starts**: ${HOTEL.checkIn} on ${fmt(d.checkin)}\n• **Cancellation**: Free until 48h prior to check-in.\n• **Payment**: Settled upon arrival.`,
      ["View booking details", "Hotel PYQs & FAQs", "Directions & Airport shuttle", "Book another room"],
      [
        ["Reference #", ref],
        ["Guest", booking.name],
        ["Room", booking.room],
        ["Check-In", fmt(d.checkin)],
        ["Check-Out", fmt(d.checkout)],
        ["Status", "Confirmed ✅"],
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
        `I could not locate booking reference **${ref.toUpperCase()}** on this device.\n\nPlease check the code (format: **HV-12345**) or contact Front Desk support at ${HOTEL.phone}.`,
        ["Book a room", "Main menu"]
      );
    }
    const checkinDate = new Date(b.checkin);
    const checkoutDate = new Date(b.checkout);
    const isConfirmed = b.status === "Confirmed";

    return reply(
      `Here are the verified details for reservation **${b.ref}**:`,
      isConfirmed ? [`Cancel reservation ${b.ref}`, "Directions & Parking", "Main menu"] : ["Book a new room", "Main menu"],
      [
        ["Reservation Code", b.ref],
        ["Status", b.status === "Confirmed" ? "Confirmed ✅" : "Cancelled ❌"],
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
      `Are you sure you want to cancel reservation **${b.ref}** (${b.room}, checking in ${fmt(new Date(b.checkin))})?\n\n*Policy: ${HOTEL.policies.cancellation}*`,
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
        `✅ Reservation **${ref}** has been successfully cancelled. No cancellation penalty was charged.\n\nCan I assist you with a future stay or any questions?`,
        MAIN
      );
    }
    return reply("Your reservation remains **Confirmed** and unchanged. Let me know if you need any other assistance!", MAIN);
  }

  /* ---------- PYQ Matcher ---------- */
  function matchPYQ(query) {
    const q = query.toLowerCase();
    // 1. Direct or fuzzy match against question keywords
    for (const item of HOTEL.pyq) {
      if (item.keywords.some(k => q.includes(k))) {
        return item;
      }
    }
    // 2. Substring match on question text
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

    // Escape/Interrupt active flow
    if (state.flow && has(t, /^(stop|never ?mind|exit|quit|cancel|main menu|menu|back)$/i)) {
      state = { flow: null, step: null, draft: {} };
      return reply("I've stopped that request. How else may I assist you today?", MAIN);
    }

    // Active sub-flows
    if (state.flow === "book") return bookingStep(t);
    if (state.flow === "cancel") return cancelStep(t);

    // Explicit Reference / Cancellation Commands
    if (has(t, /\bcancel\b/i) && ref) return askCancel(ref);
    if (ref) return showBooking(ref);

    // Check PYQs bank first for high accuracy answers
    const pyqMatch = matchPYQ(t);
    if (pyqMatch && !has(t, /^(book|reserve|room for)\b/i)) {
      return reply(
        `💡 **${pyqMatch.question}**\n\n${pyqMatch.answer}`,
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
          `Please provide your booking reference code (e.g., **HV-12345**), or choose one of your recent bookings below:`,
          [lastRef, ...refs.slice(-3).reverse(), "Book a new room"]
        );
      }
      return reply("Please provide your 5-digit booking reference, such as **HV-12345**, to check or modify your stay.", ["Book a room"]);
    }

    // Booking Intent
    if (has(t, /\b(book|reserve|reservation|stay at|vacanc|room for)\b/i) && !has(t, /policy|rate|price|type|cost/i)) {
      return startBooking(t);
    }

    // Room Types and Pricing Intent
    if (has(t, /\b(room|rooms|price|prices|rate|rates|cost|suite|suites|types|bed|beds)\b/i)) {
      const list = HOTEL.rooms.map(r =>
        `**${r.name}** (${money(r.price)}/night)\n• ${r.beds} · ${r.size} · ${r.view}\n• Highlights: ${r.features.slice(0, 3).join(", ")}\n*${r.info}*`
      ).join("\n\n");
      return reply(
        `Here are our available luxury accommodations:\n\n${list}\n\n*All rates subject to ${Math.round(HOTEL.taxRate * 100)}% hospitality tax.*`,
        ["Book a room", "Standard Queen", "Deluxe King", "Presidential Suite"],
        null,
        { roomCards: HOTEL.rooms }
      );
    }

    // PYQ / FAQ Overview Intent
    if (has(t, /\b(pyq|faq|faqs|frequently asked|popular questions|questions)\b/i)) {
      const topPYQs = HOTEL.pyq.slice(0, 5).map((p, i) => `${i + 1}. **${p.question}**`).join("\n");
      return reply(
        `Here are the most **Popular Questions (PYQs)** from guests:\n\n${topPYQs}\n\nTap any question below or ask me anything directly:`,
        HOTEL.pyq.slice(0, 4).map(p => p.question.substring(0, 26) + "...")
      );
    }

    // Check-in / Check-out Intent
    if (has(t, /check.?in|check.?out|arrival|departure|early|late/i)) {
      return reply(
        `Standard check-in starts at **${HOTEL.checkIn}** and check-out is by **${HOTEL.checkOut}**.\n\n• **Early Arrival**: ${HOTEL.earlyCheckIn}\n• **Late Departure**: ${HOTEL.lateCheckOut}\n\nNeed special arrangements? Call our concierge at ${HOTEL.phone}.`,
        ["Book a room", "Amenities", "Hotel PYQs & FAQs"]
      );
    }

    // Amenities Intent
    if (has(t, /amenit|wifi|wi-fi|pool|gym|fitness|spa|breakfast|dining|food|parking|shuttle/i)) {
      return reply(
        `✨ **Harbor View Hotel Amenities & Services**:\n\n• ${HOTEL.amenities.join("\n• ")}\n\nWould you like to book a room or inquire about specific services?`,
        ["Book a room", "Room types & prices", "Rooftop Pool details"]
      );
    }

    // Cancellation & Policies Intent
    if (has(t, /cancellation|refund|policy|policies|rules/i)) {
      return reply(
        `🛡️ **Cancellation & Guarantee Policy**:\n\n${HOTEL.policies.cancellation}\n\n• **Pets**: ${HOTEL.policies.pets}\n• **Children**: ${HOTEL.policies.children}\n• **Payment**: ${HOTEL.policies.payment}`,
        ["Book a room", "Manage my booking", "Main menu"]
      );
    }

    // Pets Intent
    if (has(t, /\bpets?\b|\bdogs?\b|\bcats?\b/i)) {
      return reply(`🐾 ${HOTEL.policies.pets}`, ["Book a room", "More FAQs"]);
    }

    // Contact & Location Intent
    if (has(t, /location|address|where|direction|map|contact|phone|email|call|talk to human|agent/i)) {
      return reply(
        `📍 **${HOTEL.name}**\n\n• **Address**: ${HOTEL.address}\n• **Phone**: ${HOTEL.phone} (24/7 Front Desk)\n• **Email**: ${HOTEL.email}\n• **Concierge**: Active right here in this chat!`,
        ["Book a room", "Airport shuttle & parking", "Hotel PYQs & FAQs"]
      );
    }

    // Small Talk / Greetings
    if (has(t, /\b(hi|hello|hey|good morning|good evening|good afternoon|howdy)\b/i)) {
      return reply(
        `Hello and welcome to **${HOTEL.name}**! 🌊 How may I assist your travel plans today?`,
        MAIN
      );
    }

    if (has(t, /\b(thank|thanks|thx|appreciate)\b/i)) {
      return reply("It's our pleasure to assist you! Please let me know if you need anything else.", MAIN);
    }

    if (has(t, /\b(bye|goodbye|see you)\b/i)) {
      return reply("Thank you for choosing Harbor View Hotel. We look forward to welcoming you soon! Safe travels! 🛎️");
    }

    // Fallback response with helpful recommendations
    return reply(
      `I'm your **Harbor View AI Concierge**. I can assist with:\n\n• **Instant Room Reservations** with live pricing\n• **Hotel PYQs** (Check-in/out, policies, breakfast, shuttle)\n• **Managing or Cancelling Stays** using your reference code\n\nWhat would you like to explore?`,
      MAIN
    );
  }

  const greeting = () => reply(
    `Welcome to **${HOTEL.name}**! 🛎️\n\nI am your 24/7 AI Concierge. I can help you reserve a room, check real-time rates, lookup popular hotel questions (PYQ), or manage an existing reservation.\n\nHow can I help you today?`,
    MAIN
  );

  const reset = () => { state = { flow: null, step: null, draft: {} }; };

  return { respond, greeting, reset, getBookings: load, cancelBooking: askCancel };
})();
