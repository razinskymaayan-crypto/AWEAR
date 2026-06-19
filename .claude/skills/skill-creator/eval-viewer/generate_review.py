#!/usr/bin/env python3
"""
Generate a self-contained HTML review page for skill eval results.

Usage:
    python generate_review.py <workspace/iteration-N> \
        --skill-name "my-skill" \
        [--benchmark benchmark.json] \
        [--previous-workspace workspace/iteration-N-1] \
        [--static /tmp/output.html]   # write file (default) vs. serve
        [--port 8765]                  # only used without --static
"""

import argparse
import http.server
import json
import os
import sys
import threading
import webbrowser
from pathlib import Path


def load_iteration(workspace: Path) -> list[dict]:
    """Load all evals from an iteration workspace directory."""
    evals = []
    if not workspace.exists():
        return evals

    for item in sorted(workspace.iterdir()):
        if not item.is_dir():
            continue

        meta_path = item / "eval_metadata.json"
        if not meta_path.exists():
            continue

        try:
            meta = json.loads(meta_path.read_text())
        except Exception:
            continue

        entry = {
            "id": meta.get("eval_id", item.name),
            "name": meta.get("eval_name", item.name),
            "prompt": meta.get("prompt", ""),
            "assertions": meta.get("assertions", []),
            "runs": {},
        }

        for run_type in ("with_skill", "without_skill", "old_skill"):
            run_dir = item / run_type
            if not run_dir.exists():
                continue

            run_data = {"outputs": [], "timing": None, "grading": None}

            outputs_dir = run_dir / "outputs"
            if outputs_dir.exists():
                for f in sorted(outputs_dir.iterdir()):
                    if f.is_file():
                        try:
                            content = f.read_text(encoding="utf-8", errors="replace")
                        except Exception:
                            content = f"[binary file: {f.name}]"
                        run_data["outputs"].append({"name": f.name, "content": content})

            timing_path = run_dir / "timing.json"
            if timing_path.exists():
                try:
                    run_data["timing"] = json.loads(timing_path.read_text())
                except Exception:
                    pass

            grading_path = run_dir / "grading.json"
            if grading_path.exists():
                try:
                    run_data["grading"] = json.loads(grading_path.read_text())
                except Exception:
                    pass

            entry["runs"][run_type] = run_data

        evals.append(entry)

    return evals


def load_benchmark(benchmark_path: Path | None) -> dict:
    if benchmark_path and benchmark_path.exists():
        try:
            return json.loads(benchmark_path.read_text())
        except Exception:
            pass
    return {}


def generate_html(
    evals: list[dict],
    benchmark: dict,
    previous_evals: list[dict],
    skill_name: str,
) -> str:
    data = json.dumps(
        {
            "skill_name": skill_name,
            "evals": evals,
            "previous_evals": previous_evals,
            "benchmark": benchmark,
        },
        ensure_ascii=False,
        indent=2,
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Skill Eval Review — {skill_name}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         background: #0d0d12; color: #e0e0e8; min-height: 100vh; }}
  header {{ background: #17171f; border-bottom: 1px solid #24242e;
            padding: 12px 24px; display: flex; align-items: center; gap: 16px; }}
  header h1 {{ font-size: 15px; color: #a0a0b8; font-weight: 500; }}
  header span {{ font-size: 15px; font-weight: 600; color: #e0e0f8; }}
  .tabs {{ display: flex; gap: 2px; margin-left: auto; }}
  .tab {{ padding: 6px 16px; border-radius: 6px; cursor: pointer;
          font-size: 13px; color: #7070a0; background: transparent;
          border: 1px solid transparent; transition: all .15s; }}
  .tab.active {{ background: #24243a; color: #c0c0e8; border-color: #3a3a5a; }}
  .tab:hover:not(.active) {{ color: #a0a0c8; }}
  .panel {{ display: none; }}
  .panel.active {{ display: block; }}

  /* Outputs panel */
  .outputs-layout {{ display: grid; grid-template-columns: 220px 1fr;
                     height: calc(100vh - 49px); }}
  .eval-list {{ background: #12121a; border-right: 1px solid #24242e;
                overflow-y: auto; }}
  .eval-item {{ padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #1a1a24;
                font-size: 13px; color: #7070a0; transition: all .1s; }}
  .eval-item.active {{ background: #1e1e2e; color: #c0c0e8; }}
  .eval-item:hover:not(.active) {{ background: #16161e; color: #9090b8; }}
  .eval-item .eval-num {{ font-size: 11px; color: #4a4a6a; margin-bottom: 2px; }}
  .eval-content {{ overflow-y: auto; padding: 20px 24px; }}

  .prompt-box {{ background: #14141e; border: 1px solid #2a2a3a; border-radius: 8px;
                 padding: 12px 16px; margin-bottom: 16px; font-size: 13px;
                 color: #9090b8; line-height: 1.5; white-space: pre-wrap; }}
  .runs-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }}
  .run-card {{ background: #14141e; border: 1px solid #24242e; border-radius: 8px; }}
  .run-header {{ padding: 10px 14px; border-bottom: 1px solid #1e1e28;
                 font-size: 12px; font-weight: 600; color: #6060a0;
                 display: flex; justify-content: space-between; }}
  .run-header.with_skill {{ color: #60a060; }}
  .run-header.without_skill {{ color: #a06060; }}
  .run-header.old_skill {{ color: #a08060; }}
  .run-body {{ padding: 12px 14px; }}
  .output-file {{ margin-bottom: 8px; }}
  .output-name {{ font-size: 11px; color: #5050a0; margin-bottom: 4px; }}
  .output-content {{ background: #0d0d14; border: 1px solid #1e1e2a; border-radius: 4px;
                     padding: 10px; font-size: 12px; color: #c0c0d8; white-space: pre-wrap;
                     max-height: 300px; overflow-y: auto; font-family: "SF Mono", monospace; }}

  details {{ margin-bottom: 12px; }}
  summary {{ font-size: 12px; color: #5050a0; cursor: pointer; padding: 4px 0;
             user-select: none; }}
  summary:hover {{ color: #7070b0; }}

  .assertions-list {{ margin-top: 8px; }}
  .assertion {{ display: flex; gap: 8px; align-items: flex-start; padding: 4px 0;
                font-size: 12px; color: #8080a0; }}
  .assertion .dot {{ width: 8px; height: 8px; border-radius: 50%; margin-top: 3px;
                     flex-shrink: 0; }}
  .dot.pass {{ background: #4a9a4a; }}
  .dot.fail {{ background: #9a4a4a; }}

  .timing {{ font-size: 11px; color: #5050a0; }}

  .feedback-section {{ margin-top: 16px; }}
  .feedback-label {{ font-size: 12px; color: #6060a0; margin-bottom: 6px; }}
  .feedback-area {{ width: 100%; background: #14141e; border: 1px solid #2a2a3a;
                    border-radius: 6px; color: #c0c0e0; font-size: 13px; padding: 10px 12px;
                    resize: vertical; min-height: 80px; font-family: inherit;
                    transition: border-color .15s; }}
  .feedback-area:focus {{ outline: none; border-color: #4040a0; }}

  .prev-feedback {{ margin-top: 8px; padding: 8px 12px; background: #12121e;
                   border-left: 3px solid #3a3a6a; font-size: 12px; color: #6060a0;
                   border-radius: 0 4px 4px 0; }}

  .nav-bar {{ display: flex; justify-content: space-between; margin-top: 20px; }}
  .nav-btn {{ padding: 7px 20px; background: #1e1e2e; border: 1px solid #3a3a5a;
              border-radius: 6px; color: #8080c0; font-size: 13px; cursor: pointer;
              transition: all .15s; }}
  .nav-btn:hover {{ background: #242438; color: #a0a0d0; }}
  .nav-btn:disabled {{ opacity: 0.3; cursor: default; }}

  .submit-btn {{ position: fixed; bottom: 24px; right: 24px;
                 padding: 10px 24px; background: #3030a0; border: none; border-radius: 8px;
                 color: #e0e0ff; font-size: 14px; font-weight: 600; cursor: pointer;
                 transition: background .15s; box-shadow: 0 4px 20px rgba(48,48,160,.4); }}
  .submit-btn:hover {{ background: #4040c0; }}

  /* Benchmark panel */
  .benchmark-content {{ padding: 24px; max-width: 900px; margin: 0 auto; }}
  .bm-section {{ background: #14141e; border: 1px solid #24242e; border-radius: 8px;
                 padding: 16px 20px; margin-bottom: 16px; }}
  .bm-title {{ font-size: 13px; font-weight: 600; color: #6060a0; margin-bottom: 12px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  th {{ color: #5050a0; text-align: left; padding: 6px 10px; border-bottom: 1px solid #1e1e28; }}
  td {{ padding: 6px 10px; color: #9090b8; border-bottom: 1px solid #1a1a22; }}
  td.pass {{ color: #4a9a4a; }}
  td.fail {{ color: #9a4a4a; }}
  td.better {{ color: #60c060; }}
  td.worse {{ color: #c06060; }}
  .analyst-notes {{ white-space: pre-wrap; font-size: 13px; color: #7070a0;
                    line-height: 1.6; }}
</style>
</head>
<body>

<header>
  <h1>Skill Eval Review —</h1>
  <span id="skill-name"></span>
  <div class="tabs">
    <div class="tab active" onclick="showTab('outputs')">Outputs</div>
    <div class="tab" onclick="showTab('benchmark')">Benchmark</div>
  </div>
</header>

<div id="panel-outputs" class="panel active">
  <div class="outputs-layout">
    <div class="eval-list" id="eval-list"></div>
    <div class="eval-content" id="eval-content"></div>
  </div>
</div>

<div id="panel-benchmark" class="panel">
  <div class="benchmark-content" id="benchmark-content"></div>
</div>

<button class="submit-btn" onclick="submitReviews()">Submit All Reviews</button>

<script>
const DATA = {data};
const feedback = {{}};
let currentIdx = 0;

document.getElementById('skill-name').textContent = DATA.skill_name;

function showTab(name) {{
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'benchmark') renderBenchmark();
}}

function runLabel(key) {{
  return {{with_skill: '✓ With skill', without_skill: '✗ Without skill',
           old_skill: '← Previous skill'}}[key] || key;
}}

function renderEvalList() {{
  const list = document.getElementById('eval-list');
  list.innerHTML = DATA.evals.map((e, i) =>
    `<div class="eval-item ${{i===currentIdx?'active':''}}" onclick="selectEval(${{i}})">
       <div class="eval-num">#${{e.id}}</div>
       <div>${{e.name}}</div>
     </div>`
  ).join('');
}}

function selectEval(idx) {{
  if (currentIdx !== idx) {{
    saveFeedback(currentIdx);
  }}
  currentIdx = idx;
  renderEvalList();
  renderEvalContent();
}}

function saveFeedback(idx) {{
  const ta = document.getElementById('feedback-textarea');
  if (ta) feedback[idx] = ta.value;
}}

function renderEvalContent() {{
  const e = DATA.evals[currentIdx];
  if (!e) return;

  const prevEval = DATA.previous_evals.find(p => p.id === e.id);

  let runsHtml = '<div class="runs-grid">';
  const runKeys = Object.keys(e.runs);
  if (runKeys.length === 0) runsHtml += '<p style="color:#5050a0;font-size:13px">No run outputs found.</p>';

  for (const key of runKeys) {{
    const run = e.runs[key];
    const timing = run.timing ? `${{(run.timing.total_duration_seconds||0).toFixed(1)}}s · ${{(run.timing.total_tokens||0).toLocaleString()}} tok` : '';
    const grading = run.grading;
    let gradingHtml = '';
    if (grading && grading.expectations) {{
      gradingHtml = `<details><summary>Formal grades (${{grading.expectations.filter(a=>a.passed).length}}/${{grading.expectations.length}} passed)</summary>
        <div class="assertions-list">${{grading.expectations.map(a =>
          `<div class="assertion"><div class="dot ${{a.passed?'pass':'fail'}}"></div>
           <div><strong>${{a.text}}</strong><br><span style="color:#5050a0">${{a.evidence||''}}</span></div></div>`
        ).join('')}}</div></details>`;
    }}

    const outputsHtml = run.outputs.map(o =>
      `<div class="output-file"><div class="output-name">${{o.name}}</div>
       <div class="output-content">${{escHtml(o.content)}}</div></div>`
    ).join('') || '<span style="color:#5050a0;font-size:12px">No output files</span>';

    runsHtml += `<div class="run-card">
      <div class="run-header ${{key}}">${{runLabel(key)}}<span class="timing">${{timing}}</span></div>
      <div class="run-body">${{outputsHtml}}${{gradingHtml}}</div>
    </div>`;
  }}
  runsHtml += '</div>';

  let prevSection = '';
  if (prevEval && Object.keys(prevEval.runs).length > 0) {{
    const pk = Object.keys(prevEval.runs)[0];
    const pr = prevEval.runs[pk];
    prevSection = `<details><summary>Previous iteration output</summary>
      ${{pr.outputs.map(o => `<div class="output-file">
        <div class="output-name">${{o.name}}</div>
        <div class="output-content">${{escHtml(o.content)}}</div>
      </div>`).join('')}}
    </details>`;
  }}

  const prevFeedback = '';  // could load from previous iteration feedback.json if bundled

  const fb = feedback[currentIdx] || '';

  document.getElementById('eval-content').innerHTML = `
    <h2 style="font-size:15px;color:#8080b0;margin-bottom:12px">${{e.name}}</h2>
    <div class="prompt-box">${{escHtml(e.prompt)}}</div>
    ${{runsHtml}}
    ${{prevSection}}
    <div class="feedback-section">
      <div class="feedback-label">Your feedback</div>
      <textarea class="feedback-area" id="feedback-textarea" placeholder="What worked? What didn't? What should change?">${{escHtml(fb)}}</textarea>
    </div>
    <div class="nav-bar">
      <button class="nav-btn" onclick="navigate(-1)" ${{currentIdx===0?'disabled':''}}>← Previous</button>
      <span style="font-size:13px;color:#5050a0">${{currentIdx+1}} / ${{DATA.evals.length}}</span>
      <button class="nav-btn" onclick="navigate(1)" ${{currentIdx===DATA.evals.length-1?'disabled':''}}>Next →</button>
    </div>
  `;
}}

function navigate(dir) {{
  saveFeedback(currentIdx);
  selectEval(currentIdx + dir);
}}

function escHtml(s) {{
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}}

function renderBenchmark() {{
  const bm = DATA.benchmark;
  const el = document.getElementById('benchmark-content');
  if (!bm || Object.keys(bm).length === 0) {{
    el.innerHTML = '<p style="color:#5050a0;padding:24px">No benchmark data available.</p>';
    return;
  }}

  let html = `<h2 style="font-size:16px;color:#8080b0;margin-bottom:20px">Benchmark — ${{DATA.skill_name}}</h2>`;

  if (bm.summary) {{
    html += `<div class="bm-section"><div class="bm-title">Summary</div>
    <table><thead><tr><th>Configuration</th><th>Pass Rate</th><th>Avg Time</th><th>Avg Tokens</th></tr></thead><tbody>`;
    for (const row of (bm.summary || [])) {{
      html += `<tr><td>${{row.config}}</td><td class="${{row.pass_rate>=0.8?'pass':'fail'}}">${{(row.pass_rate*100).toFixed(0)}}%</td>
               <td>${{row.avg_duration_s?.toFixed(1)}}s</td><td>${{row.avg_tokens?.toLocaleString()}}</td></tr>`;
    }}
    html += '</tbody></table></div>';
  }}

  if (bm.per_eval) {{
    html += `<div class="bm-section"><div class="bm-title">Per-Eval Results</div>
    <table><thead><tr><th>Eval</th><th>Config</th><th>Pass Rate</th><th>Time</th></tr></thead><tbody>`;
    for (const row of (bm.per_eval || [])) {{
      html += `<tr><td>${{row.eval_name}}</td><td>${{row.config}}</td>
               <td class="${{row.pass_rate>=0.8?'pass':'fail'}}">${{(row.pass_rate*100).toFixed(0)}}%</td>
               <td>${{row.duration_s?.toFixed(1)}}s</td></tr>`;
    }}
    html += '</tbody></table></div>';
  }}

  if (bm.analyst_notes) {{
    html += `<div class="bm-section"><div class="bm-title">Analyst Notes</div>
             <div class="analyst-notes">${{escHtml(bm.analyst_notes)}}</div></div>`;
  }}

  el.innerHTML = html;
}}

function submitReviews() {{
  saveFeedback(currentIdx);
  const reviews = DATA.evals.map((e, i) => ({{
    run_id: `eval-${{e.id}}-with_skill`,
    feedback: feedback[i] || '',
    timestamp: new Date().toISOString(),
  }}));
  const blob = new Blob([JSON.stringify({{reviews, status: 'complete'}}, null, 2)],
                        {{type: 'application/json'}});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'feedback.json';
  a.click();
}}

document.addEventListener('keydown', e => {{
  if (e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft' && currentIdx > 0) navigate(-1);
  if (e.key === 'ArrowRight' && currentIdx < DATA.evals.length-1) navigate(1);
}});

renderEvalList();
renderEvalContent();
renderBenchmark();
</script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate skill eval review HTML")
    parser.add_argument("workspace", help="Path to iteration workspace directory")
    parser.add_argument("--skill-name", default="skill", help="Skill name")
    parser.add_argument("--benchmark", help="Path to benchmark.json")
    parser.add_argument("--previous-workspace", help="Path to previous iteration workspace")
    parser.add_argument("--static", help="Write static HTML to this path instead of serving")
    parser.add_argument("--port", type=int, default=8765, help="Port for HTTP server")
    args = parser.parse_args()

    workspace = Path(args.workspace)
    evals = load_iteration(workspace)
    benchmark = load_benchmark(Path(args.benchmark) if args.benchmark else None)
    previous_evals = load_iteration(Path(args.previous_workspace)) if args.previous_workspace else []

    if not evals:
        print(f"Warning: no eval directories found in {workspace}", file=sys.stderr)

    html = generate_html(evals, benchmark, previous_evals, args.skill_name)

    if args.static:
        out = Path(args.static)
        out.write_text(html, encoding="utf-8")
        print(f"Written to {out}")
        return

    # Serve
    import io

    html_bytes = html.encode("utf-8")

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path in ("/", "/index.html"):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html_bytes)))
                self.end_headers()
                self.wfile.write(html_bytes)
            elif self.path == "/feedback" and self.command == "POST":
                pass
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, fmt, *args):
            pass

    server = http.server.HTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Serving at {url} — press Ctrl+C to stop")
    threading.Thread(target=lambda: webbrowser.open(url), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
