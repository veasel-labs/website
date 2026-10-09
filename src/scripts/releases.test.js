import assert from "node:assert/strict";
import test from "node:test";
import { newestPreviewRelease } from "./releases.js";

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
    assets: assetNames.map((name) => ({ name })),
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
  const incomplete = release("v7.0.0-next.0", {
    assets: [{ name: "veasel-Linux.tar.gz" }],
  });

  assert.equal(
    newestPreviewRelease([stable, draft, malformed, incomplete, complete]),
    complete,
  );
});

test("returns null when no complete preview exists", () => {
  assert.equal(newestPreviewRelease([]), null);
  assert.equal(newestPreviewRelease(undefined), null);
});
