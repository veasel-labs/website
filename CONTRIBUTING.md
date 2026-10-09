# Contributing to veasel.dev

## Local development

Use Node 24 from `.node-version`, then run `npm ci`, `npm run dev`,
`npm run format:check`, `npm run check`, and `npm run build`.

To verify the production host variants, run `npm run build` once normally for
GitHub Pages and once with `VERCEL=1` for `www.veasel.dev`. Keep Astro routes
content-first and use `BASE_URL` for internal links and assets.

## Content and design

Describe only behavior present in the code or clearly label work in progress.
Keep the V-inspired original visual language, responsive layouts, keyboard
access, reduced-motion preferences, and System/Light/Dark theme support.
Include desktop and mobile screenshots when changing layout or styling.
