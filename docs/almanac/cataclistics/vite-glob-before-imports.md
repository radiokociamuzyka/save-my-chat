# A glob's imports run before the imports written above it

- **Met:** 2026-11-27, phase 4, the public site's demo of the options (Q13).
- **Topic:** [testing](../solutions/testing.md)

## What happened

The site runs the extension's kit and default readers as modules, so the
options' readers panel finds their built-in selectors. `demo.js` imported
`src/core/kit.js` first, then the readers with an eager
`import.meta.glob("../../../src/readers/*.js")`. In the built page both
islands failed to hydrate: `Cannot read properties of undefined (reading
'reader')`, a reader calling `SaveMyChat.reader` before the kit had made
`SaveMyChat`. Vite turns an eager glob into `import` statements put at the
top of its module, above the imports written before it, and imports run in
that order.

## Solution

The kit has a module of its own (`site/src/components/kit.js`) and the
glob another (`readers.js`); `demo.js` imports the kit's module first.
Between modules, the order of the `import` lines holds.

## Recognise it again

Side-effect imports in one module that must run in order, one of them a
glob; an error that a global made by an earlier import is undefined.
