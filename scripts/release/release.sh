#!/usr/bin/env bash
# Releases the version of package.json from master (Q7), unless its tag exists already:
#   1. a version released already that reaches master again gets its patch bumped (a hotfix commit)
#   2. the packed extension built: dist/save-my-chat-<version>.zip, and dist/save-my-chat.zip
#      for the fixed address of the latest:
#      https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip
#   3. signed by AMO for self-distribution (unlisted, Q3) when AMO_JWT_ISSUER and AMO_JWT_SECRET are set
#   4. the annotated tag v<version> and the GitHub release, marked the latest, notes from the pull requests
# Writes tag=v<version> to $GITHUB_OUTPUT. Needs GH_TOKEN. Usage: release.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
export HUSKY=0
version() { node scripts/version.mjs show; }
output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT" || true; }
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git fetch -q --tags origin
if git rev-parse -q --verify "refs/tags/v$(version)" > /dev/null; then
  from=$(version)
  node scripts/version.mjs bump patch
  git commit -qam "chore(release): v$from -> v$(version) (a hotfix on master)"
  git push -q origin HEAD:master
  echo "v$from was released already: master is now v$(version)"
fi
tag="v$(version)"

npx web-ext build --filename "save-my-chat-$(version).zip"
cp "dist/save-my-chat-$(version).zip" dist/save-my-chat.zip
assets=("dist/save-my-chat-$(version).zip" dist/save-my-chat.zip)

if [ -n "${AMO_JWT_ISSUER:-}" ] && [ -n "${AMO_JWT_SECRET:-}" ]; then
  npx web-ext sign --channel unlisted --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET" \
    --artifacts-dir dist/signed
  for xpi in dist/signed/*.xpi; do
    cp "$xpi" "dist/save-my-chat-$(version).xpi"
    cp "$xpi" dist/save-my-chat.xpi
  done
  assets+=("dist/save-my-chat-$(version).xpi" dist/save-my-chat.xpi)
else
  echo "not signed: AMO_JWT_ISSUER / AMO_JWT_SECRET are not set (the zip loads as a temporary add-on)"
fi

git tag -a "$tag" -m "$tag"
git push -q origin "$tag"
gh release create "$tag" --title "save-my-chat $tag" --generate-notes --latest --verify-tag "${assets[@]}"
output tag "$tag"
