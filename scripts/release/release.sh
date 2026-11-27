#!/usr/bin/env bash
# Releases the version of package.json from master (Q7), unless its tag exists already:
#   1. a version released already that reaches master again gets its patch bumped: a hotfix commit
#      on top of master, reached only through its tag (master is not pushed: its ruleset, RR1)
#   2. the packed extension built: dist/save-my-chat-<version>.zip, and dist/save-my-chat.zip,
#      and its source for AMO: dist/save-my-chat-<version>-source.zip
#      for the fixed address of the latest:
#      https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip
#   3. the annotated tag v<version> and the GitHub release, marked the latest, notes from the pull requests
# AMO is a job of its own after this one (amo.sh, listed): an unlisted signing here would take the
# version number AMO gives once. Writes tag=v<version> to $GITHUB_OUTPUT. Needs GH_TOKEN. Usage: release.sh
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
  git commit -qam "chore(release): v$from -> v$(version) (a hotfix, tagged on top of master)"
  echo "v$from was released already: v$(version) is tagged on top of master, and goes back into development"
fi
tag="v$(version)"

# the batch of `task build` (Q10, Q12): dependencies into src/vendor, chats.yaml already written in,
# the pages built by Vite into dist/extension (web-ext's sourceDir)
npm run vendor
node scripts/chats.mjs --check
npm run extension
npx web-ext build --filename "save-my-chat-$(version).zip"
cp "dist/save-my-chat-$(version).zip" dist/save-my-chat.zip
# the source AMO asks for with a built extension (Q12): the repository at this commit,
# built by `npm ci && npm run build` (README, "Building from source")
git archive --format=zip --prefix="save-my-chat-$(version)-source/" -o "dist/save-my-chat-$(version)-source.zip" HEAD
assets=("dist/save-my-chat-$(version).zip" dist/save-my-chat.zip "dist/save-my-chat-$(version)-source.zip")

git tag -a "$tag" -m "$tag"
git push -q origin "$tag"
gh release create "$tag" --title "save-my-chat $tag" --generate-notes --latest --verify-tag "${assets[@]}"
output tag "$tag"
