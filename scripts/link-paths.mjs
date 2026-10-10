import path from "node:path";
import { realpath } from "node:fs/promises";

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

export async function isRealPathInside(root, candidate) {
  try {
    const [resolvedRoot, resolvedCandidate] = await Promise.all([
      realpath(root),
      realpath(candidate),
    ]);
    return isInside(resolvedRoot, resolvedCandidate);
  } catch {
    return false;
  }
}

export function outputCandidates(output, base, pathname) {
  let route;
  try {
    route = decodeURIComponent(pathname);
  } catch {
    return [];
  }

  if (base !== "/") {
    if (route === base.slice(0, -1)) route = base;
    if (!route.startsWith(base)) return [];
    route = route.slice(base.length);
  } else {
    route = route.replace(/^\//, "");
  }

  // Backslashes are path separators on Windows and must not bypass checks.
  if (route.includes("\\") || route.includes("\0")) return [];

  const root = path.resolve(output);
  const relative = route.replace(/^\//, "");
  const target = path.resolve(root, ...relative.split("/"));
  const targets = relative.endsWith("/")
    ? [path.join(target, "index.html")]
    : [target, path.join(target, "index.html"), `${target}.html`];

  return targets.filter((candidate) => isInside(root, candidate));
}
