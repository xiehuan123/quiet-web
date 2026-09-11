#!/usr/bin/env python3
from pathlib import Path
import json, os
project = Path(__file__).resolve().parent
run = json.loads((project / ".runtime/run.json").read_text())
if run.get("status") == "running":
    print("当前 Codex CLI 会话仍在开发。请查看 conversation.md，避免同时续接同一会话。")
    raise SystemExit(0)
env = {k:v for k,v in os.environ.items() if k in ("PATH","HOME","USER","LOGNAME","SHELL","LANG","LC_ALL","TMPDIR","TERM","HTTP_PROXY","HTTPS_PROXY","ALL_PROXY","NO_PROXY")}
env["CODEX_HOME"] = run["codex_home"]
os.chdir(project)
os.execvpe(run["codex"], [run["codex"], "resume", run["session_id"], "--model", "gpt-5.6-sol", "-c", 'model_reasoning_effort="high"', "--approve-for-me", "--cd", str(project)], env)
