import assert from "node:assert/strict";
import test from "node:test";
import { findVerifiedPreviewAdvance } from "./release-refresh.js";

function release(tag) {
  const names = [
    "SHA256SUMS",
    "release.json",
    "veasel-Linux.tar.gz",
    "veasel-macOS.tar.gz",
    "veasel-Windows.zip",
  ];
  return {
    tag_name: tag,
    prerelease: true,
    draft: false,
    immutable: true,
    assets: names.map((name) => ({
      name,
      digest: `sha256:${"a".repeat(64)}`,
    })),
  };
}

test("keeps the baseline when candidates are older or there is nothing newer", async () => {
  let verificationCalls = 0;
  const verify = async () => {
    verificationCalls += 1;
    throw new Error("should not verify an old release");
  };

  assert.equal(
    await findVerifiedPreviewAdvance(
      [release("v0.103.1-next.0")],
      "v0.103.2-next.0",
      verify,
    ),
    null,
  );
  assert.equal(
    await findVerifiedPreviewAdvance([], "v0.103.2-next.0", verify),
    null,
  );
  assert.equal(verificationCalls, 0);
});

test("advances to a verified newer candidate", async () => {
  const older = release("v0.103.3-next.0");
  const newest = release("v0.104.0-next.0");
  const selected = await findVerifiedPreviewAdvance(
    [older, newest],
    "v0.103.2-next.0",
    async (candidate) => ({ tag: candidate.tag_name }),
  );

  assert.deepEqual(selected, { tag: "v0.104.0-next.0" });
});

test("fails when every newer candidate fails verification", async () => {
  await assert.rejects(
    findVerifiedPreviewAdvance(
      [release("v0.103.3-next.0"), release("v0.104.0-next.0")],
      "v0.103.2-next.0",
      async (candidate) => {
        throw new Error(`invalid ${candidate.tag_name}`);
      },
    ),
    (error) =>
      error instanceof AggregateError &&
      error.errors.length === 2 &&
      /all 2 preview releases newer than v0\.103\.2-next\.0/.test(
        error.message,
      ),
  );
});
