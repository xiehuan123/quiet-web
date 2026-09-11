# WXT scaffold runtime diagnosis

Date: 2026-09-11

## Symptom and feedback loop

The first real `npx wxt@latest init source --template vanilla --pm npm` invocation produced no project files while the login shell exposed Node 20.19.4. The deterministic check was:

```text
test -f source/package.json
FAIL: source/package.json was not generated
```

## Ranked hypotheses and probes

1. Registry unavailable — falsified by `npm view wxt@0.21.4 version` returning `0.21.4`.
2. CLI/runtime mismatch — confirmed when WXT 0.21.4 reported `node >=22` while the login shell exposed Node 20.19.4.
3. Hidden prompt or lost process — nearby symptom, but not the load-bearing cause once the engine mismatch was observed.
4. Workspace permissions — falsified by successful project record and later scaffold writes.

## Fix and original-scenario verification

The coordinator confirmed an existing isolated Node 24.19.0 binary. Commands now use `login=false` and an explicit project-scoped environment; Node was not downloaded and the generated WXT dependency range was not replaced.

The existing generated `source/` was retained. There was no partial `source/node_modules` or lockfile to move. A single clean `npm install` completed, generated `package-lock.json`, ran `wxt prepare`, and the original scaffold path then passed:

- `npm run compile`: passed.
- `npm run build`: passed with WXT 0.21.4.
- `.output/chrome-mv3/manifest.json`: present.

No temporary debug instrumentation was added. The reusable prevention is to run project Node commands with the explicit non-login Node 24 environment recorded in `run-inputs/coordinator-notes.md`.
