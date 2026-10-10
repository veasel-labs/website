import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import {
  isRealPathInside,
  outputCandidates,
} from "../../scripts/link-paths.mjs";

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "veasel-links-"));
const output = path.join(temporaryRoot, "dist");
await mkdir(path.join(output, "docs"), { recursive: true });
await writeFile(path.join(output, "docs", "index.html"), "ok");
const outsideFile = path.join(temporaryRoot, "README.md");
await writeFile(outsideFile, "outside dist");
await symlink(outsideFile, path.join(output, "leaked.md"));
after(async () => rm(temporaryRoot, { recursive: true, force: true }));

describe("outputCandidates", () => {
  it("resolves routes under the configured deployment base", () => {
    assert.deepEqual(outputCandidates(output, "/website/", "/website/docs/"), [
      path.join(output, "docs", "index.html"),
    ]);
  });

  it("rejects plain and encoded traversal outside the output directory", () => {
    assert.deepEqual(
      outputCandidates(output, "/website/", "/website/../README.md"),
      [],
    );
    assert.deepEqual(
      outputCandidates(output, "/website/", "/website/%2e%2e/README.md"),
      [],
    );
  });

  it("rejects a dist symlink that resolves outside the output directory", async () => {
    const [candidate] = outputCandidates(
      output,
      "/website/",
      "/website/leaked.md",
    );
    assert.equal(await isRealPathInside(output, candidate), false);
  });

  it("rejects paths that do not use the configured base", () => {
    assert.deepEqual(outputCandidates(output, "/website/", "/docs/"), []);
  });
});
