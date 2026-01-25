import * as vscode from 'vscode';

export async function getAndStoreApiKey(context: vscode.ExtensionContext) {
    const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Gemini API Key",
        placeHolder: "AIza...",
        password: true, // This hides the characters as they type
        ignoreFocusOut: true
    });

    if (apiKey) {
        // Store it securely
        await context.secrets.store('gemini_api_key', apiKey);
        vscode.window.showInformationMessage("Gemini API Key saved securely.");
    }
}

export async function getGeminiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get('gemini_api_key');
}