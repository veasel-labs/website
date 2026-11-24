# Veasel Code website

[![CI](https://github.com/veasel-labs/website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/veasel-labs/website/actions/workflows/ci.yml)
[![Deploy](https://github.com/veasel-labs/website/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/veasel-labs/website/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/badge/website-veasel.dev-3b6b54)](https://www.veasel.dev/)

The official static website and field guide for Veasel Code.

The architecture follows the inspected `HorneroOS/website` implementation:
Astro static output, filesystem routes, a shared layout, pinned Node with an
npm lockfile, and build/check workflows. The site's visual identity and copy
are original. Pages are content-first; browser-side enhancement is limited to
the remembered System/Light/Dark theme switcher and `/demo`'s guided stepper
with an Asciinema player, without adding a UI framework. The walkthrough is
clearly labeled as a script for a verified release, not a live model session;
the adjacent terminal recording is genuine Veasel CLI/TUI output.
The pixel companion is a new, independently generated Veasel design. It does
not use or adapt the V language project's official mascot artwork and is
included under this site's MIT license.
The downloads page uses a checked-in, integrity-verified preview-release
fallback. Site builds refresh it only after the release manifest and
`SHA256SUMS` match GitHub's SHA-256 asset digests. A scheduled release sync
checks for newer previews each hour, opens a focused draft website PR when the
verified release changes, and runs the full website CI on that branch. A human
reviews and merges the PR after checks pass; the merge triggers the normal
Vercel production deployment. If GitHub is unavailable, the build keeps the
previous verified fallback and the next scheduled sync retries.

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
applied. Provider responses stream through replayable session events.

The Veasel backend requires a bearer token on every API route except the
unauthenticated health capability probe. Host and Origin checks also remain in
force. The token is stored with restrictive permissions in Veasel's data
directory; same-user processes are within the local trust boundary. See the
[backend authentication contract](https://github.com/veasel-labs/veasel/blob/main/docs/security/backend-caller-auth.md)
for token lifecycle and compatibility behavior.

Shell commands require review of the exact command, working directory, and
timeout before approval. Approved shell defaults to fail-closed OS sandboxing
with Bubblewrap (Linux), Seatbelt (macOS), or AppContainer+Job (Windows), and
missing backends refuse execution. `VEASEL_SHELL_SANDBOX` defaults to `require`;
`auto` and `off` do not universally permit an unsandboxed fallback. On macOS and
Windows, unsandboxed execution additionally requires the explicit
`VEASEL_SHELL_ALLOW_UNSANDBOXED` opt-in. MCP calls also require review and
one-time approval. Trusted MCP stdio defaults to fail-closed sandboxing via
`VEASEL_MCP_STDIO_SANDBOX=require`; fallback behavior is platform-dependent and
documented in the [Veasel sandbox compatibility notes](https://github.com/veasel-labs/veasel/tree/main/docs/compatibility).

Session messages support opt-in asynchronous responses through
`Prefer: respond-async`. Their status is persisted and can be queried after
reconnect; queued async turns resume after restart (bounded per session).
Mid-flight work interrupted by a restart is marked uncertain and never
replayed. Operation history management and retention policy remain ahead.

## Community

See the [contribution guide](CONTRIBUTING.md), [security policy](SECURITY.md),
and [support guide](SUPPORT.md). Shared community standards are maintained in
[veasel-labs/.github](https://github.com/veasel-labs/.github).
