import { newerPreviewReleases } from "./releases.js";

export async function findVerifiedPreviewAdvance(
  releases,
  baselineTag,
  verifyRelease,
  onRejected = () => {},
) {
  const candidates = newerPreviewReleases(releases, baselineTag);
  if (candidates.length === 0) return null;

  const errors = [];
  for (const candidate of candidates) {
    try {
      const verified = await verifyRelease(candidate);
      if (!verified || verified.tag !== candidate.tag_name) {
        throw new Error("verification returned no matching release snapshot");
      }
      return verified;
    } catch (error) {
      errors.push(error);
      onRejected(candidate, error);
    }
  }

  throw new AggregateError(
    errors,
    `failed to verify all ${candidates.length} preview releases newer than ${baselineTag}`,
  );
}
