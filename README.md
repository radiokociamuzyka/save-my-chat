# save-my-chat

A Firefox extension that exports your AI chat history out of webapps and
saves it on your local machine in clear, unified formatting.

Open a conversation in a supported chat webapp, click the toolbar button,
and the conversation is saved as Markdown (or JSON) into your downloads.
Nothing is sent anywhere: the extension reads the page you have open and
writes a file.

> Status: phase 2, GitHub integration. Both readers are checked on live
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
The ones shipped with the extension are the defaults; you will be able to
copy one into your own **prototype**, change it, and run it instead
(phase 3, through Firefox's `userScripts` API). Until then a reader that
misses messages can be fixed from the options page with your own
selectors; the popup's *What the reader saw* tells which part broke.

## Install

The newest release, packed:
[save-my-chat.zip](https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip)
(every version: [releases](https://github.com/radiokociamuzyka/save-my-chat/releases)).
Until builds are signed by AMO, load it in Firefox from `about:debugging` →
*This Firefox* → *Load Temporary Add-on…*.

## Getting started

You need Node.js 24, npm and Firefox 142 or later.
[Task](https://taskfile.dev) is optional; the npm scripts do the same.

```sh
npm ci
task run      # Firefox with the extension loaded, reloads on save
task verify   # Biome, web-ext lint, tests
task build    # the .zip into dist/
```

Without Task: `npm start`, `npm run verify`, `npm run build`.

## Where to read on

- The manual: [install](docs/manual/install.md), [saving](docs/manual/saving.md),
  [when a reader misses something](docs/manual/troubleshooting.md), [privacy](docs/manual/privacy.md)
  (built on Read the Docs from `mkdocs.yml`)
- [How a reader is written](docs/guides/readers.md)
- [The unified format](docs/guides/format.md)
- [Vision](docs/devlog/VISION.md) and [roadmap](docs/devlog/ROADMAP.md); the devlog, changelog and almanac in the [wiki](https://github.com/radiokociamuzyka/save-my-chat/wiki)
- [Contributing](.github/CONTRIBUTING.md)

## License

[Mozilla Public License 2.0](LICENSE).
