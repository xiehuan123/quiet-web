# Ticket 01 two-axis review

Fixed point: `927d15b6dad2629c1a17fdb33555a36770569c00`  
Reviewed diff: `git diff 927d15b -- source evidence records/diagnostics/scaffold-node-runtime.md records/skill-invocations.md .extension-launch/state.json`  
Spec: `.scratch/ad-cleaner/issues/01-network-protection-and-master-switch.md` and parent spec.  
Coverage note: implementation files were staged before both review passes, so new uncommitted files were included.

## Standards

Initial independent review found no hard violations and two judgement findings: duplicated normalized storage reads and primitive resource/action strings. Both were fixed by `readSettingsRecord()` and explicit network union types, with tests/build rerun.

Re-review found no hard violations. It raised one remaining judgement-only **Middle Man** smell for the one-line `readSettings()` interface. This is intentionally retained: callers needing only normalized settings do not learn the `{raw, settings}` migration interface used by initialization. The documented project and Chrome-extension rules pass.

Count after re-review: 0 hard findings; 1 accepted judgement finding.

## Spec

Initial independent review found two issues:

1. Native popup could fall back to an older HTTP tab when the actual active page was unsupported.
2. A storage-write rejection after changing DNR could leave rules inconsistent with the persistent authority.

Both received red regression tests. Popup selection now accepts only the actual active tab, verified with `about:blank` while an older fixture remained open. Master switch updates now compensate by restoring the previous ruleset state if persistence rejects.

Independent re-review found no remaining missing, incorrect, or scope-creep behavior.

Count after re-review: 0 findings.
