import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const roadmapPath = fileURLToPath(
  new URL("../pages/docs/roadmap.astro", import.meta.url),
);

test("roadmap symbols are decorative beside visible status labels", async () => {
  const roadmap = await readFile(roadmapPath, "utf8");
  const cards = [
    ...roadmap.matchAll(/<article class="roadmap-item[\s\S]*?<\/article>/g),
  ];

  assert.ok(cards.length > 0);
  for (const [card] of cards) {
    assert.match(card, /class="roadmap-status"/);
    assert.match(card, /class="roadmap-symbol" aria-hidden="true"/);
    assert.doesNotMatch(card, /class="roadmap-symbol"[^>]*aria-label=/);
  }
});
