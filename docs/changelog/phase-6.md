# Phase 6: release

Append-only. The owner's words are kept word for word.

The release for everyone, 1.0.0, comes after phases 7-9 (Q16). This phase's work - the
icons, the media, the statements, the store listing - is done before it (Sett, 2026-11-28).

## 2026-11-28, the media and the statements (issue #7, word for word)

> as for files like images and such:
>
> - here is header of website and socialmedia banner: `https://huggingface.co/buckets/Sarverott/mediacontainer/resolve/save-my-chat_banner.png`
> - here is image for logo of addon and favicon for readthedocs: `https://huggingface.co/buckets/Sarverott/mediacontainer/resolve/save-my-chat_logo.png`
> - here is image for poster: `https://huggingface.co/buckets/Sarverott/mediacontainer/resolve/save-my-chat_poster.png`
>
> and all of them are listed with variations in `resources/media/.index.json`. files can be copied but all beside `.index.json` and `README.md` inside media dir shall be gitignored by gitignore file inside (so exclude also that gitignore by gitignore entry)
>
> all of files are higher quality than needed so you can manipulate sizing and such stuff to be done with `ffmpeg` tool. privacy statement should be place like other statements inside `docs/statements/` to be later on refered by website directly by raw read of repo file content of master branch.
>
> all resized and reshaped once files should be also placed there to be reused in future to skip repetitive operations. 
>
> https://huggingface.co/buckets/Sarverott/mediacontainer

And in the chat: "in issues i made commentary for phase 6. read it and take care of closing
that topics there. after finishing that phase continue further what we have to be done by
list of chats we want to support. proceede."

**Decision:** as written:

- `task media` (`scripts/media.mjs`) fetches the files of `resources/media/.index.json` from
  the bucket when missing, sizes them with ffmpeg once into `resources/media/derived/`, and
  places the small ones; `resources/media/.gitignore` keeps all but `.index.json`,
  `README.md` and itself out of git.
- The logo is the add-on's icon (16 to 128 px, the toolbar button too) and the favicon and
  logo of Read the Docs and of the site; the banner the site's header and the card of a
  shared link (1200 x 630); the poster sized for the listing.
- The small copies the builds use are committed where the builds take them (`src/icons/`,
  `docs/assets/`, `site/public/`): the release, CI and AMO's reviewers building from source
  then need neither the bucket nor ffmpeg.
- `docs/statements/privacy.md`, the privacy statement, and `listing.md`, the store listing;
  the site's Privacy page reads the statement raw from `master` when opened, the one thing
  the site loads from elsewhere; Read the Docs shows both.
- Filling AMO's listing in is Sett's (RR10).

### RR10 (issue #160, word for word)

> done, but while releasing error stops some things for unknown reason - please investigate it

And in the chat: "it hits error, RR10 has comment"

**Decision:** AMO's listing is filled in. The error was the release of v0.7.38 (PR #161): its
tag, packed extension and merge back went well, but AMO refused the upload - "Request was
throttled. Expected available in 5491 seconds." - after the day's many releases. The job's
failure failed the release workflow, and the site, the wiki and the feed, which run only
after a release that went well, were skipped: the site did not get the Privacy page and
the banner. `amo.sh` now tells a throttled upload in the run's summary and ends well (the
next release carries its changes to AMO, or the job is run again once AMO allows); any other
refusal still fails. Almanac: amo-throttled.

