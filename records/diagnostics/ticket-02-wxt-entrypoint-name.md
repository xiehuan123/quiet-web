# Ticket 02 WXT entrypoint name collision

`npm run build` failed after all 25 behavior tests and TypeScript compilation passed. WXT reported two entrypoints named `content`: `entrypoints/content.ts` and `entrypoints/content.css`.

The build command itself is the deterministic feedback loop. The CSS was intended as an imported stylesheet, not an independent WXT entrypoint, so it was moved to `styles/content.css` and the TypeScript import was updated. The original full test, compile, and build sequence was rerun after this change; no behavior or expectation was weakened.
