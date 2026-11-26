# Contributing to save-my-chat

save-my-chat is a Firefox extension that saves conversations from AI chat
webapps on your own machine, in one unified format. By taking part you agree
to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Polish and English are both welcome in issues and discussions. Code,
comments and documentation are written in English.

## Setting up

You need Node.js 24, npm and Firefox 142 or later.
[Task](https://taskfile.dev) is optional; the npm scripts do the same.

```sh
git clone https://github.com/radiokociamuzyka/save-my-chat.git
cd save-my-chat && npm ci
task run      # Firefox with the extension, reloads on save
task verify   # Biome, web-ext lint, tests - run before a pull request
```

## The most welcome change: a reader

A webapp changed its page and a reader broke, or a webapp has no reader
yet. [docs/guides/readers.md](../docs/guides/readers.md) says how a reader
is written and tested. Please add a saved page as a fixture with every
personal word removed: never attach a conversation that is not meant to be
public.

## Making a change

1. Branch from `development` (`dev/<your-name>`); never from or into `master`.
2. One change per commit, as a conventional commit: `type(scope): subject`,
   e.g. `fix(readers): copilot titles after the November redesign`.
3. `task verify` passes.
4. Open the pull request into `development`.

The extension sends nothing anywhere. A change that would make it send
data, load remote code or run `eval` will not be merged.
