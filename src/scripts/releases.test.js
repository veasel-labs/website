import assert from "node:assert/strict";
import test from "node:test";
import { newestPreviewRelease, verifiedPreviewRelease } from "./releases.js";

const assetNames = [
  "SHA256SUMS",
  "release.json",
  "veasel-Linux.tar.gz",
  "veasel-macOS.tar.gz",
  "veasel-Windows.zip",
];

function release(tag, overrides = {}) {
  return {
    tag_name: tag,
    prerelease: true,
    draft: false,
    assets: assetNames.map((name) => ({
      name,
      digest: `sha256:${"a".repeat(64)}`,
    })),
    ...overrides,
  };
}

test("selects the highest complete preview by semantic version", () => {
  const older = release("v0.9.99-next.8");
  const newest = release("v1.0.0-next.0");

  assert.equal(newestPreviewRelease([newest, older]), newest);
});

test("ignores stable, draft, malformed, and incomplete releases", () => {
  const complete = release("v0.3.0-next.0");
  const stable = release("v9.0.0", { prerelease: false });
  const draft = release("v8.0.0-next.0", { draft: true });
  const malformed = release("v8.0.0-preview.0");
  const undigested = release("v6.0.0-next.0", {
    assets: assetNames.map((name) => ({ name })),
  });
  const incomplete = release("v7.0.0-next.0", {
    assets: [{ name: "veasel-Linux.tar.gz" }],
  });

  assert.equal(
    newestPreviewRelease([
      stable,
      draft,
      malformed,
      undigested,
      incomplete,
      complete,
    ]),
    complete,
  );
});

test("returns null when no complete preview exists", () => {
  assert.equal(newestPreviewRelease([]), null);
  assert.equal(newestPreviewRelease(undefined), null);
});

test("accepts fallback metadata only when GitHub, checksums, and manifest agree", () => {
  const candidate = release("v1.2.3-next.4");
  const verified = verifiedPreviewRelease(candidate, {
    checksums: [
      `${"a".repeat(64)}  veasel-Linux.tar.gz`,
      `${"a".repeat(64)}  veasel-macOS.tar.gz`,
      `${"a".repeat(64)}  veasel-Windows.zip`,
    ].join("\n"),
    manifest: {
      version: "1.2.3-next.4",
      tag: "v1.2.3-next.4",
      source_commit: "0123456789".repeat(4),
      channel: "next",
      prerelease: true,
      assets: [
        { name: "veasel-Linux.tar.gz", sha256: "a".repeat(64) },
        { name: "veasel-macOS.tar.gz", sha256: "a".repeat(64) },
        { name: "veasel-Windows.zip", sha256: "a".repeat(64) },
      ],
    },
    metadataDigests: {
      SHA256SUMS: "a".repeat(64),
      "release.json": "a".repeat(64),
    },
  });

  assert.equal(verified.tag, "v1.2.3-next.4");
  assert.equal(verified.source_commit, "0123456789".repeat(4));
  assert.equal(
    verified.assets["veasel-Linux.tar.gz"],
    "https://github.com/veasel-labs/veasel/releases/download/v1.2.3-next.4/veasel-Linux.tar.gz",
  );
});

test("rejects mismatched artifact, manifest, and metadata digests", () => {
  const candidate = release("v1.2.3-next.4");
  const verification = {
    checksums: `${"b".repeat(64)}  veasel-Linux.tar.gz\n${"a".repeat(64)}  veasel-macOS.tar.gz\n${"a".repeat(64)}  veasel-Windows.zip`,
    manifest: {
      version: "1.2.3-next.4",
      tag: "v1.2.3-next.4",
      channel: "next",
      prerelease: true,
      assets: [
        { name: "veasel-Linux.tar.gz", sha256: "a".repeat(64) },
        { name: "veasel-macOS.tar.gz", sha256: "a".repeat(64) },
        { name: "veasel-Windows.zip", sha256: "a".repeat(64) },
      ],
    },
    metadataDigests: {
      SHA256SUMS: "a".repeat(64),
      "release.json": "a".repeat(64),
    },
  };

  assert.equal(verifiedPreviewRelease(candidate, verification), null);
  verification.checksums = `${"a".repeat(64)}  veasel-Linux.tar.gz\n${"a".repeat(64)}  veasel-macOS.tar.gz\n${"a".repeat(64)}  veasel-Windows.zip`;
  verification.metadataDigests["release.json"] = "b".repeat(64);
  assert.equal(verifiedPreviewRelease(candidate, verification), null);
});
