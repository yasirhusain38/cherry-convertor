<<<<<<< HEAD
# Cherry Converter

Free, privacy-first image tools. Compress, resize, convert, and prepare Indian document photos **entirely in the browser**.

## Why Next.js (not a folder of HTML files)

| | Static HTML | Next.js App Router |
|---|---|---|
| Unique titles / OG / FAQ JSON-LD for 31 pages | Manual duplication | `generateMetadata` + tool registry |
| Core Web Vitals | Fast if you are careful | Fast with the App Router + no client JS on marketing pages |
| Hosting cost | Any CDN | Same — deploy to Vercel, Cloudflare, or Netlify |
| Image work | Your own JS | Same Canvas / WASM engine, shared once |

This repo is **Next.js 16 + TypeScript + Tailwind v4**. All heavy lifting is client-side (Canvas, `heic2any`, `jsPDF`, `JSZip`). There is no image-upload API.

## Folder structure

```
src/
  app/                     # Routes, SEO, sitemap, robots, OG
    page.tsx               # Homepage
    tools/page.tsx         # All tools
    tools/[slug]/page.tsx  # 31 dedicated tool landing pages
    about | privacy | contact | blog
  components/              # Chrome + tool workspaces
  lib/
    tools.ts               # SEO copy, FAQs, related links
    image.ts               # Canvas engine (compress / target KB / crop / DPI)
    presets.ts             # Passport, Aadhaar, PAN, visa, exam sizes
    pdf.ts                 # JPG / image → PDF + photo sheets
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_SITE_URL` in production so canonical URLs and the sitemap use your domain.

## Brand

Four-color system only:

- `#F2013F` Cherry Tomato (colorguide.org) — primary / buttons / logo
- `#B81D24` hover / pressed / secondary red
- `#221F1F` canvas, header, hero, cards
- `#F5F5F1` type, paper, light controls

## Licence

Private project. Use and deploy as you wish for Cherry Converter.
=======
# cherry-converter
Free online image tools – Image Compressor, Resizer, Passport Photo Maker, JPG to PDF and more. Client-side processing.
>>>>>>> afbff83479199c418ecad4e2446d9296a0bed0e2
