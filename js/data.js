// Hotel configuration and comprehensive PYQ (Popular Frequently Asked Questions) data bank
const HOTEL = {
  name: "Harbor View Hotel & Suites",
  tagline: "Luxury Waterfront Stays & Unmatched Hospitality",
  phone: "+1 (555) 010-2400",
  email: "reservations@harborviewhotel.example",
  address: "12 Seawall Boulevard, Marina District, Harbor City, HC 98001",
  checkIn: "3:00 PM",
  checkOut: "11:00 AM",
  earlyCheckIn: "Subject to availability. Early check-in from 11:00 AM is complimentary for Deluxe & Suite guests.",
  lateCheckOut: "Late check-out until 2:00 PM available on request for $35 (complimentary with Suite bookings).",
  taxRate: 0.12,
  rooms: [
    {
      id: "standard",
      name: "Standard Queen",
      price: 120,
      sleeps: 2,
      beds: "1 Queen Bed",
      size: "26 m² / 280 sq ft",
      view: "City Skyline",
      badge: "Popular for Couples",
      features: ["Complimentary High-speed Wi-Fi", "43\" 4K Smart TV", "Rain Shower", "Work Desk", "Espresso Machine", "Mini Bar"],
      info: "Cozy and stylish room featuring a plush queen bed, premium linens, marble bathroom, and vibrant city skyline views."
    },
    {
      id: "deluxe",
      name: "Deluxe King",
      price: 180,
      sleeps: 3,
      beds: "1 King Bed + Rollaway Option",
      size: "36 m² / 387 sq ft",
      view: "Panoramic Ocean / Marina View",
      badge: "Guest Favorite",
      features: ["Private Balcony with Ocean View", "Soaking Bathtub & Rain Shower", "55\" OLED TV", "Nespresso Bar & Lounge Seating", "High-speed Wi-Fi", "Bathrobes & Luxury Toiletries"],
      info: "Expansive haven with sweeping harbor panoramas, private open-air balcony, and an ultra-luxurious King bed."
    },
    {
      id: "suite",
      name: "Presidential Family Suite",
      price: 260,
      sleeps: 5,
      beds: "1 King Bed + 2 Twin Beds + Queen Sofa Bed",
      size: "62 m² / 667 sq ft",
      view: "Dual Panoramic Sea & Skyline View",
      badge: "Ultimate Luxury",
      features: ["Two Master Bedrooms", "Spacious Living Room", "Fully-equipped Kitchenette & Dining Area", "2 Full Bathrooms with Jacuzzi", "Complimentary Executive Lounge Access", "Dedicated 24/7 Butler Service"],
      info: "Our flagship suite designed for families or VIP travelers seeking luxury, privacy, full kitchen, and generous space."
    }
  ],
  amenities: [
    "High-Speed Fiber Wi-Fi (included in all rooms & public areas)",
    "Rooftop Infinity Pool & Sundeck (Open daily 7:00 AM – 10:00 PM)",
    "Harborview Bistro & Bar (Breakfast 6:30–10:30 AM, Dinner 5:30–10:30 PM)",
    "24/7 State-of-the-Art Technogym & Wellness Studio",
    "On-demand Airport Shuttle ($25 per trip, reservation required 6h ahead)",
    "Secure On-site Valet & Self-Parking (Complimentary for hotel guests)",
    "Full-service Spa & Sauna (Massages, facials, and steam rooms)",
    "Business Center & High-tech Meeting Rooms"
  ],
  policies: {
    cancellation: "Free cancellation up to 48 hours before check-in. Cancellations within 48 hours are subject to a fee equal to the first night's room rate + tax.",
    pets: "Pet-friendly! Small to medium pets (up to 15 kg / 33 lbs) welcome. A cleaning fee of $25/night applies. Bowls and pet beds provided on request.",
    children: "Children under 12 stay free when using existing bedding. Complimentary baby cots/cribs available upon request.",
    payment: "No advance payment needed for standard bookings; you pay directly at check-in or check-out. Major credit/debit cards (Visa, MasterCard, Amex) and digital payments (Apple Pay, Google Pay) accepted. A valid government photo ID and payment card are required at check-in.",
    smoking: "100% smoke-free property. Designated smoking lounges are located outdoors on the ground floor.",
    parking: "Complimentary self-parking and valet parking are included for all registered hotel guests."
  },
  // Curated Hotel PYQ (Previous / Frequently Asked Questions) database
  pyq: [
    {
      id: "pyq-1",
      category: "Booking & Availability",
      question: "How do I book a room and what details are needed?",
      keywords: ["how to book", "reservation steps", "how do i book", "make reservation", "book room"],
      answer: "Booking is seamless! Just click **'Book a room'** or tell me your check-in date, length of stay, guest count, and preferred room type. I will calculate your total with taxes and generate your confirmation reference instantly."
    },
    {
      id: "pyq-2",
      category: "Check-in & Check-out",
      question: "What are your check-in and check-out times? Is early arrival possible?",
      keywords: ["check in", "check out", "check-in", "check-out", "early arrival", "late checkout", "arrival time", "times"],
      answer: "Check-in starts at **3:00 PM** and check-out is by **11:00 AM**.\n\n• **Early Check-in**: Available from 11:00 AM upon room readiness (complimentary for Deluxe and Suites).\n• **Late Check-out**: Available until 2:00 PM for $35 (subject to availability; complimentary with Presidential Suite)."
    },
    {
      id: "pyq-3",
      category: "Cancellation & Refunds",
      question: "What is your cancellation and refund policy?",
      keywords: ["cancellation", "refund", "cancel policy", "free cancellation", "penalty"],
      answer: "Enjoy peace of mind with our flexible policy:\n\n• **Free Cancellation**: You can cancel free of charge up to **48 hours** prior to check-in (3:00 PM local time).\n• **Late Cancellations / No-shows**: Charged the cost of the first night + tax.\n• To cancel, simply provide your booking reference (e.g., **HV-12345**)."
    },
    {
      id: "pyq-4",
      category: "Pricing & Taxes",
      question: "What are your room rates and what taxes are added?",
      keywords: ["price", "prices", "rates", "cost", "how much", "tax", "taxes", "fee"],
      answer: "Our nightly rates are:\n\n1. **Standard Queen**: $120/night (Sleeps 2)\n2. **Deluxe King**: $180/night (Sleeps 3, Ocean Balcony)\n3. **Presidential Family Suite**: $260/night (Sleeps 5, 2 Bedrooms)\n\nA standard city hospitality tax of **12%** is applied at checkout. No hidden resort fees!"
    },
    {
      id: "pyq-5",
      category: "Dining & Breakfast",
      question: "Is breakfast included and what dining options do you offer?",
      keywords: ["breakfast", "dining", "food", "restaurant", "buffet", "eat", "room service"],
      answer: "We offer dining at **Harborview Bistro & Lounge**:\n\n• **Artisan Breakfast Buffet**: Daily from 6:30 AM to 10:30 AM ($18/person, or included with Suite bookings).\n• **Dinner & Cocktails**: Nightly fresh seafood and gourmet selections from 5:30 PM to 10:30 PM.\n• **24/7 In-Room Dining**: Full menu available anytime."
    },
    {
      id: "pyq-6",
      category: "Facilities & Amenities",
      question: "What amenities are available (pool, gym, Wi-Fi)?",
      keywords: ["amenities", "pool", "gym", "wifi", "wi-fi", "fitness", "facilities", "spa"],
      answer: "All guests enjoy complimentary access to:\n\n• **Rooftop Infinity Pool & Sun Deck**: Heated year-round, open 7:00 AM – 10:00 PM.\n• **24/7 Technogym Studio**: Cardio, free weights, and yoga area.\n• **High-Speed Fiber Wi-Fi**: Gigabit speeds throughout the property.\n• **Complimentary Business Center**: Printing, scanning, and iMac stations."
    },
    {
      id: "pyq-7",
      category: "Transportation & Parking",
      question: "Do you offer airport shuttle services and parking?",
      keywords: ["shuttle", "airport", "parking", "car", "valet", "transfer", "transport"],
      answer: "Yes, we make travel effortless:\n\n• **Airport Shuttle**: Available 24/7 for **$25 per trip** (please reserve at least 6 hours in advance).\n• **Parking**: Both self-parking and covered valet parking are **100% complimentary** for registered guests."
    },
    {
      id: "pyq-8",
      category: "Policies & Pets",
      question: "Are pets allowed in the hotel rooms?",
      keywords: ["pet", "pets", "dog", "cat", "animals", "pet friendly"],
      answer: "Yes! We are proud to be pet-friendly. We welcome dogs and cats up to 15 kg (33 lbs) for a small cleaning fee of **$25/night**. We provide plush pet bedding, food/water bowls, and gourmet welcome treats!"
    },
    {
      id: "pyq-9",
      category: "Family & Children",
      question: "Do children stay free and can we get an extra bed or baby cot?",
      keywords: ["children", "child", "kids", "baby", "crib", "cot", "extra bed", "family"],
      answer: "Families are warmly welcome! Children under 12 stay **free of charge** when using existing room beds. We also provide baby cots/cribs complimentary upon request. Rollaway beds can be added to Deluxe and Suite rooms for $20/night."
    },
    {
      id: "pyq-10",
      category: "Payment & Security",
      question: "What payment methods do you accept and do I need a deposit?",
      keywords: ["payment", "pay", "credit card", "debit", "deposit", "cash", "apple pay"],
      answer: "You do not need to pay in advance when booking here! Payment is processed at the front desk upon arrival. We accept Visa, MasterCard, American Express, Discover, Apple Pay, Google Pay, and cash. A credit card authorization is taken at check-in for incidentals."
    },
    {
      id: "pyq-11",
      category: "Booking & Availability",
      question: "How do I check or cancel an existing reservation?",
      keywords: ["manage", "find my booking", "check reservation", "cancel booking", "lookup", "reference"],
      answer: "Simply type your reference code in chat (e.g. **HV-12345**), or ask **'Manage my booking'** or click the **'My Bookings'** tab in the sidebar. You can review your stay details, status, and cancel anytime."
    },
    {
      id: "pyq-12",
      category: "Location & Contact",
      question: "Where is the hotel located and how can I speak to a front desk agent?",
      keywords: ["address", "location", "contact", "phone", "email", "front desk", "human", "agent", "call"],
      answer: "You can find and contact us at:\n\n• **Address**: 12 Seawall Boulevard, Marina District, Harbor City, HC 98001\n• **Phone**: +1 (555) 010-2400 (Front desk open 24/7)\n• **Email**: reservations@harborviewhotel.example\n• **Concierge**: Available right here in this chat anytime!"
    }
  ]
};
