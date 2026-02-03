import * as vscode from 'vscode';
import * as cp from 'child_process';
import { HelloWorldPanel } from './HelloWorldPanel';
import { getAndStoreApiKey, getGeminiKey } from './key_management';
import { VisualizePanel } from './VisualizePanel';

console.log('AutoDoc extension is loading...');

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "autodoc" is now active!');

	// Delete key
	const disposable3 = vscode.commands.registerCommand('autodoc.delKey', async () => {
		await context.secrets.delete('gemini_api_key');
		vscode.window.showInformationMessage('We deleted your Gemini API key from secure storage.');
	});
	context.subscriptions.push(disposable3);

	// Doc Gen
	const disposable = vscode.commands.registerCommand('autodoc.docGen', async () => {
		let apiKey = await getGeminiKey(context);

		if (!apiKey) {
			await getAndStoreApiKey(context);
			apiKey = await getGeminiKey(context);
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

		const pythonPath = "python";
		const rawScriptPath = String.raw`doc-generation\dfs_file_traverser.py`;
		const scriptPath = context.asAbsolutePath(rawScriptPath);

		const process = cp.spawn(pythonPath, [scriptPath, '--filepath', folderUri.fsPath, '--apikey', apiKey], { cwd: folderUri.fsPath });

		process.stdout.on('data', (data) => console.log(`Python Output: ${data}`));
		process.stderr.on('data', (data) => console.error(`Python Error: ${data.toString()}`));
		process.on('error', (err) => console.error('Failed to start process:', err));
	});
	context.subscriptions.push(disposable);

	// ML Gen
	const disposable2 = vscode.commands.registerCommand('autodoc.mlGen', () => {
		HelloWorldPanel.createOrShow(context.extensionUri, context);
	});
	context.subscriptions.push(disposable2);

	// Visualize Code (Ctrl+Shift+S)
	const disposable4 = vscode.commands.registerCommand('autodoc.visualize', () => {
		VisualizePanel.createOrShow(context.extensionUri, context);
	});
	context.subscriptions.push(disposable4);
}

export function deactivate() {}
