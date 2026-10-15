import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const evalsPath = fileURLToPath(
  new URL("../pages/evals.astro", import.meta.url),
);
const atifPath = fileURLToPath(
  new URL(
    "../../public/data/evals/atif-smoke-0.39.0-next.0.json",
    import.meta.url,
  ),
);
const metaPath = fileURLToPath(
  new URL(
    "../../public/data/evals/atif-smoke-0.39.0-next.0.meta.json",
    import.meta.url,
  ),
);

test("evals page refuses invented scores and links public ATIF sample", async () => {
  const source = await readFile(evalsPath, "utf8");
  assert.match(source, /Public ATIF smoke sample/i);
  assert.match(source, /Harbor Index:\s*Not submitted/i);
  assert.match(source, /not<\/strong> in Harbor/i);
  assert.match(source, /Not authenticated/i);
  assert.match(source, /atif-smoke-0\.39\.0-next\.0\.json/);
  assert.match(source, /validate-harbor-atif\.py/);
  assert.match(source, /dc933be707feafbb9efcdf092cb8a0e391332617/);
  assert.match(source, /VEASEL_VERSION=0\.39\.0-next\.0/);
  assert.doesNotMatch(
    source,
    /leaderboard score|99%|solved all tasks|Index rank/i,
  );
});

test("public ATIF smoke sample is real ATIF-v1.8 with matching provenance", async () => {
  const raw = await readFile(atifPath);
  const traj = JSON.parse(raw.toString("utf8"));
  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  assert.equal(traj.schema_version, "ATIF-v1.8");
  assert.equal(traj.agent.name, "Veasel Code");
  assert.equal(traj.agent.version, "0.39.0-next.0");
  assert.equal(traj.agent.model_name, "smoke-model");
  assert.deepEqual(
    traj.steps.map((step) => step.source),
    ["system", "user", "agent", "agent"],
  );
  assert.equal(traj.steps[1].message, "Inspect workspace");
  assert.equal(traj.steps[2].tool_calls[0].function_name, "workspace_search");
  assert.match(
    traj.steps[2].observation.results[0].content,
    /workspace-search-sentinel/,
  );
  assert.equal(traj.steps[3].message, "Found workspace-search-sentinel");
  assert.equal(traj.extra.cost, "unavailable");
  assert.equal(traj.extra.redaction, "credentials");
  assert.doesNotMatch(
    raw.toString("utf8"),
    /veasel-openai-key|\/tmp\/veasel-atif-gen/,
  );
  assert.match(meta.disclaimer, /not a Harbor Index trial/i);
  assert.equal(meta.veasel_version, "0.39.0-next.0");
  assert.equal(meta.sha256, createHash("sha256").update(raw).digest("hex"));
});
