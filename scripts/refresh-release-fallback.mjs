import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  orderedPreviewReleases,
  verifiedPreviewRelease,
} from "../src/scripts/releases.js";

const releasesApi =
  "https://api.github.com/repos/veasel-labs/veasel/releases?per_page=100";
const releaseRoot = "https://github.com/veasel-labs/veasel/releases/download";
const destination = fileURLToPath(
  new URL("../src/data/verified-release.json", import.meta.url),
);
const maxMetadataBytes = 1_000_000;

async function fetchBytes(url, limit = maxMetadataBytes) {
  // Authenticate GitHub API calls when a token is available: unauthenticated
  // requests from shared CI runner IPs hit the 60/h rate limit (HTTP 403),
  // which silently kept the stale fallback in the refresh workflow.
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const response = await fetch(url, {
    headers: url.startsWith("https://api.github.com/")
      ? {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        }
      : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`upstream returned HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("upstream response has no body");
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("upstream metadata exceeds size limit");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assetUrl(tag, name) {
  return `${releaseRoot}/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

async function verifiedDataForRelease(release) {
  const [checksumsBytes, manifestBytes] = await Promise.all([
    fetchBytes(assetUrl(release.tag_name, "SHA256SUMS")),
    fetchBytes(assetUrl(release.tag_name, "release.json")),
  ]);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw new Error("release.json is not valid JSON");
  }

  const result = verifiedPreviewRelease(release, {
    checksums: checksumsBytes.toString("utf8"),
    manifest,
    metadataDigests: {
      SHA256SUMS: sha256(checksumsBytes),
      "release.json": sha256(manifestBytes),
    },
  });
  if (!result)
    throw new Error(
      "release checksums or manifest do not match GitHub asset digests",
    );
  return result;
}

async function main() {
  try {
    const releasesBytes = await fetchBytes(releasesApi, 5_000_000);
    const releases = JSON.parse(releasesBytes.toString("utf8"));
    for (const release of orderedPreviewReleases(releases).slice(0, 5)) {
      try {
        const verified = await verifiedDataForRelease(release);
        const temporary = `${destination}.tmp`;
        const formatted = await format(`${JSON.stringify(verified)}\n`, {
          parser: "json",
        });
        await writeFile(temporary, formatted, {
          encoding: "utf8",
          mode: 0o644,
        });
        await rename(temporary, destination);
        console.log(`Refreshed verified download fallback to ${verified.tag}.`);
        return;
      } catch (error) {
        console.warn(
          `Skipped ${release.tag_name}: ${error instanceof Error ? error.message : "verification failed"}.`,
        );
      }
    }
    throw new Error(
      "no complete preview release passed integrity verification",
    );
  } catch (error) {
    await readFile(destination, "utf8");
    console.warn(
      `Could not refresh the verified download fallback (${error instanceof Error ? error.message : "refresh failed"}); keeping the checked-in release metadata.`,
    );
  }
}

await main();
