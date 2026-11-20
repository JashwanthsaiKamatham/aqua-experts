/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIG — edit the brand, contact details, prices and colours here.
 *  Nothing secret belongs in this file (it ships to the browser).
 * ─────────────────────────────────────────────────────────────
 */
export const CONFIG = {
  brand: {
    name: 'AQUA-EXPERTS',
    shortName: 'AQUA',
    tagline: '100% pure. Zero worry.',
    city: 'Bengaluru',
    established: 2014
  },
  contact: {
    phone: '+91 90000 00000', // ← replace with your real number
    phoneRaw: '+919000000000',
    whatsapp: '919000000000', // ← WhatsApp number, digits only, with country code
    email: 'care@aqua-experts.in',
    address: 'No. 14, 2nd Cross, 100 Feet Road, Indiranagar, Bengaluru 560038',
    hours: 'Mon – Sat · 9:00 AM – 8:00 PM',
    mapQuery: 'Indiranagar, Bengaluru'
  },
  products: [
    {
      id: 'aqua-pure',
      name: 'Aqua Pure RO',
      price: 7499,
      mrp: 9499,
      storage: '7 L',
      tech: ['RO'],
      badge: 'Best for borewell water',
      colour: '#22D3EE',
      specs: {
        'Purification': '6-stage RO',
        'Storage': '7 litres',
        'TDS reduction': 'Up to 95%',
        'Suitable for': 'TDS up to 1500 ppm',
        'Power': '36 W',
        'Warranty': '1 year + 1 year free service'
      },
      blurb: 'The everyday essential. Removes dissolved salts, hardness and heavy metals for small families.'
    },
    {
      id: 'aqua-pure-uv',
      name: 'Aqua Pure RO + UV',
      price: 8999,
      mrp: 11499,
      storage: '8 L',
      tech: ['RO', 'UV'],
      badge: 'Most popular',
      colour: '#38BDF8',
      specs: {
        'Purification': '7-stage RO + UV',
        'Storage': '8 litres',
        'TDS reduction': 'Up to 96%',
        'Suitable for': 'TDS up to 2000 ppm',
        'Power': '45 W',
        'Warranty': '2 years comprehensive'
      },
      blurb: 'Double protection — RO for dissolved impurities, UV for bacteria and viruses. The family favourite.'
    },
    {
      id: 'aqua-shield',
      name: 'Aqua Shield RO + UV + UF',
      price: 10499,
      mrp: 13499,
      storage: '9 L',
      tech: ['RO', 'UV', 'UF'],
      badge: 'Best value',
      colour: '#0EA5E9',
      specs: {
        'Purification': '8-stage RO + UV + UF',
        'Storage': '9 litres',
        'TDS reduction': 'Up to 97%',
        'Suitable for': 'TDS up to 2500 ppm',
        'Power': '50 W',
        'Warranty': '2 years + 3 free services'
      },
      blurb: 'Ultrafiltration catches what RO misses, keeping essential minerals while the water stays spotless.'
    },
    {
      id: 'aqua-elite',
      name: 'Aqua Elite RO + UV + UF + TDS',
      price: 11999,
      mrp: 15499,
      storage: '10 L',
      tech: ['RO', 'UV', 'UF', 'TDS'],
      badge: 'Flagship',
      colour: '#67E8F9',
      specs: {
        'Purification': '10-stage RO + UV + UF + TDS',
        'Storage': '10 litres',
        'TDS reduction': 'Smart TDS controller',
        'Suitable for': 'All water sources',
        'Power': '55 W',
        'Warranty': '3 years comprehensive'
      },
      blurb: 'Our flagship. Live TDS display, mineral retention and the quietest pump we have ever shipped.'
    }
  ],
  services: [
    {
      id: 'installation',
      name: 'Installation',
      from: 499,
      icon: 'install',
      desc: 'Same-day fitting, wall mount, inlet tap and leak test by a certified technician.'
    },
    {
      id: 'repair',
      name: 'Repair & Diagnostics',
      from: 399,
      icon: 'repair',
      desc: 'Pump, SMPS, valve or leak — diagnosed on the spot with genuine spares.'
    },
    {
      id: 'filter',
      name: 'Filter & Membrane Change',
      from: 899,
      icon: 'filter',
      desc: 'Genuine sediment, carbon, RO membrane and UV lamp replacement with a TDS report.'
    },
    {
      id: 'amc',
      name: 'Annual Maintenance (AMC)',
      from: 1999,
      icon: 'amc',
      desc: '4 preventive visits a year, unlimited breakdown support and 2 free filter changes.'
    }
  ],
  issueOptions: [
    'New installation',
    'Purifier not working',
    'Water tastes bad / smell',
    'Leakage',
    'Low water flow',
    'Filter or membrane change',
    'AMC enquiry',
    'Other'
  ],
  trust: {
    counters: [
      { label: 'Purifiers installed', value: 12400, suffix: '+' },
      { label: 'Happy families', value: 9800, suffix: '+' },
      { label: 'Service visits', value: 31500, suffix: '+' },
      { label: 'Avg. response time', value: 90, suffix: ' min' }
    ],
    testimonials: [
      {
        name: 'Ramesh K.',
        area: 'Jayanagar',
        text: 'Our borewell water was 1450 ppm. After the Aqua Shield, TDS reads 120 and the taste is clean. Installation was done in 40 minutes.'
      },
      {
        name: 'Sneha Rao',
        area: 'Whitefield',
        text: 'Called at 9 AM about a leak, technician arrived by 11:30. No drama, no upselling. This is how service should be.'
      },
      {
        name: 'Arjun M.',
        area: 'Hebbal',
        text: 'The AMC is genuinely worth it. Two filter changes and a membrane in one year, all covered. Zero worry is accurate.'
      },
      {
        name: 'Fatima S.',
        area: 'Frazer Town',
        text: 'Bought the RO+UV for my parents. They explained everything in Kannada and Hindi. Very patient team.'
      }
    ],
    badges: [
      { title: 'Genuine spares only', note: 'Every part is sourced from authorised distributors.' },
      { title: 'Certified technicians', note: 'Background-verified, uniformed, trained in-house.' },
      { title: '30-day service warranty', note: 'If it is not fixed, we return free of charge.' },
      { title: 'Transparent pricing', note: 'Quote before work. No hidden charges, ever.' }
    ]
  },
  faqs: [
    {
      q: 'Which purifier is right for my water?',
      a: 'Send us your TDS reading on WhatsApp, or book a free water test. Below 500 ppm a standard RO is plenty; above 1500 ppm we recommend the Elite with a TDS controller.'
    },
    {
      q: 'How long does installation take?',
      a: 'Usually 40–60 minutes. We carry the inlet tap, mounting screws and tubing, so there is nothing extra to buy.'
    },
    {
      q: 'Do you service purifiers bought elsewhere?',
      a: 'Yes. We service every major brand — Kent, Aquaguard, Pureit, Livpure and more — with genuine or OEM-equivalent spares.'
    },
    {
      q: 'What does the AMC actually cover?',
      a: 'Four preventive visits a year, unlimited breakdown calls, labour, and two filter changes. Membranes are billed at cost with a 15% AMC discount.'
    },
    {
      q: 'What are the payment options?',
      a: 'UPI, cards, net banking and cash. Purifiers can also be split into 3 no-cost EMI instalments.'
    },
    {
      q: 'How fast is a repair call?',
      a: 'We aim for a 90-minute response inside Bengaluru city limits, Monday to Saturday, 9 AM to 8 PM.'
    }
  ]
};

/** Prices with the Indian numbering system. */
export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/** WhatsApp deep link with a pre-filled message. */
export const waLink = (text = `Hi ${CONFIG.brand.name}, I would like to know more about your water purifiers.`) =>
  `https://wa.me/${CONFIG.contact.whatsapp}?text=${encodeURIComponent(text)}`;

export default CONFIG;
