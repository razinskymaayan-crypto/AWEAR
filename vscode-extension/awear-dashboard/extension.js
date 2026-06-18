const vscode = require('vscode');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let panel = null;
let refreshTimer = null;

function getRepoRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length ? folders[0].uri.fsPath : null;
}

// VS Code webviews run in a secure (https-equivalent) context, which
// makes Chromium block loading our local FastAPI server's plain
// http://127.0.0.1 content as "mixed content" -- an iframe pointed at
// it silently fails to load. So the webview never talks to the HTTP
// server at all: the extension host runs the same Python build script
// directly and pushes the result in over postMessage instead.
function buildData(repoRoot, outputChannel) {
  const pythonPath = path.join(repoRoot, 'venv312', 'bin', 'python3');
  const scriptPath = path.join(repoRoot, 'tools', 'dashboard_build.py');
  try {
    const out = execFileSync(pythonPath, [scriptPath, '--json'], {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 20,
    }).toString('utf8');
    return JSON.parse(out);
  } catch (err) {
    outputChannel.appendLine('Failed to build dashboard data: ' + err.message);
    return null;
  }
}

function pushData(repoRoot, outputChannel) {
  if (!panel) return;
  const data = buildData(repoRoot, outputChannel);
  if (data) panel.webview.postMessage({ type: 'data', payload: data });
}

function appendNote(repoRoot, persona, text, outputChannel) {
  const notesPath = path.join(repoRoot, 'agents', 'agent_notes.json');
  let notes = {};
  try {
    notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
  } catch (err) {
    // missing or empty file -- start fresh
  }
  notes[persona] = notes[persona] || [];
  notes[persona].push({ text, from: 'carmel', at: new Date().toISOString() });
  try {
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf8');
  } catch (err) {
    outputChannel.appendLine('Failed to save note: ' + err.message);
  }
}

function buildWebviewHtml(repoRoot) {
  const htmlPath = path.join(repoRoot, 'tools', 'dashboard.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: https:; font-src https: data:; connect-src https:; worker-src blob:;">`;
  const flag = `<script>window.__VSCODE_MODE__ = true;</script>`;
  html = html.replace('<head>', '<head>' + csp + flag);
  return html;
}

// kept around purely so the standalone-browser dashboard (tools/dashboard_server.py
// on :8001) is also available if Carmel wants to open it outside VS Code too.
function startServerIfNeeded(repoRoot, outputChannel) {
  const http = require('http');
  const req = http.get({ host: '127.0.0.1', port: 8001, path: '/', timeout: 1000 }, (res) => {
    res.resume();
  });
  req.on('error', () => {
    const pythonPath = path.join(repoRoot, 'venv312', 'bin', 'python3');
    const scriptPath = path.join(repoRoot, 'tools', 'dashboard_server.py');
    try {
      const serverProcess = spawn(pythonPath, [scriptPath], { cwd: repoRoot });
      serverProcess.stdout.on('data', (d) => outputChannel.appendLine(d.toString()));
      serverProcess.stderr.on('data', (d) => outputChannel.appendLine(d.toString()));
      outputChannel.appendLine('Started standalone dashboard server (pid ' + serverProcess.pid + ') for browser access on :8001.');
    } catch (err) {
      outputChannel.appendLine('Could not start standalone dashboard server: ' + err.message);
    }
  });
  req.on('timeout', () => req.destroy());
}

function openPanel(repoRoot, outputChannel) {
  if (!repoRoot) {
    vscode.window.showErrorMessage('AWEAR: open the AWEAR repo folder in VS Code first.');
    return;
  }
  if (panel) {
    panel.reveal(vscode.ViewColumn.Active);
    return;
  }
  panel = vscode.window.createWebviewPanel(
    'awearDashboard',
    'AWEAR — Company Dashboard',
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  panel.webview.html = buildWebviewHtml(repoRoot);
  pushData(repoRoot, outputChannel);

  refreshTimer = setInterval(() => pushData(repoRoot, outputChannel), 5000);

  panel.webview.onDidReceiveMessage((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'note') {
      appendNote(repoRoot, msg.persona, msg.text, outputChannel);
      pushData(repoRoot, outputChannel);
    } else if (msg.type === 'requestData') {
      pushData(repoRoot, outputChannel);
    }
  });

  panel.onDidDispose(() => {
    panel = null;
    if (refreshTimer) clearInterval(refreshTimer);
  });
}

function activate(context) {
  const outputChannel = vscode.window.createOutputChannel('AWEAR Dashboard');
  const repoRoot = getRepoRoot();

  if (repoRoot) {
    startServerIfNeeded(repoRoot, outputChannel);
  } else {
    outputChannel.appendLine('No workspace folder open -- open the AWEAR repo folder in VS Code.');
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('awear.openDashboard', () => openPanel(repoRoot, outputChannel))
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(organization) AWEAR';
  statusBarItem.tooltip = 'פתח את דשבורד החברה של AWEAR';
  statusBarItem.command = 'awear.openDashboard';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

function deactivate() {
  if (refreshTimer) clearInterval(refreshTimer);
}

module.exports = { activate, deactivate };
