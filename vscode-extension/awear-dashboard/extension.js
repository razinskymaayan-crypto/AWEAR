const vscode = require('vscode');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

let serverProcess = null;
let panel = null;

function getRepoRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length ? folders[0].uri.fsPath : null;
}

function checkServerAlive(callback) {
  const req = http.get({ host: '127.0.0.1', port: 8001, path: '/', timeout: 1000 }, (res) => {
    callback(true);
    res.resume();
  });
  req.on('error', () => callback(false));
  req.on('timeout', () => { req.destroy(); callback(false); });
}

// The dashboard is a real FastAPI server (tools/dashboard_server.py) --
// it has to actually be running for the webview iframe to show anything.
// If it's already up (e.g. Jeff started it manually this session), leave
// it alone; otherwise start it ourselves so this "just works" on open.
function startServerIfNeeded(repoRoot, outputChannel) {
  checkServerAlive((alive) => {
    if (alive) {
      outputChannel.appendLine('AWEAR dashboard server already running on port 8001.');
      return;
    }
    const pythonPath = path.join(repoRoot, 'venv312', 'bin', 'python3');
    const scriptPath = path.join(repoRoot, 'tools', 'dashboard_server.py');
    try {
      serverProcess = spawn(pythonPath, [scriptPath], { cwd: repoRoot });
      serverProcess.stdout.on('data', (d) => outputChannel.appendLine(d.toString()));
      serverProcess.stderr.on('data', (d) => outputChannel.appendLine(d.toString()));
      serverProcess.on('error', (err) => outputChannel.appendLine('Failed to start dashboard server: ' + err.message));
      outputChannel.appendLine('Started AWEAR dashboard server (pid ' + serverProcess.pid + ').');
    } catch (err) {
      outputChannel.appendLine('Could not spawn dashboard server: ' + err.message);
    }
  });
}

function getWebviewHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://127.0.0.1:8001; style-src 'unsafe-inline';">
<style>html,body{margin:0;padding:0;height:100%;background:#0a0a0e}iframe{width:100%;height:100vh;border:none}</style>
</head>
<body>
<iframe src="http://127.0.0.1:8001/"></iframe>
</body>
</html>`;
}

function openPanel() {
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
  panel.webview.html = getWebviewHtml();
  panel.onDidDispose(() => { panel = null; });
}

function activate(context) {
  const outputChannel = vscode.window.createOutputChannel('AWEAR Dashboard');
  const repoRoot = getRepoRoot();

  if (repoRoot) {
    startServerIfNeeded(repoRoot, outputChannel);
  } else {
    outputChannel.appendLine('No workspace folder open -- open the AWEAR repo folder in VS Code so this extension can find tools/dashboard_server.py.');
  }

  context.subscriptions.push(vscode.commands.registerCommand('awear.openDashboard', openPanel));

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(organization) AWEAR';
  statusBarItem.tooltip = 'פתח את דשבורד החברה של AWEAR';
  statusBarItem.command = 'awear.openDashboard';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

function deactivate() {
  if (serverProcess) serverProcess.kill();
}

module.exports = { activate, deactivate };
