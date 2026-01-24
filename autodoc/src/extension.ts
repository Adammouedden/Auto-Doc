// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

console.log('AutoDoc extension is loading...');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "autodoc" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('autodoc.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		console.log("damn");
		vscode.window.showInformationMessage('Hello World from autoDoc!');
		vscode.window.showInformationMessage('Eat my buttcheeks');
		
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
	});

	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}
