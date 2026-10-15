import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const evalsPath = fileURLToPath(
  new URL("../pages/evals.astro", import.meta.url),
);

test("evals page refuses invented scores and states ATIF is unpublished", async () => {
  const source = await readFile(evalsPath, "utf8");
  assert.match(source, /No public ATIF sample artifact yet/i);
  assert.match(source, /Not submitted/i);
  assert.match(source, /validate-harbor-atif\.py/);
  assert.match(source, /dc933be707feafbb9efcdf092cb8a0e391332617/);
  assert.doesNotMatch(
    source,
    /leaderboard score|99%|solved all tasks|Index rank/i,
  );
});
