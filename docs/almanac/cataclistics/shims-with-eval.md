# A dependency's shims brought eval into the build

- **Met:** 2026-11-27, phase 4, the explorer of the stored files (Q8).
- **Topic:** [manifest](../solutions/manifest.md)

## What happened

With isomorphic-git built into the options page, `web-ext lint` (AMO's
validator) found `DANGEROUS_EVAL` twice in `options/options.js`: "The
Function constructor is eval" in `function-bind`, and "eval can be
harmful" in `get-intrinsic`'s table of the engine's intrinsics. Neither
is our code nor isomorphic-git's: they come in through
`isomorphic-git → sha.js → to-buffer → typed-array-buffer → call-bound /
call-bind / is-typed-array`, shims for engines older than any Firefox.
Rule 5 forbids evaluated code, and AMO rejects it.

`to-buffer` calls `typed-array-buffer` only inside its fallback for an
engine without `ArrayBuffer.isView`; Firefox always has it.

## Solution

`src/explorer/typed-array-buffer.js` is that package in its native form,
four lines: the `ArrayBuffer` under a typed array or `DataView`, a
`TypeError` otherwise. `vite.config.mjs` resolves `typed-array-buffer` to
it (`resolve.alias`), so the whole chain of shims leaves the build and
the validator has nothing left to say. This is not hiding code from the
linter: the code that evaluates is gone from what ships. Turning the
warning into a known finding would have shipped `Function()` to every
user.

## Recognise it again

`DANGEROUS_EVAL` in a bundled page, in a file of `node_modules` that is a
polyfill or a shim (`function-bind`, `get-intrinsic`, `es-abstract`);
`npm ls <package> --omit=dev` shows who brings it.
