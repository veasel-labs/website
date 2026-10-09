const previewTagPattern =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-next\.(0|[1-9]\d*)$/;
const requiredPreviewAssets = new Set([
  "SHA256SUMS",
  "release.json",
  "veasel-Linux.tar.gz",
  "veasel-macOS.tar.gz",
  "veasel-Windows.zip",
]);

function previewVersion(tag) {
  const match = previewTagPattern.exec(tag);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function newestPreviewRelease(releases) {
  if (!Array.isArray(releases)) return null;

  return (
    releases
      .filter((release) => {
        if (!release || release.draft || !release.prerelease) return false;
        if (!previewVersion(release.tag_name)) return false;
        const assets = new Set(
          Array.isArray(release.assets)
            ? release.assets.map((asset) => asset?.name)
            : [],
        );
        return [...requiredPreviewAssets].every((name) => assets.has(name));
      })
      .sort((left, right) =>
        compareVersions(
          previewVersion(right.tag_name),
          previewVersion(left.tag_name),
        ),
      )[0] ?? null
  );
}
