import * as vscode from "vscode";
import * as cp from "child_process";
import { getGeminiKey, getAndStoreApiKey } from "./key_management";
import { getNonce } from "./getNonce";

export class VisualizePanel {
    public static currentPanel: VisualizePanel | undefined;
    public static readonly viewType = "visualize-code-panel";

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly disposables: vscode.Disposable[] = [];
    private readonly context: vscode.ExtensionContext;
    private apiKey: string;

    public static async createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        let apiKey = await getGeminiKey(context);
        if (!apiKey) {
            await getAndStoreApiKey(context);
            apiKey = await getGeminiKey(context);
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

        const panel = vscode.window.createWebviewPanel(
            VisualizePanel.viewType,
            "AutoDoc Visualization",
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media")
                ]
            }
        );

        VisualizePanel.currentPanel = new VisualizePanel(panel, extensionUri, context, apiKey);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext, apiKey: string) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.context = context;
        this.apiKey = apiKey;

        this.update();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public dispose() {
        VisualizePanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d) d.dispose();
        }
    }

    private async update() {
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
        const scriptPath = this.context.asAbsolutePath(
            String.raw`doc-generation/code_visualizer.py`
        );

        // *** NEW: absolute prompt path workaround ***
        const promptPath = this.context.asAbsolutePath(
            String.raw`doc-generation/visualizer_sys_prompt.txt`
        );

        let stdout = "";
        let stderr = "";

        const py = cp.spawn(
            pythonPath,
            [
                scriptPath,
                "--code",
                code,
                "--apikey",
                this.apiKey,
                "--prompt",
                promptPath       // <-- pass absolute prompt path
            ],
            { cwd: folderUri.fsPath } // <-- saves visualization.html to user's folder
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

    private wrapHtml(inner: string): string {
        const nonce = getNonce();
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
