# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`. No remote tracker is used.

## Conventions

- One feature directory: `.scratch/ad-cleaner/`
- Authoritative spec: `.scratch/ad-cleaner/spec.md`
- One implementation issue per file: `.scratch/ad-cleaner/issues/<NN>-<slug>.md`
- Files are numbered in dependency order, with blockers listed explicitly.
- `Status:` records the current triage or implementation state.
- Comments and history are appended under `## Comments` when needed.

## Publishing locally

When a skill says “publish to the issue tracker”, create or update the corresponding file under `.scratch/ad-cleaner/`. Writing the file is the publish action; do not call GitHub, GitLab, or another remote service.

## Fetching work

Read the exact referenced spec or issue file in full. Work the first issue whose blockers are complete, and keep evidence linked from that issue.
