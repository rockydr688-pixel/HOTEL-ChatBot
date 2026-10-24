# Harbor View Hotel & Suites – ChatGPT-Styled Reservations AI Platform

A state-of-the-art, ChatGPT-styled hotel reservation and guest concierge platform built with vanilla HTML5, CSS3, and modern JavaScript. Zero external frameworks, zero build steps, and lightweight.

---

## 🌟 Key Features

1. **ChatGPT-Styled Platform Experience**:
   - **Collapsible Sidebar**: New Chat (`Ctrl+N`), active chat session history with auto-naming, saved stays list with reference numbers, and quick access to Hotel PYQs.
   - **Model Selector Pill**: Shows "Harbor View Concierge (GPT-4o Luxury)".
   - **Welcome Hero Screen**: Central hotel logo with glowing halo and responsive 2x3 grid of curated Hotel PYQ prompt cards.
   - **Typewriter Streaming Effect**: Real-time word-by-word streaming responses with blinking cursor.
   - **Dark & Light Mode**: ChatGPT dark mode theme with emerald (`#10a37f`) & gold accents, plus a clean light mode with persistent toggle.
   - **Voice Input**: Web Speech API voice dictation with pulsing recording state.
   - **Message Tools**: Copy reply, Read aloud (Text-to-Speech), and feedback options.

2. **Step-by-Step Interactive Booking Engine**:
   - Understands natural date expressions ("tomorrow", "this Friday", "Nov 15", "in 3 days").
   - Calculates night count, room suitability by guest count, subtotal, and 12% hospitality tax.
   - Displays interactive room cards with amenities, bed type, size, and instant "Book this room" buttons.
   - Generates official booking confirmation folios (`HV-XXXXX`) with one-click copy, print, or cancellation.
   - Saves all bookings in `localStorage`.

3. **Curated Hotel PYQs (Previous / Frequently Asked Questions)**:
   - Dedicated searchable **PYQ Knowledge Base modal** with category filter pills (Booking, Check-in/out, Rates & Taxes, Dining, Amenities, Policies).
   - Instant answers with direct **"Ask in Chat"** buttons.
   - Natural language PYQ matching in conversational chat.

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser, or:
2. Start a local server:
   ```bash
   python -m http.server 8080
   ```
   and navigate to `http://localhost:8080`.

---

## 📁 Project Structure

- `index.html`: ChatGPT shell, sidebar, chat feed, floating composer, and modal drawers.
- `css/style.css`: ChatGPT dark/light themes, typography, glassmorphism, responsive grid, and custom scrollbars.
- `js/data.js`: Hotel configuration, rooms, prices, amenities, policies, and the complete PYQ database.
- `js/bot.js`: Natural language intent classifier, date parser, PYQ matcher, and booking engine.
- `js/app.js`: Session controller, streaming typewriter effect, voice dictation, speech synthesis, and modals.
- `assets/favicon.svg`: Vector branding logo.
