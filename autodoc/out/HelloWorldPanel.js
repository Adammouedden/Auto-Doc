"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloWorldPanel = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const getNonce_1 = require("./getNonce");
class HelloWorldPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    static currentPanel;
    static viewType = "hello-world";
    _panel;
    _extensionUri;
    _disposables = [];
    _readmes = [];
    context;
    static createOrShow(extensionUri, context) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (HelloWorldPanel.currentPanel) {
            HelloWorldPanel.currentPanel._panel.reveal(column);
            HelloWorldPanel.currentPanel._update();
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(HelloWorldPanel.viewType, "Auto-Documentation", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media"),
                vscode.Uri.joinPath(extensionUri, "out/compiled"),
            ],
        });
        HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, context);
    }
    static kill() {
        HelloWorldPanel.currentPanel?.dispose();
        HelloWorldPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri, context) {
        HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, context);
    }
    constructor(panel, extensionUri, context) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.context = context;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //   (message) => {
        //     switch (message.command) {
        //       case "alert":
        //         vscode.window.showErrorMessage(message.text);
        //         return;
        //     }
        //   },
        //   null,
        //   this._disposables
        // );
    }
    dispose() {
        HelloWorldPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    async _update() {
        const webview = this._panel.webview;
        // Loading current window
        const editor = vscode.window.activeTextEditor;
        console.log("Current editor window:", editor);
        // Returns early if no editor window found
        if (!editor) {
            vscode.window.showErrorMessage("No active editor window");
            return;
        }
        // Loading current file and directory URI
        const fileUri = editor.document.uri;
        const folderUri = vscode.Uri.joinPath(fileUri, '..');
        console.log("Current file:", fileUri.fsPath);
        console.log("Current file directory:", folderUri.fsPath);
        const pythonPath = "python";
        let rawScriptPath = String.raw `doc-generation\class_finder.py`;
        const scriptPath = this.context.asAbsolutePath(rawScriptPath);
        const proccess = cp.spawn(pythonPath, [scriptPath, "--filepath", fileUri.fsPath], {
            cwd: folderUri.fsPath
        });
        let stdout = "";
        let stderr = "";
        proccess.stdout.on("data", (d) => { stdout += d.toString(); });
        proccess.stderr.on("data", (d) => { stderr += d.toString(); });
        proccess.on("close", (code) => {
            if (code !== 0) {
                vscode.window.showErrorMessage(`Python exited with code ${code}: ${stderr}`);
                return;
            }
            let payload;
            try {
                payload = JSON.parse(stdout);
            }
            catch (e) {
                vscode.window.showErrorMessage(`Failed to parse Python JSON. stderr: ${stderr}`);
                return;
            }
            if (!payload.ok || !payload.svg) {
                vscode.window.showErrorMessage("No SVG produced.");
                return;
            }
            // Send SVG to the webview
            this._panel.webview.postMessage({
                type: "renderSvg",
                svg: payload.svg
            });
            // Optional: save to user folder
            // (example path: diagrams/diagram.svg)
        });
        process.stdout.on('data', (data) => {
            vscode.window.showInformationMessage(`Python says: ${data}`);
        });
        // ADD THIS: Catch Python's internal errors (like FileNotFoundError)
        process.stderr.on('data', (data) => {
            console.error(`Python Error: ${data.toString()}`);
            vscode.window.showErrorMessage(`Python Error: ${data.toString()}`);
        });
        // ADD THIS: Catch system errors (like "python3 command not found")
        process.on('error', (err) => {
            console.error('Failed to start process:', err);
            vscode.window.showErrorMessage(`Process error: ${err.message}`);
        });
        //this._readmes.push()
        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                //case "tokens": {
                //await Util.globalState.update(accessTokenKey, data.accessToken);
                //await Util.globalState.update(refreshTokenKey, data.refreshToken);
                //break;
                //}
            }
        });
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "media", "reset.css");
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css");
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        // Use a nonce to only allow specific scripts to be run
        const nonce = (0, getNonce_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
      <div id="root"></div>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
        </script>
			</head>
            <body>
                <h1>Hello my world</h1>
                <button onclick="alert('Hello world!')">Click me</button>
	        </body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
	</html>`;
    }
}
exports.HelloWorldPanel = HelloWorldPanel;
//# sourceMappingURL=HelloWorldPanel.js.map