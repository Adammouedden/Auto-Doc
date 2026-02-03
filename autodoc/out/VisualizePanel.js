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
exports.VisualizePanel = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const key_management_1 = require("./key_management");
const getNonce_1 = require("./getNonce");
class VisualizePanel {
    static currentPanel;
    static viewType = "visualize-code-panel";
    panel;
    extensionUri;
    disposables = [];
    context;
    apiKey;
    static async createOrShow(extensionUri, context) {
        let apiKey = await (0, key_management_1.getGeminiKey)(context);
        if (!apiKey) {
            await (0, key_management_1.getAndStoreApiKey)(context);
            apiKey = await (0, key_management_1.getGeminiKey)(context);
        }
        if (!apiKey) {
            vscode.window.showErrorMessage("No Gemini API key found. Please set it first.");
            return;
        }
        const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
        if (VisualizePanel.currentPanel) {
            VisualizePanel.currentPanel.panel.reveal(column);
            VisualizePanel.currentPanel.update();
            return;
        }
        const panel = vscode.window.createWebviewPanel(VisualizePanel.viewType, "AutoDoc Visualization", column, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media")
            ]
        });
        VisualizePanel.currentPanel = new VisualizePanel(panel, extensionUri, context, apiKey);
    }
    constructor(panel, extensionUri, context, apiKey) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.context = context;
        this.apiKey = apiKey;
        this.update();
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }
    dispose() {
        VisualizePanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d)
                d.dispose();
        }
    }
    async update() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor.");
            return;
        }
        const fileUri = editor.document.uri;
        const folderUri = vscode.Uri.joinPath(fileUri, "..");
        const code = editor.document.getText();
        const pythonPath = "python";
        // Absolute path to python script
        const scriptPath = this.context.asAbsolutePath(String.raw `doc-generation/code_visualizer.py`);
        // *** NEW: absolute prompt path workaround ***
        const promptPath = this.context.asAbsolutePath(String.raw `doc-generation/visualizer_sys_prompt.txt`);
        let stdout = "";
        let stderr = "";
        const py = cp.spawn(pythonPath, [
            scriptPath,
            "--code",
            code,
            "--apikey",
            this.apiKey,
            "--prompt",
            promptPath // <-- pass absolute prompt path
        ], { cwd: folderUri.fsPath } // <-- saves visualization.html to user's folder
        );
        py.stdout.on("data", (d) => stdout += d.toString());
        py.stderr.on("data", (d) => stderr += d.toString());
        py.on("close", (code) => {
            if (code !== 0) {
                console.error("Python error:", stderr);
                vscode.window.showErrorMessage("Python failed. Check console.");
                return;
            }
            const htmlOut = stdout.trim();
            if (!htmlOut) {
                vscode.window.showErrorMessage("No HTML returned from Python.");
                return;
            }
            this.panel.webview.html = this.wrapHtml(htmlOut);
        });
        py.on("error", (err) => {
            console.error("Spawn error:", err);
            vscode.window.showErrorMessage(err.message);
        });
        this.panel.webview.html = `<html><body>Generating visualization...</body></html>`;
    }
    wrapHtml(inner) {
        const nonce = (0, getNonce_1.getNonce)();
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="Content-Security-Policy"
                content="
                    default-src 'none';
                    img-src data: https:;
                    style-src 'unsafe-inline';
                    script-src 'nonce-${nonce}';
                ">
        </head>
        <body>
            ${inner}
        </body>
        </html>
        `;
    }
}
exports.VisualizePanel = VisualizePanel;
//# sourceMappingURL=VisualizePanel.js.map