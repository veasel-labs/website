# Contributing to veasel.dev

## Local development

Use Node 24 from `.node-version`, then run `npm ci`, `npm run dev`,
`npm run format:check`, `npm test`, `npm run check`, and `npm run build`.

To verify the production host variants, run `npm run build` once normally for
GitHub Pages and once with `VERCEL=1` for `www.veasel.dev`. Keep Astro routes
content-first and use `BASE_URL` for internal links and assets.

## Refresh the authentic demo recording

The `/demo/` terminal capture is generated from a verified Linux release
archive. Refresh the checked-in release fallback first, then download and
verify the exact archive before running the recorder. The script uses an
isolated temporary home and stops at the provider API-key prompt; do not pass
credentials to it.

```sh
node scripts/refresh-release-fallback.mjs
release_tag=$(node -p "require('./src/data/verified-release.json').tag")
archive_digest=$(gh release view "$release_tag" --repo veasel-labs/veasel --json assets --jq '.assets[] | select(.name == "veasel-Linux.tar.gz") | .digest | sub("^sha256:"; "")')
recording_tmp=$(mktemp -d)
gh release download "$release_tag" --repo veasel-labs/veasel --pattern veasel-Linux.tar.gz --dir "$recording_tmp"
printf '%s  %s\n' "$archive_digest" "$recording_tmp/veasel-Linux.tar.gz" | sha256sum --check
mkdir "$recording_tmp/bin"
tar -xzf "$recording_tmp/veasel-Linux.tar.gz" -C "$recording_tmp/bin"
uv run --with pexpect==4.9.0 python scripts/record-demo-cast.py --bin-dir "$recording_tmp/bin" --archive-sha256 "$archive_digest"
```

Review the regenerated cast and `public/demo/recording.meta.json`, then run
`npm test` and both production builds before opening the PR. Keep the historical
`.cast` assets unless there is a separate reason to remove them.

## Content and design

Describe only behavior present in the code or clearly label work in progress.
Keep the V-inspired original visual language, responsive layouts, keyboard
access, reduced-motion preferences, and System/Light/Dark theme support.
Include desktop and mobile screenshots when changing layout or styling.
