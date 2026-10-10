import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isRealPathInside, outputCandidates } from "./link-paths.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const isVercel = process.env.VERCEL === "1";
const base = isVercel ? "/" : "/website/";
const localHost = isVercel ? "www.veasel.dev" : "veasel-labs.github.io";

async function listHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listHtml(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
}

async function localFile(pathname) {
  const candidates = outputCandidates(output, base, pathname);
  for (const candidate of candidates) {
    try {
      if (
        (await stat(candidate)).isFile() &&
        (await isRealPathInside(output, candidate))
      ) {
        return candidate;
      }
    } catch {
      // Try the next output form: extension, extensionless route, or index.
    }
  }
  return null;
}

const pages = await listHtml(output);
const pageContents = new Map(
  await Promise.all(
    pages.map(async (file) => [file, await readFile(file, "utf8")]),
  ),
);
const failures = [];

for (const [file, html] of pageContents) {
  const relative = path.relative(output, file);
  const route =
    relative === "index.html"
      ? base
      : `${base}${relative.replace(/\/index\.html$/, "/")}`;
  const current = new URL(route, `https://${localHost}`);
  const attributes = /\b(href|src)\s*=\s*["']([^"']*)["']/gi;

  for (const match of html.matchAll(attributes)) {
    const [, attribute, value] = match;
    if (
      !value ||
      value.startsWith("#") ||
      /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)
    ) {
      let target;
      try {
        target = new URL(value, current);
      } catch {
        continue;
      }
      if (target.hostname !== localHost) continue;
    }

    let target;
    try {
      target = new URL(value, current);
    } catch {
      failures.push(
        `${relative}: invalid ${attribute} ${JSON.stringify(value)}`,
      );
      continue;
    }
    if (target.hostname !== localHost) continue;

    const targetFile = await localFile(target.pathname);
    if (!targetFile) {
      failures.push(
        `${relative}: broken ${attribute} ${JSON.stringify(value)}`,
      );
      continue;
    }

    if (target.hash && targetFile.endsWith(".html")) {
      const targetHtml =
        pageContents.get(targetFile) ?? (await readFile(targetFile, "utf8"));
      const id = decodeURIComponent(target.hash.slice(1));
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\s(?:id|name)=["']${escapedId}["']`).test(targetHtml)) {
        failures.push(`${relative}: missing anchor ${JSON.stringify(value)}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Found ${failures.length} broken internal link(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${pages.length} pages; all internal links and assets resolve.`,
  );
}
