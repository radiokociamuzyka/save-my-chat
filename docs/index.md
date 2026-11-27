# save-my-chat

A Firefox extension that takes a conversation out of an AI chat webapp and
saves it on your own machine, as Markdown or JSON, in one format that reads
the same whichever service it came from.

Open a conversation, click the toolbar button, choose a format: the file
lands in your downloads. Nothing is sent anywhere.

## Supported webapps

| Webapp | Address of a conversation | State |
| --- | --- | --- |
| Google Search, AI Mode | `https://www.google.com/search?…&udm=50` | checked on live chats |
| GitHub Copilot | `https://github.com/copilot/c/…` | checked on live chats |

More are planned (ChatGPT, Claude, Gemini, Microsoft Copilot, Perplexity,
Le Chat, DeepSeek, HuggingChat): see the
[declaration of chats](https://github.com/radiokociamuzyka/save-my-chat/blob/master/resources/data/chats.yaml).

## Read on

- [Install](manual/install.md): the newest release in Firefox
- [Save a conversation](manual/saving.md): the popup, the formats, where files go
- [When a reader misses something](manual/troubleshooting.md): the report, your own selectors
- [Your own reader](manual/prototypes.md): a prototype, copied from a default and changed
- [Privacy](manual/privacy.md): what the extension reads and writes
- For developers: [how a reader is written](guides/readers.md) and [the unified format](guides/format.md)

How the project is made (the devlog, the changelog, the almanac of
problems solved) is in the [wiki](https://github.com/radiokociamuzyka/save-my-chat/wiki),
in English and Polish. The code is on
[GitHub](https://github.com/radiokociamuzyka/save-my-chat), under the
[Mozilla Public License 2.0](https://github.com/radiokociamuzyka/save-my-chat/blob/master/LICENSE).
