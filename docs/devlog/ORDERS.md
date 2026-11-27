# ORDERS: the owner's decisions

The owner's answers to `Q<n>` of [BRAINSTORM.md](BRAINSTORM.md) and decisions
on `PP<n>` of [PROPOSALS.md](PROPOSALS.md), each under `### Q<n>` or
`### PP<n>`, written below the line. Agents move them word for word into the
changelog and leave this file with its header only.

---

### Q8

From issue #22, Sett, 2026-11-27:

> read that issue's commentary about `src/vendor` and dependencies: https://github.com/radiokociamuzyka/save-my-chat/issues/24
>
> these things should be placed in gitignored vendor dir at building before packing an release archive file.

### Q9

From issue #23, Sett, 2026-11-27:

> sure, add that button

### Q10

From issue #24, Sett, 2026-11-27:

> your `Lean:` way is good but add also that all to be done by batched `task build` that also gathers that codes in `src/vendor` right now (we want it to be gitignored in the repo, like `node_modules`, so all that we will have as dependencies of `package.json` will become packed and added inside `src/vendor` for our released packed addon of browser)
