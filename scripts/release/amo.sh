#!/usr/bin/env bash
# Submits a released version to AMO's listed channel (Sett, 2026-11-27: updates delivered by CI/CD):
#   the very zip of the GitHub release, unpacked and signed by `web-ext sign --channel listed`,
#   with the release's source archive (Q12) and its notes; Mozilla's review is not waited for.
# Does nothing while AMO_JWT_ISSUER and AMO_JWT_SECRET are unset (secrets of the "releasing" environment): versions are then uploaded
# by hand, and a version number exists only once on AMO, so it is one or the other.
# Needs GH_TOKEN. Usage: amo.sh v<version>
set -euo pipefail
cd "$(dirname "$0")/../.."
tag="${1:?usage: amo.sh v<version>}"
version="${tag#v}"
if [ -z "${AMO_JWT_ISSUER:-}" ] || [ -z "${AMO_JWT_SECRET:-}" ]; then
  echo "not submitted to AMO: AMO_JWT_ISSUER / AMO_JWT_SECRET are not set (the "releasing" environment); upload $tag by hand"
  exit 0
fi

work="dist/amo"
rm -rf "$work" && mkdir -p "$work/extension"
gh release download "$tag" --dir "$work" \
  -p "save-my-chat-$version.zip" -p "save-my-chat-$version-source.zip"
unzip -q "$work/save-my-chat-$version.zip" -d "$work/extension"

# the version's notes for AMO: the release's, and how its source builds for the reviewers
GH_NOTES="$(gh release view "$tag" --json body -q .body)" VERSION="$version" node -e '
  // GitHub writes Markdown, AMO shows plain text: no headings, no bold, a dash per change
  const notes = process.env.GH_NOTES.replace(/\r/g, "")
    .split("\n").filter((l) => !l.startsWith("#")).join("\n")
    .replace(/\*\*/g, "").replace(/^\* /gm, "- ").replace(/\n{3,}/g, "\n\n").trim();
  const url = `https://github.com/radiokociamuzyka/save-my-chat/releases/tag/v${process.env.VERSION}`;
  process.stdout.write(JSON.stringify({ version: {
    release_notes: { "en-US": `${notes}\n\n${url}` },
    approval_notes: "Source: the attached archive (git archive of the tag). The pages (popup, options) are built by Vite from .vue files, not minified; the rest of src/ is copied as it is. Build: npm ci && npm run build, the extension in dist/extension/ (README, \"Building from source\").",
  } }, null, "\t"));
' > "$work/metadata.json"

npx web-ext sign --no-config-discovery --channel listed \
  --source-dir "$work/extension" --artifacts-dir "$work/signed" \
  --upload-source-code "$work/save-my-chat-$version-source.zip" \
  --amo-metadata "$work/metadata.json" \
  --approval-timeout 0 \
  --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET"
echo "$tag submitted to AMO's listed channel; Mozilla's review follows"
