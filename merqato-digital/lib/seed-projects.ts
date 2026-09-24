import type { PortfolioProject } from './portfolio';

/**
 * Starter projects that can be imported from the admin with one click. Images
 * point at files committed under /public so they render with no upload needed;
 * they can be swapped for uploaded media afterwards.
 */
export const starterProjects: PortfolioProject[] = [
  {
    id: '7d3f2a10-8c41-4f6e-9a2b-1e5c7d9f0b33',
    title: 'GUNI GUNI — The Digital Footprint',
    slug: 'guni-guni-digital-footprint',
    client: 'GUNI GUNI Hostel & Bistro',
    year: '2026',
    category: 'Hospitality platform · Web, ordering & back-office',
    status: 'current',
    summary:
      'A complete digital footprint for a much-loved Puerto Princesa bistro and hostel: editorial website, order-from-your-table flow, staff dashboard, back-office CMS, private costing and an AI host — delivered as a running repository instead of a slide deck.',
    body: [
      'GUNI GUNI already had the hardest thing to buy: a name people repeat. 8.8/10 across hundreds of Booking.com reviews, "Very good" on Tripadvisor, and guests who call the restaurant the biggest surprise of their trip. But that reputation lived on platforms someone else owns — the menu was a photo on social media, orders travelled by memory and paper, and margins were invisible until the end of the month.',
      'We proposed one integrated platform in three layers. A guest experience: an editorial website with the full 75-dish menu across pasta, pizza, burgers, starters and the bar, plus an order-from-your-table flow with a live order-status page. An operations layer: a protected staff dashboard moving tickets from accept to prepare to ready to complete, with the 86-list and availability toggles. And a back-office CMS where the owner controls theme, fonts, pages, the menu editor, the media library, private recipe costing with margin analytics, and a one-click publish.',
      'On top of it sits an AI virtual host guests can chat with, and an AI operations assistant for staff — briefings and low-stock calls grounded in the venue\u2019s own menu and numbers.',
      'The proposal itself is the product. Rather than a PDF, we shipped a running repository the client can read, run and evolve: React 19, TypeScript, Vite, Tailwind 4, Supabase-ready Postgres with row-level security, Deno edge functions, and a zero-dependency Node fallback so the whole thing can run on the bistro\u2019s own PC with no monthly bill.',
    ].join('\n\n'),
    projectUrl: 'https://github.com/merqatodigital/guniguni',
    links: [
      { label: 'GitHub repository', url: 'https://github.com/merqatodigital/guniguni' },
      { label: 'Full proposal', url: 'https://github.com/merqatodigital/guniguni/blob/main/docs/PROPOSAL.md' },
      { label: 'Why GitHub is the proposal', url: 'https://github.com/merqatodigital/guniguni/blob/main/docs/GITHUB-AS-PROPOSAL.md' },
      { label: 'Technical reference', url: 'https://github.com/merqatodigital/guniguni/blob/main/docs/DEVELOPMENT.md' },
    ],
    coverMediaId: '/portfolio/guni-guni/cover.png',
    galleryMediaIds: ['/portfolio/guni-guni/cover.png', '/portfolio/guni-guni/island-studio.png'],
    published: true,
    sortOrder: 0,
  },
];
