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
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
console.log('AutoDoc extension is loading...');
function activate(context) {
    console.log('Congratulations, your extension "autodoc" is now active!');
    const disposable = vscode.commands.registerCommand('autodoc.helloWorld', () => {
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
        //console.log('Current file:', fileUri.fsPath);
        console.log('Current file directory:', folderUri.fsPath);
        // Find the user's python path (important for Linux/Kubuntu)
        const pythonPath = "python";
        const scriptPath = context.asAbsolutePath('doc-generation\generator.py');
        const process = cp.spawn(pythonPath, [scriptPath]);
        process.stdout.on('data', (data) => {
            vscode.window.showInformationMessage(`Python says: ${data}`);
        });
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=extension.js.map