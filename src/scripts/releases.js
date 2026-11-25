const previewTagPattern =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-next\.(0|[1-9]\d*)$/;
export const requiredPreviewAssets = [
  "SHA256SUMS",
  "release.json",
  "veasel-Linux.tar.gz",
  "veasel-macOS.tar.gz",
  "veasel-Windows.zip",
];
const distributableAssets = requiredPreviewAssets.slice(2);
const sha256Pattern = /^[a-f0-9]{64}$/;
const desktopPlatforms = {
  linux: {
    arch: "x86_64",
    names(version) {
      return [
        `veasel-desktop-${version}-linux-amd64.deb`,
        `veasel-desktop-${version}-linux-x86_64.AppImage`,
      ];
    },
  },
  macos: {
    arch: "arm64",
    names(version) {
      return [`veasel-desktop-${version}-mac-arm64.dmg`];
    },
  },
  windows: {
    arch: "x86_64",
    names(version) {
      return [`veasel-desktop-${version}-win-x64.exe`];
    },
  },
};

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

export function comparePreviewTags(leftTag, rightTag) {
  const left = previewVersion(leftTag);
  const right = previewVersion(rightTag);
  if (!left || !right) {
    throw new TypeError("preview tags must use the vX.Y.Z-next.N format");
  }
  return Math.sign(compareVersions(left, right));
}

export function newestPreviewRelease(releases) {
  return orderedPreviewReleases(releases)[0] ?? null;
}

export function verifiedPreviewRelease(
  release,
  { checksums, manifest, metadataDigests },
) {
  if (
    !release ||
    release.draft ||
    !release.prerelease ||
    release.immutable !== true
  ) {
    return null;
  }
  const tag = release.tag_name;
  const version = previewVersion(tag);
  if (!version || !manifest || !Array.isArray(manifest.assets)) return null;
  if (
    manifest.tag !== tag ||
    manifest.version !== tag.slice(1) ||
    manifest.channel !== "next" ||
    manifest.prerelease !== true ||
    typeof manifest.source_commit !== "string" ||
    !/^[a-f0-9]{40}$/i.test(manifest.source_commit)
  ) {
    return null;
  }

  const assets = releaseAssetMap(release);
  if (
    requiredPreviewAssets.some(
      (name) => sha256Digest(assets.get(name)?.digest) === null,
    )
  ) {
    return null;
  }

  const sums = parseChecksums(checksums);
  if (!sums) return null;
  const manifestAssets = new Map(
    manifest.assets
      .filter((asset) => asset && typeof asset.name === "string")
      .map((asset) => [asset.name, asset.sha256]),
  );

  for (const name of distributableAssets) {
    const githubDigest = sha256Digest(assets.get(name)?.digest);
    if (
      !githubDigest ||
      sums.get(name) !== githubDigest ||
      manifestAssets.get(name) !== githubDigest
    ) {
      return null;
    }
  }

  const desktop = {};
  const desktopNames = [];
  for (const [platform, expected] of Object.entries(desktopPlatforms)) {
    const installer = manifest.platforms?.[platform]?.desktop;
    if (!installer || installer.status !== "published") continue;
    if (
      installer.ci_result !== "success" ||
      installer.kind !== "desktop-installer" ||
      installer.arch !== expected.arch ||
      typeof installer.signed !== "boolean" ||
      !Array.isArray(installer.assets) ||
      installer.assets.length === 0
    ) {
      return null;
    }

    const allowedNames = new Set(expected.names(tag.slice(1)));
    const names = [...new Set(installer.assets)];
    if (
      names.length !== installer.assets.length ||
      names.some((name) => typeof name !== "string" || !allowedNames.has(name))
    ) {
      return null;
    }

    for (const name of names) {
      const githubDigest = sha256Digest(assets.get(name)?.digest);
      if (
        !githubDigest ||
        sums.get(name) !== githubDigest ||
        manifestAssets.get(name) !== githubDigest
      ) {
        return null;
      }
    }

    desktop[platform] = {
      arch: installer.arch,
      signed: installer.signed,
      assets: names,
    };
    desktopNames.push(...names);
  }

  for (const name of ["SHA256SUMS", "release.json"]) {
    if (metadataDigests?.[name] !== sha256Digest(assets.get(name)?.digest)) {
      return null;
    }
  }

  const releaseRoot = "https://github.com/veasel-labs/veasel/releases";
  return {
    immutable: true,
    tag,
    release_url: `${releaseRoot}/tag/${tag}`,
    source_commit: manifest.source_commit,
    desktop,
    assets: Object.fromEntries(
      [...requiredPreviewAssets, ...desktopNames].map((name) => [
        name,
        `${releaseRoot}/download/${tag}/${name}`,
      ]),
    ),
  };
}

export function orderedPreviewReleases(releases) {
  if (!Array.isArray(releases)) return [];
  return releases
    .filter((release) => {
      if (
        !release ||
        release.draft ||
        !release.prerelease ||
        release.immutable !== true
      ) {
        return false;
      }
      if (!previewVersion(release.tag_name)) return false;
      const assets = releaseAssetMap(release);
      return requiredPreviewAssets.every(
        (name) => sha256Digest(assets.get(name)?.digest) !== null,
      );
    })
    .sort((left, right) =>
      compareVersions(
        previewVersion(right.tag_name),
        previewVersion(left.tag_name),
      ),
    );
}

export function newerPreviewReleases(releases, baselineTag) {
  return orderedPreviewReleases(releases).filter(
    (release) => comparePreviewTags(release.tag_name, baselineTag) > 0,
  );
}

function releaseAssetMap(release) {
  if (!Array.isArray(release.assets)) return new Map();
  return new Map(
    release.assets
      .filter((asset) => asset && typeof asset.name === "string")
      .map((asset) => [asset.name, asset]),
  );
}

function sha256Digest(value) {
  if (typeof value !== "string") return null;
  const digest = value.startsWith("sha256:") ? value.slice(7) : value;
  return sha256Pattern.test(digest) ? digest : null;
}

function parseChecksums(checksums) {
  if (typeof checksums !== "string") return null;
  const entries = new Map();
  for (const line of checksums.trim().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})\s+\*?([^\s]+)$/.exec(line);
    if (!match || entries.has(match[2])) return null;
    entries.set(match[2], match[1]);
  }
  return entries;
}
