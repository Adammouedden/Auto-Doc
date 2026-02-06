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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const HelloWorldPanel_1 = require("./HelloWorldPanel");
const key_management_1 = require("./key_management");
const VisualizePanel_1 = require("./VisualizePanel");
console.log('AutoDoc extension is loading...');
function activate(context) {
    console.log('Congratulations, your extension "autodoc" is now active!');
    // Doc Gen
    const disposable = vscode.commands.registerCommand('auto_doc.docGen', async () => {
        let apiKey = await (0, key_management_1.getGeminiKey)(context);
        if (!apiKey) {
            await (0, key_management_1.getAndStoreApiKey)(context);
            apiKey = await (0, key_management_1.getGeminiKey)(context);
        }
        if (!apiKey) {
            vscode.window.showErrorMessage('No api key found. Please set your Gemini API key to use this feature.');
            return;
        }
        vscode.window.showInformationMessage('Processing your request for auto-documentation...');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file');
            return;
        }
        const fileUri = editor.document.uri;
        const folderUri = vscode.Uri.joinPath(fileUri, '..');
        console.log("Current file:", fileUri.fsPath);
        console.log("Current file directory:", folderUri.fsPath);
        //Check if user is running linux
        // const isLinux = navigator.userAgent.includes("Linux");
        // let pythonPath = "";
        // if (isLinux){
        // 	pythonPath = "python3";
        // }
        // else{
        // 	pythonPath = "python";	
        // }
        let pythonPath = "python";
        const rawScriptPath = String.raw `doc-generation\dfs_file_traverser.py`;
        const scriptPath = context.asAbsolutePath(rawScriptPath);
        const outputChannel = vscode.window.createOutputChannel("My Extension Logs");
        const process = cp.spawn(pythonPath, [scriptPath, '--filepath', folderUri.fsPath, '--apikey', apiKey], { cwd: folderUri.fsPath });
        // process.stdout.on('data', (data) => console.log(`Python Output: ${data}`));
        // process.stderr.on('data', (data) => console.error(`Python Error: ${data.toString()}`));
        // process.on('error', (err) => console.error('Failed to start process:', err));
        process.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });
        process.stderr.on('data', (data) => {
            outputChannel.append(`Error: ${data.toString()}`);
        });
        outputChannel.show(true);
        process.stderr.on('data', (data) => {
            // Shows errors in a red error notification
            vscode.window.showErrorMessage(`Python Error: ${data.toString()}`);
        });
        vscode.window.showInformationMessage('Documentation generated!');
    });
    context.subscriptions.push(disposable);
    // ML Gen
    const disposable2 = vscode.commands.registerCommand('auto_doc.mlGen', () => {
        HelloWorldPanel_1.HelloWorldPanel.createOrShow(context.extensionUri, context);
    });
    context.subscriptions.push(disposable2);
    // Delete key
    const disposable3 = vscode.commands.registerCommand('auto_doc.delKey', async () => {
        await context.secrets.delete('gemini_api_key');
        vscode.window.showInformationMessage('We deleted your Gemini API key from secure storage.');
    });
    context.subscriptions.push(disposable3);
    // Visualize Code (Ctrl+Shift+S)
    const disposable4 = vscode.commands.registerCommand('auto_doc.visualize', () => {
        VisualizePanel_1.VisualizePanel.createOrShow(context.extensionUri, context);
    });
    context.subscriptions.push(disposable4);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map