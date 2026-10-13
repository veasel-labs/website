# Veasel Code website

[![CI](https://github.com/veasel-labs/website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/veasel-labs/website/actions/workflows/ci.yml)
[![Deploy](https://github.com/veasel-labs/website/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/veasel-labs/website/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/badge/website-veasel.dev-3b6b54)](https://www.veasel.dev/)

The official static website and field guide for Veasel Code.

The architecture follows the inspected `HorneroOS/website` implementation:
Astro static output, filesystem routes, a shared layout, pinned Node with an
npm lockfile, and build/check workflows. The visual identity and all copy are
original. Pages are content-first; the only browser code is a small inline
color-theme switcher (System, Light, Dark) that remembers the preference
without adding a UI framework.
The downloads page uses a checked-in, integrity-verified preview-release
fallback. Site builds refresh it only after the release manifest and
`SHA256SUMS` match GitHub's SHA-256 asset digests. A scheduled release sync
checks for newer previews each hour, opens a focused website PR when the
verified release changes, runs the full website CI on that branch, and merges
only after required checks pass. The merge triggers the normal Vercel
production deployment. If GitHub is unavailable, the build keeps the previous
verified fallback and the next scheduled sync retries.

## Develop

Requires Node 24 (see `.node-version`).

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
```

Production is served at [`https://www.veasel.dev/`](https://www.veasel.dev/)
through the existing Vercel domain. A separate build also publishes to GitHub
Pages at `https://veasel-labs.github.io/website/`; `astro.config.mjs` selects
the canonical URL and base path for each host so assets and links work in both
deployments.

## Content boundary

The site describes the current product honestly. Streaming chat through
OpenAI Chat Completions and Responses, Meta Model API, Anthropic, Gemini, and
OpenAI-compatible endpoints are available in the current build, with session
history stored in a local SQLite database. These are four protocol families;
endpoint presets do not imply independent native SDK integrations. The agent
can inspect a selected workspace and propose bounded, single-file edits. In the
TUI, a user opens the saved diff and explicitly approves it before it is
applied. Provider responses stream through replayable session events. The local
API has no application token, so same-user processes can also access its review
and approval routes.
Shell commands require review of the exact command, working directory, and
timeout before approval; they run with the server user's permissions and no OS
sandbox. Every model-requested MCP call pauses for exact-argument review and
one-time approval; MCP stdio servers also run with the server user's
permissions and no OS sandbox. Session messages support opt-in asynchronous
responses through `Prefer: respond-async`. Their status is persisted and can
be queried after reconnect; work interrupted by a restart is marked uncertain
and never replayed. Durable queued workers and operation history management
remain in development.

## Community

See the [contribution guide](CONTRIBUTING.md), [security policy](SECURITY.md),
and [support guide](SUPPORT.md). Shared community standards are maintained in
[veasel-labs/.github](https://github.com/veasel-labs/.github).
