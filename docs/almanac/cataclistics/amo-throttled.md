# AMO throttled an upload, and the site, wiki and feed were skipped

- **Met:** 2026-11-28, phase 7, the release of v0.7.38 (RR10).
- **Topic:** [flow](../solutions/flow.md)

## What happened

Every merge into `master` releases, and the release's `amo` job submits the version to AMO
(`scripts/release/amo.sh`). That day saw many releases. AMO refused v0.7.38's upload:
"Request was throttled. Expected available in 5491 seconds." The job failed, so the release
workflow ended in failure, though its tag, packed extension and merge back had gone well.
The site, the wiki and the feed start on `workflow_run` of the release only when it ends
well: all three were skipped, and the site kept the day before's pages.

## What to do

- A throttle is a pause, not an error of the release: `amo.sh` tells it as a warning in the
  run's summary and ends well, so what follows a release still runs. The version not
  uploaded is carried to AMO by the next release, or by running the job again once AMO
  allows. Any other refusal still fails.
- What depends on a release's AMO upload should be only the upload: the site, the wiki and
  the feed are about the GitHub release.
- Releases close together hit AMO's limit: fewer merges into `master` in a day, or
  releases that do not all go to AMO, keep under it.
