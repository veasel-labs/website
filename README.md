# Veasel Code website

The official static website and field guide for Veasel Code.

The architecture follows the inspected `HorneroOS/website` implementation:
Astro static output, filesystem routes, a shared layout, pinned Node with an
npm lockfile, and build/check workflows. The visual identity and all copy are
original. Pages are content-first; the only browser code is a small inline
color-theme switcher (System, Light, Dark) that remembers the preference
without adding a UI framework.

## Develop

Requires Node 24 (see `.node-version`).

```sh
npm ci
npm run dev
npm run check
npm run build
```

Production is served at [`https://www.veasel.dev/`](https://www.veasel.dev/)
through the existing Vercel domain. A separate build also publishes to GitHub
Pages at `https://veasel-labs.github.io/website/`; `astro.config.mjs` selects
the canonical URL and base path for each host so assets and links work in both
deployments.

## Content boundary

The site describes the current product honestly. Synchronous chat through
OpenAI-compatible, Anthropic, and Gemini APIs is available in the source build,
with session history stored locally. Streaming, repository editing, shell
tools, and durable agent jobs remain in development.

## Community

See the [contribution guide](CONTRIBUTING.md), [security policy](SECURITY.md),
and [support guide](SUPPORT.md). Shared community standards are maintained in
[veasel-labs/.github](https://github.com/veasel-labs/.github).
