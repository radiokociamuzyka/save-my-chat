# manifest

- [gecko-id-format](../cataclistics/gecko-id-format.md): the id is `name@domain` (or a GUID), never a bare domain nor `@` glued to one
- [linter-userscripts-register](../cataclistics/linter-userscripts-register.md): an MV3 API the linter calls removed is a false positive named exactly in `scripts/lint.mjs`, and removed when the linter is fixed; never `warningsAsErrors` off, never an alias around the linter.
- [shims-with-eval](../cataclistics/shims-with-eval.md): a shim deep in the dependencies held eval: put its native form in its place (`resolve.alias`), never a known finding
