import * as vscode from 'vscode';
import * as cp from 'child_process';
import { HelloWorldPanel } from './HelloWorldPanel';
import { getAndStoreApiKey, getGeminiKey } from './key_management';
import { VisualizePanel } from './VisualizePanel';

console.log('AutoDoc extension is loading...');

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "autodoc" is now active!');

	// Doc Gen
	const disposable = vscode.commands.registerCommand('auto_doc.docGen', async () => {
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
	});
	context.subscriptions.push(disposable);

	// ML Gen
	const disposable2 = vscode.commands.registerCommand('auto_doc.mlGen', () => {
		HelloWorldPanel.createOrShow(context.extensionUri, context);
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
		VisualizePanel.createOrShow(context.extensionUri, context);
	});
	context.subscriptions.push(disposable4);
}

export function deactivate() {}
