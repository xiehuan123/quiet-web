# Skill invocation record

All paths are inside this isolated project. Hashes are SHA-256 of the entry file read for this run.

| Skill | Entry hash | Input | Execution evidence | Status |
| --- | --- | --- | --- | --- |
| `browser-extension-launch` | `e02780d1117d95d97f7d0e57d65ad9a707f41aa093b3099b9b2c7b9c1e448994` | `BRIEF.md`, browser choice | `.extension-launch/`, this record | running |
| `setup-matt-pocock-skills` | `310fb1a73c0467e617e17d7c41d4a2278b5405c4a27f36d7cd22bb4599aee6bb` | No remote; Local Markdown authorized; triage installed; single package | `AGENTS.md`, `docs/agents/*.md` | executed |
| `research` | `985569f15739c713d6784887c3d186d4ef9ac85bec5ad9c068d25bf0739928e4` | Verify first-party filtering sources and first-release boundary | `research/verified-primary-sources.md` | executed |
| `chrome-extensions` | `c67d9e4ba9da93ed0da8b0147235e5890aa24e659548f65b7765c5af0a470c3f` | MV3, DNR, content filtering, popup, storage, messaging, icons | Architecture decisions and implementation | running |
| `extension-create` | `579b05e875ae6b63ce98aad54e4e0a4ad0b55afb3779e77f3d9cc511e99fc1f2` | `quiet-web`, Vanilla TypeScript, popup/content/background/options | `source/`, `source/package-lock.json`, production build | executed |
| `to-spec` | `5d26479544b08048d3a8f79d937b39bc613a617f026b3fd083bafc1e99a7b811` | Accepted brief plus verified research | `.scratch/ad-cleaner/spec.md` | executed |
| `to-tickets` | `5ecdf1d4df8a360ed39df21a2347f97ba177afd449a577da4f6b6ea8e1ebb808` | Published local spec | `.scratch/ad-cleaner/issues/01` through `04` | executed |
| `implement` | `6d3fd9e83b8f36e5213854779db49b256a457a7ebb4a503e53fa7dcff696adc3` | Ticket 01 network protection and master switch | `source/`, `evidence/ticket-01/`, `.scratch/ad-cleaner/issues/01-*` | executed (ticket 01) |
| `tdd` | `5e6b9c16b547113e90afbb946489d1c1384be5c2128f0159bd0bee57251ecf08` | Public seams delegated by the accepted run prompt | Rule, protection, state, and fixture tests | read |
| `codebase-design` | `a8d50abac5a4018f60e1d911d4b6f4e36454ca14d6c390c0695a578c7de65dad` | Place seams between pure policy and Chrome adapters | Architecture and test seams in spec | executed |
| `product-designer` | `d0995fcc2a4accdb7df4a47d01a7263af6423298db95b76f8eb186a7b95caf74` | Popup/settings flow and recovery feedback | Product flow and UX acceptance criteria in spec | executed |
| `ui-designer` | `32abfbe25a5d3c5ec586e9993c2a754dd6dce11883ad54272c9af1db13ea65b8` | Compact popup and accessible options page | UI states, focus, contrast, and screenshots | running |
| `frontend-architect` | `346645cc2e92860c11f96ccc7e66c1a1753fad4fd88cea9cfe3e7f4eabff1095` | Vanilla TS extension UI and state ownership | Shared domain modules plus thin Chrome/UI adapters | executed |

## Authorized workflow adaptations

The upstream setup/spec/ticket skills normally pause for confirmation. This run's explicit prompt delegates tracker choice, testing seams, ticket granularity, blockers, and reversible technical defaults to the agent and forbids repeating those questions to the beginner. Local publication therefore proceeds directly, while product scope and evidence requirements remain unchanged.

## Diagnosing-bugs executions

- WXT scaffold runtime mismatch: `records/diagnostics/scaffold-node-runtime.md`; Node 20 engine mismatch reproduced, Node 24 isolated environment applied, original scaffold compile/build reverified.
- Native popup target and active URL permission: `records/diagnostics/ticket-01-native-target.md`; red regression tests and real action revalidation complete.
