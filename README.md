# save-my-chat

A Firefox extension that exports your AI chat history out of webapps and
saves it on your local machine in clear, unified formatting.

Open a conversation in a supported chat webapp, click the toolbar button,
and the conversation is saved as Markdown (or JSON) into your downloads.
Nothing is sent anywhere: the extension reads the page you have open and
writes a file.

> Status: phase 1, the first readers for real. See
> [docs/devlog/TODO.md](docs/devlog/TODO.md).

## Supported webapps

| Webapp | Reader | State |
| --- | --- | --- |
| Google Search, AI Mode | `src/readers/google-ai-mode.js` | from Sett's snippet; warns when a message may be missing |
| GitHub Copilot chat | `src/readers/github-copilot.js` | draft, unverified |

Each webapp has its own **reader**, a small script injected into its pages.
The ones shipped with the extension are the defaults; you will be able to
copy one into your own **prototype**, change it, and run it instead
(phase 2, through Firefox's `userScripts` API).

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

- [How a reader is written](docs/guides/readers.md)
- [The unified format](docs/guides/format.md)
- [Vision](docs/devlog/VISION.md) and [roadmap](docs/devlog/ROADMAP.md)
- [Contributing](.github/CONTRIBUTING.md)

## License

[Mozilla Public License 2.0](LICENSE).
