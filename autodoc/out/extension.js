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
console.log('AutoDoc extension is loading...');
function activate(context) {
    console.log('Congratulations, your extension "autodoc" is now active!');
    const disposable3 = vscode.commands.registerCommand('autodoc.delKey', async () => {
        // To delete the key
        await context.secrets.delete('gemini_api_key');
        vscode.window.showInformationMessage('We deleted your Gemini API key from secure storage.');
    });
    context.subscriptions.push(disposable3);
    const disposable = vscode.commands.registerCommand('autodoc.docGen', async () => {
        let apiKey = await (0, key_management_1.getGeminiKey)(context);
        if (!apiKey) {
            await (0, key_management_1.getAndStoreApiKey)(context);
            apiKey = await (0, key_management_1.getGeminiKey)(context); // Try again after saving
        }
        if (!apiKey) {
            vscode.window.showErrorMessage('No api key found. Please set your Gemini API key to use this feature.');
            return;
        }
        vscode.window.showInformationMessage('Hello World from autoDoc!');
        //Access the activeTextEditor to find out what file we are currently in
        const editor = vscode.window.activeTextEditor;
        //Exception handling for if the editor is not open
        if (!editor) {
            vscode.window.showErrorMessage('No active file');
            return;
        }
        //Get the fileURI for the document we have currently opened, along with the folder URI by using the reference to the parent directory '..'
        const fileUri = editor.document.uri;
        const folderUri = vscode.Uri.joinPath(fileUri, '..');
        console.log("Current file:", fileUri.fsPath);
        console.log("Current file directory:", folderUri.fsPath);
        // Find the user's python path (important for Linux/Kubuntu)
        const pythonPath = "python";
        let rawScriptPath = String.raw `doc-generation\dfs_file_traverser.py`;
        const scriptPath = context.asAbsolutePath(rawScriptPath);
        console.log(scriptPath);
        const process = cp.spawn(pythonPath, [scriptPath, '--filepath', folderUri.fsPath, '--apikey', apiKey], { cwd: folderUri.fsPath });
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
    });
    context.subscriptions.push(disposable);
    const disposable2 = vscode.commands.registerCommand('autodoc.mlGen', () => {
        HelloWorldPanel_1.HelloWorldPanel.createOrShow(context.extensionUri, context);
    });
    context.subscriptions.push(disposable2);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map