import * as vscode from 'vscode';
import * as cp from 'child_process';

console.log('AutoDoc extension is loading...');

export function activate(context: vscode.ExtensionContext) {
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
		
		console.log("Current file:", fileUri.fsPath);
		console.log("Current file directory:", folderUri.fsPath);

		// Find the user's python path (important for Linux/Kubuntu)
        const pythonPath = "python"; 
		let rawScriptPath: string = String.raw`doc-generation\dfs_file_traverser.py`
        const scriptPath = context.asAbsolutePath(rawScriptPath);

        const process = cp.spawn(pythonPath, [scriptPath, '--filepath', fileUri.fsPath], { cwd: folderUri.fsPath });

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
}