<div align="center">

# MERQATO.DIGITAL

### Your Digital Footprint in the Sand

**Digital Studio · Palawan, Philippines · Building for everywhere**

[![Website](https://img.shields.io/badge/website-merqato.digital-113A70?style=for-the-badge&logo=google-chrome&logoColor=white)](https://merqato.digital/)
[![Location](https://img.shields.io/badge/location-Palawan%2C%20PH-f7f8f8?style=for-the-badge&logo=mapbox&logoColor=101C31)](https://merqato.digital/)
[![Open to work](https://img.shields.io/badge/open%20to%20projects-101C31?style=for-the-badge&logo=githubactions&logoColor=white)](mailto:growpalawan@gmail.com)
[![Email](https://img.shields.io/badge/contact-growpalawan%40gmail.com-113A70?style=for-the-badge&logo=gmail&logoColor=white)](mailto:growpalawan@gmail.com)

</div>

---

## 👋 About the studio

**Merqato.Digital** is a small creative-technology studio rooted in Palawan.
We pair a strong visual point of view with practical engineering, building
thoughtful websites and digital systems for ambitious businesses —
local ones included, made to work anywhere.

> *Rooted in Palawan. Working everywhere.*

### What we do

| | Service | What it means |
|---|---|---|
| **01** | **Websites** | Distinct, responsive sites built around the way your business actually works |
| **02** | **Digital systems** | Simple tools that bring your content, customers, and daily work together |
| **03** | **Automation** | Useful workflows that save time and keep people in control |
| **04** | **Strategy → Design → Development** | One studio, end-to-end: positioning, interface design, and production-grade code |

---

## 🛠 Tech stack

The studio's flagship product — the **Merqato.Digital website & universal client template** — is full-stack TypeScript from edge to database.

<details open>
<summary><b>🎨 Frontend &amp; interface</b></summary>

![Next.js](https://img.shields.io/badge/Next.js-16.3.4-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.6-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-61_components-000000?style=flat-square&logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-1.6.7-161618?style=flat-square&logo=radixui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-icons-000000?style=flat-square&logo=lucide&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-charts-FF6B6B?style=flat-square&logo=recharts&logoColor=white)

</details>

<details open>
<summary><b>⚙️ Runtime, build &amp; edge</b></summary>

![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-Wrangler_4.92-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Vinext](https://img.shields.io/badge/vinext-RSC_on_Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-9-4B3263?style=flat-square&logo=eslint&logoColor=white)

</details>

<details open>
<summary><b>🗄 Data, storage &amp; backend</b></summary>

![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=flat-square&logo=neon&logoColor=black)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![Neon Object Storage](https://img.shields.io/badge/Neon_Object_Storage-S3_API-113A70?style=flat-square&logo=amazonwebservices&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-validation-3068B7?style=flat-square&logo=zod&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-forms-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-SQLite-3068B7?style=flat-square&logo=cloudflare&logoColor=white)

</details>

<details open>
<summary><b>🚀 Delivery</b></summary>

![Vercel](https://img.shields.io/badge/Vercel-ready-000000?style=flat-square&logo=vercel&logoColor=white)
![Cloudflare Sites](https://img.shields.io/badge/Cloudflare_Sites-ready-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-source_control-181717?style=flat-square&logo=github&logoColor=white)
![Neon Auth](https://img.shields.io/badge/Neon-Auth_-00E599?style=flat-square&logo=neon&logoColor=black)

</details>

**Stack at a glance**

```text
UI layer     Next.js 16 (App Router) · React 19 · TypeScript 5.9
             Tailwind CSS 4 · shadcn/ui + Radix + Base UI · lucide
Build layer  Vite 8 · Vinext (RSC on Vite) · @cloudflare/vite-plugin
Edge layer   Cloudflare Workers · Wrangler 4 · Sites runtime
             (Vercel-ready via process.env adaptation)
Data layer   Neon Postgres (serverless driver) · Drizzle ORM
             Neon Object Storage (S3 API, aws4fetch)
             optional Cloudflare D1 · Zod schemas
Auth layer   admin sessions + passkey gate · Sign in with ChatGPT (SIWC)
Quality      ESLint 9 · strict tsconfig · drizzle-kit migrations
```

---

## 📂 Code tree

Source of the **Merqato.Digital website & universal client template** —
the full-stack app behind [merqato.digital](https://merqato.digital/).

```text
merqato-digital/
├── app/                          # Next.js App Router
│   ├── admin/                    # private studio admin (CMS) UI
│   │   ├── page.tsx              # dashboard: site, media, portfolio
│   │   └── studio.css
│   ├── api/                      # route handlers
│   │   ├── admin/route.ts        # authenticated admin actions
│   │   ├── media/                # upload / list / delete media
│   │   │   └── [id]/route.ts
│   │   ├── portfolio/route.ts    # project CRUD
│   │   └── site/route.ts         # public site config
│   ├── chatgpt-auth.ts           # Sign in with ChatGPT helpers
│   ├── globals.css               # design tokens & layout system
│   ├── layout.tsx                # root layout, fonts, metadata
│   └── page.tsx                  # marketing site (hero, services…)
├── components/
│   └── ui/                       # 61 shadcn/ui components
│       ├── button.tsx · card.tsx · dialog.tsx · sidebar.tsx · …
│       └── tooltip.tsx
├── lib/                          # shared server/client modules
│   ├── default-site.ts           # default site config & types
│   ├── media-storage.ts          # Neon Object Storage (S3)
│   ├── neon-db.ts                # Neon Postgres client
│   ├── portfolio.ts              # portfolio data access
│   ├── server.ts                 # server-only utilities
│   └── utils.ts                  # cn() and small helpers
├── db/                           # drizzle schema (D1/SQLite option)
│   ├── index.ts
│   └── schema.ts
├── drizzle/                      # generated SQL migrations
├── neon-migrations/              # production Neon migrations
│   ├── 001_portfolio.sql
│   └── 002_site_backend.sql
├── hooks/
│   └── use-mobile.ts
├── public/
│   ├── assets/hero-palawan.png   # brand hero
│   └── favicon.svg
├── scripts/                      # install / build / preview tooling
│   ├── run-framework.mjs · sites-env.mjs · install-ci.mjs · …
├── build/
│   └── sites-vite-plugin.ts      # Sites Vite integration
├── examples/d1/                  # optional D1 reference surface
├── vendor/                       # vendored shadcn + tailwind assets
├── neon.ts · hello.ts            # Neon functions samples
├── .env.example                  # 5 secrets (DB + S3 ×4)
├── next.config.ts
├── vite.config.ts                # local binding simulation
├── drizzle.config.ts
├── components.json               # shadcn config
├── eslint.config.mjs
├── tsconfig.json
├── package.json
└── DEPLOYMENT.md                 # run / migrate / deploy guide
```

<details>
<summary>🔎 Full unabbreviated tree (129 files in source archive)</summary>

```text
merqato-digital/
├── app/
│   ├── admin/
│   │   ├── page.tsx
│   │   └── studio.css
│   ├── api/
│   │   ├── admin/route.ts
│   │   ├── media/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   ├── portfolio/route.ts
│   │   └── site/route.ts
│   ├── chatgpt-auth.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── build/
│   ├── sites-vite-plugin.LICENSE
│   └── sites-vite-plugin.ts
├── components/
│   └── ui/
│       ├── accordion.tsx ├── alert-dialog.tsx ├── alert.tsx
│       ├── aspect-ratio.tsx ├── attachment.tsx ├── avatar.tsx
│       ├── badge.tsx ├── breadcrumb.tsx ├── bubble.tsx
│       ├── button-group.tsx ├── button.tsx ├── calendar.tsx
│       ├── card.tsx ├── carousel.tsx ├── chart.tsx
│       ├── checkbox.tsx ├── collapsible.tsx ├── combobox.tsx
│       ├── command.tsx ├── context-menu.tsx ├── dialog.tsx
│       ├── direction.tsx ├── drawer.tsx ├── dropdown-menu.tsx
│       ├── empty.tsx ├── field.tsx ├── form.tsx
│       ├── hover-card.tsx ├── input-group.tsx ├── input-otp.tsx
│       ├── input.tsx ├── item.tsx ├── kbd.tsx
│       ├── label.tsx ├── marker.tsx ├── menubar.tsx
│       ├── message-scroller.tsx ├── message.tsx ├── native-select.tsx
│       ├── navigation-menu.tsx ├── pagination.tsx ├── popover.tsx
│       ├── progress.tsx ├── radio-group.tsx ├── resizable.tsx
│       ├── scroll-area.tsx ├── select.tsx ├── separator.tsx
│       ├── sheet.tsx ├── sidebar.tsx ├── skeleton.tsx
│       ├── slider.tsx ├── sonner.tsx ├── spinner.tsx
│       ├── switch.tsx ├── table.tsx ├── tabs.tsx
│       ├── textarea.tsx ├── toggle-group.tsx ├── toggle.tsx
│       └── tooltip.tsx
├── db/
│   ├── index.ts
│   └── schema.ts
├── drizzle/
│   ├── meta/
│   │   ├── 0000_snapshot.json
│   │   └── _journal.json
│   └── 0000_charming_nekra.sql
├── examples/
│   └── d1/
│       ├── app/api/notes/route.ts
│       └── db/schema.ts
├── hooks/
│   └── use-mobile.ts
├── lib/
│   ├── default-site.ts
│   ├── media-storage.ts
│   ├── neon-db.ts
│   ├── portfolio.ts
│   ├── server.ts
│   └── utils.ts
├── neon-migrations/
│   ├── 001_portfolio.sql
│   └── 002_site_backend.sql
├── public/
│   ├── assets/hero-palawan.png
│   ├── favicon.svg
│   ├── file.svg
│   ├── globe.svg
│   └── window.svg
├── scripts/
│   ├── build-verified.sh
│   ├── execution-profile.mjs
│   ├── install-ci.mjs
│   ├── install-ci.sh
│   ├── install-pnpm.sh
│   ├── pnpm-install.mjs
│   ├── run-framework.mjs
│   ├── sites-env.mjs
│   └── sites-env.sh
├── vendor/
│   ├── shadcn-tailwind-4.13.0.css
│   └── shadcn-tailwind-4.13.0.LICENSE.md
├── .env.example
├── .gitignore
├── .npmrc
├── cloudflare-env.d.ts
├── components.json
├── DEPLOYMENT.md
├── drizzle.config.ts
├── eslint.config.mjs
├── hello.ts
├── neon.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── vite.config.ts
```

</details>

---

## 🧭 How we work

1. **Start with your rhythm** — good digital work should feel like it belongs to you.
2. **Design with intent** — clear, useful, unmistakably yours.
3. **Engineer for the long run** — typed, tested, migratable, portable across Vercel & Cloudflare.
4. **Hand over the keys** — every client site ships with its own admin studio, media library, and portfolio CMS.

---

## 📬 Get in touch

<div align="center">

**Have something in mind? Tell us what you're building — we'll start with a conversation.**

[![Email](https://img.shields.io/badge/growpalawan%40gmail.com-113A70?style=for-the-badge&logo=gmail&logoColor=white)](mailto:growpalawan@gmail.com)
[![Website](https://img.shields.io/badge/merqato.digital-101C31?style=for-the-badge&logo=googlechrome&logoColor=white)](https://merqato.digital/)

*© Merqato.Digital — A small studio for ambitious ideas. Based in Palawan, building for everywhere.*

</div>
