# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

## Q1. License

No license was named, and the scope `radiokociamuzyka` has none to follow.
P_JOL_ROLL is AGPL-3.0, the BOS skillset MIT. `LICENSE` holds a placeholder.

*Lean:* MPL-2.0, Mozilla's own license and common among Firefox add-ons:
file-level copyleft, so a changed reader stays open while the extension can
sit next to anything. MIT if the readers should be free to take anywhere.

## Q2. The add-on's id

Firefox needs `browser_specific_settings.gecko.id` for MV3, and AMO binds it
to the add-on forever on the first signing.

*Lean:* `save-my-chat@radiokociamuzyka.github.io` (now in the manifest), in
the same shape as P_JOL_ROLL's `p-jol-roll@sarverott.github.io`.

## Q3. AMO: listed, or self-distributed

Listed means a public page on addons.mozilla.org, updates through it, and a
review that may be manual. Unlisted means signed by AMO but hosted by us,
updates through an `update_url`.

*Lean:* unlisted while phases 1-3 run (Sett installs signed builds from the
release page), listed at 1.0.0.

## Q4. Who commits here

The repository is empty: no `master`, no `development`, no `.github/AUTHORS`
line for an agent. The local branch is named `main`; BOS uses `master`.

*Lean:* Sett makes the first commit of this skeleton on `master` (or tells
Cleo to), renaming `main`; then `development` from it and `dev/Cleo` for the
agent's work. Cleo's line goes into `AUTHORS` when Sett writes it there, as
in P_JOL_ROLL.

## Q5. Where the existing scripts are

Sett has scripts already injected into the supported chat interfaces. They
are not in this repository nor found next to it, and they decide what the
default readers look like.

*Lean:* Sett drops them into `src/readers/incoming/` (or names their path);
Cleo fits each one to the reader contract, keeping its selectors and NOTE
comments, and writes a fixture test for it.

## Q6. A build step

Plain JavaScript loaded as written keeps AMO review simple (no source
submission). TypeScript or a bundler would need one.

*Lean:* no build step. JSDoc types and `// @ts-check` if types are wanted.
