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

		//console.log('Current file:', fileUri.fsPath);
		console.log('Current file directory:', folderUri.fsPath);

		// Find the user's python path (important for Linux/Kubuntu)
        const pythonPath = "python"; 
        const scriptPath = context.asAbsolutePath('extension.py');

        const process = cp.spawn(pythonPath, [scriptPath, "arg1"]);

        process.stdout.on('data', (data) => {
            vscode.window.showInformationMessage(`Python says: ${data}`);
        });
	});

	context.subscriptions.push(disposable);
}