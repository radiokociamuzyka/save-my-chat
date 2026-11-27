// The default readers, run after the kit (demo.js imports kit.js first): Vite puts a
// glob's imports at the top of its module, so they have a module of their own.
import.meta.glob("../../../src/readers/*.js", { eager: true });
export const SOURCES = import.meta.glob("../../../src/readers/*.js", { eager: true, query: "?raw", import: "default" });
