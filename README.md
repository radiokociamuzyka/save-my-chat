# save-my-chat

A Firefox extension that exports your AI chat history out of webapps and
saves it on your local machine in clear, unified formatting.

Open a conversation in a supported chat webapp, click the toolbar button,
and the conversation is saved as Markdown (or JSON) into your downloads.
Nothing is sent anywhere: the extension reads the page you have open and
writes a file.

> Status: phase 3, prototypes. Both readers are checked on live
> chats. The plan: [docs/devlog/TODO.md](docs/devlog/TODO.md), also in the
> [wiki](https://github.com/radiokociamuzyka/save-my-chat/wiki) in English and Polish.

## Supported webapps

| Webapp | Reader | State |
| --- | --- | --- |
| Google Search, AI Mode | `src/readers/google-ai-mode.js` | checked on live chats |
| GitHub Copilot chat | `src/readers/github-copilot.js` | checked on live chats |

The webapps, planned ones too, are declared in
[resources/data/chats.yaml](resources/data/chats.yaml).

Each webapp has its own **reader**, a small script injected into its pages.
The ones shipped with the extension are the defaults. A reader that
misses messages can be fixed from the options page with your own
selectors (the popup's *What the reader saw* tells which part broke), or
copied into your own **prototype**, changed, and run instead, through
Firefox's `userScripts` API ([the manual](https://save-my-chat.readthedocs.io/en/latest/manual/prototypes/)).

## Install

The newest release, packed:
[save-my-chat.zip](https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip)
(every version: [releases](https://github.com/radiokociamuzyka/save-my-chat/releases)).
It is also [on addons.mozilla.org](https://addons.mozilla.org/firefox/addon/save-my-chat/)
(v0.4.6 waiting for review). Until then, load the release in Firefox from
`about:debugging` → *This Firefox* → *Load Temporary Add-on…*.

## Getting started

You need Node.js 24, npm and Firefox 142 or later.
[Task](https://taskfile.dev) is optional; the npm scripts do the same.

```sh
npm ci
task run      # Firefox with the extension loaded, rebuilt and reloaded on save
task verify   # the build, Biome, web-ext lint, tests
task build    # the .zip into dist/
```

Without Task: `npm start`, `npm run verify`, `npm run build`.

## Building from source

For AMO's reviewers, with each version's source archive
(`save-my-chat-<version>-source.zip`, attached to its
[release](https://github.com/radiokociamuzyka/save-my-chat/releases)).
On Linux, macOS or Windows, with Node.js 24 and npm 11:

```sh
npm ci
npm run build
```

The extension is then `dist/extension/` and packed as
`dist/save-my-chat-<version>.zip`. What the build does:

1. `scripts/vendor.mjs` copies the files of the dependencies that run as
   they are (turndown and its GFM plugin) from `node_modules/` into
   `src/vendor/`, unchanged, with the licenses of all dependencies.
2. `scripts/chats.mjs` checks the readers' list and host permissions.
3. Vite (`vite.config.mjs`) builds the extension's pages written in Vue
   (`src/popup/`) into `dist/extension/`, **not minified**, Vue and Bulma
   bundled in, and copies the rest of `src/` there as it is: the
   background, the content scripts and the readers are plain JavaScript,
   not processed.
4. `web-ext build` packs `dist/extension/`.

## Where to read on

- The manual: [install](docs/manual/install.md), [saving](docs/manual/saving.md),
  [when a reader misses something](docs/manual/troubleshooting.md), [privacy](docs/manual/privacy.md)
  ([on Read the Docs](https://save-my-chat.readthedocs.io), built from `mkdocs.yml`)
- [How a reader is written](docs/guides/readers.md)
- [The unified format](docs/guides/format.md)
- [Vision](docs/devlog/VISION.md) and [roadmap](docs/devlog/ROADMAP.md); the devlog, changelog and almanac in the [wiki](https://github.com/radiokociamuzyka/save-my-chat/wiki)
- [Contributing](.github/CONTRIBUTING.md)

## License

[Mozilla Public License 2.0](LICENSE).
