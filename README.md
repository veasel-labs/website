# Veasel Code website

The official static website and field guide for Veasel Code.

The architecture follows the inspected `HorneroOS/website` implementation:
Astro static output, filesystem routes, a shared layout, pinned Node with an
npm lockfile, and build/check workflows. The visual identity and all copy are
original. Pages are content-first and ship no client-side JavaScript.

## Develop

Requires Node 24 (see `.node-version`).

```sh
npm ci
npm run dev
npm run check
npm run build
```

The project base path is `/website`, targeting GitHub Pages at
`https://veasel-labs.github.io/website/`. Update `astro.config.mjs` if the
repository is moved to a custom domain or another hosting base.

## Content boundary

The site describes the current product honestly. The model runtime, repository
editing, shell tools, and durable agent jobs remain in development and are not
presented as shipped features.
