# Media

The project's images live in Sett's media container, a Hugging Face bucket:
<https://huggingface.co/buckets/Sarverott/mediacontainer>. `.index.json` names its
files and what each is for (Sett's, as written).

`task media` (`scripts/media.mjs`):

1. fetches every file of the index that is not here yet;
2. makes the sizes the project uses with ffmpeg into `derived/`, once (`-- --force` makes
   them again);
3. copies the small ones where the builds take them, which are committed: the extension's
   icons (`src/icons/`), Read the Docs' favicon and logo (`docs/assets/`), the site's
   favicon, header banner and social card (`site/public/`).

Only this README, the index and `.gitignore` are in git here (Sett, issue #7): the
originals are larger than any use needs.

| From | Made | Used as |
| --- | --- | --- |
| `save-my-chat_logo.png` | `icon-16` … `icon-128.png`, `logo-256.png` | the add-on's icon, the toolbar button; the docs' favicon and logo; the site's favicon |
| `save-my-chat_banner.png` | `banner-1280.webp`, `social-1200x630.jpg` | the site's header; the card shown when a link to the site is shared |
| `save-my-chat_poster.png` | `poster-800.webp` | the poster (kept for the store listing and posts) |
