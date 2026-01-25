import * as vscode from "vscode";
import * as cp from "child_process";
import { getNonce } from "./getNonce";
import { getAndStoreApiKey, getGeminiKey } from "./key_management";

export class HelloWorldPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: HelloWorldPanel | undefined;

  public static readonly viewType = "hello-world";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  
  public context: vscode.ExtensionContext;

  private _apikey: string;

  public static async createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    let apiKey = await getGeminiKey(context);
    
    if (!apiKey) {
        await getAndStoreApiKey(context);
        apiKey = await getGeminiKey(context); // Try again after saving
    }

    if (!apiKey) {
        vscode.window.showErrorMessage('No api key found. Please set your Gemini API key to use this feature.'); 	
        return;
    }

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    
    // If we already have a panel, show it.
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(column);
      HelloWorldPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      HelloWorldPanel.viewType,
      "Auto-Documentation",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, context, apiKey);
  }

  public static kill() {
    HelloWorldPanel.currentPanel?.dispose();
    HelloWorldPanel.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext, apikey: string) {
    HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, context, apikey);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext, apikey: string) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._apikey = apikey;

    this.context = context;

    vscode.window.showInformationMessage('Processing your request for a machine learning diagram...');

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // // Handle messages from the webview
    // this._panel.webview.onDidReceiveMessage(
    //   (message) => {
    //     switch (message.command) {
    //       case "alert":
    //         vscode.window.showErrorMessage(message.text);
    //         return;
    //     }
    //   },
    //   null,
    //   this._disposables
    // );
  }

  public dispose() {
    HelloWorldPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    // Loading current window
    const editor = vscode.window.activeTextEditor;
    console.log("Current editor window:", editor);

    // Returns early if no editor window found
    if (!editor) {
      vscode.window.showErrorMessage("No active editor window");
      return;
    }

    // Loading current file and directory URI
    const fileUri = editor.document.uri;
    const folderUri = vscode.Uri.joinPath(fileUri, '..');
    
    console.log("Current file:", fileUri.fsPath);
    console.log("Current file directory:", folderUri.fsPath);

    const pythonPath = "python";
    let rawScriptPath: string = String.raw`ml-diagram\file_classifier.py`
    const scriptPath = this.context.asAbsolutePath(rawScriptPath);

    const process = cp.spawn(pythonPath, [scriptPath, "--filepath", fileUri.fsPath, "--apikey", this._apikey], {
      cwd: folderUri.fsPath
    }); 

    let stdout = "";
    let stderr = "";
    
    process.stdout.on("data", (d) => { stdout += d.toString(); });
    process.stderr.on("data", (d) => { stderr += d.toString(); });

    process.on("close", (code) => {
        if (code !== 0) {
          console.log(`Python exited with code ${code}: ${stderr}`);
          //vscode.window.showErrorMessage(`Python exited with code ${code}: ${stderr}`);
          return;
        }

        let payload: any;
        try {
          payload = JSON.parse(stdout);
        } catch (e) {
          console.error("Failed to parse Python JSON:", e);
          //vscode.window.showErrorMessage(`Failed to parse Python JSON. stderr: ${stderr}`);
          return;
        }

        if (!payload.ok || !payload.svg) {
          console.error("No SVG produced.");
          //vscode.window.showErrorMessage("No SVG produced.");
          return;
        }

        // Send SVG to the webview
        this._panel.webview.postMessage({
          type: "renderSvg",
          svg: payload.svg
        });
        // Optional: save to user folder
      // (example path: diagrams/diagram.svg)
    });
    
    process.stdout.on('data', (data) => {
      console.log(`Python Output: ${data}`);  
      //vscode.window.showInformationMessage(`Python says: ${data}`);
    });

    // ADD THIS: Catch Python's internal errors (like FileNotFoundError)
    process.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString()}`);
        //vscode.window.showErrorMessage(`Python Error: ${data.toString()}`);
    });

    // ADD THIS: Catch system errors (like "python3 command not found")
    process.on('error', (err) => {
        console.error('Failed to start process:', err);
        //vscode.window.showErrorMessage(`Process error: ${err.message}`);
    });

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          console.log(data.value);
          //vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          console.error(data.value);
          //vscode.window.showErrorMessage(data.value);
          break;
        }
        //case "tokens": {
          //await Util.globalState.update(accessTokenKey, data.accessToken);
          //await Util.globalState.update(refreshTokenKey, data.refreshToken);
          //break;
        //}
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
      <div id="root"></div>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
        </script>
			</head>
            <body>
	        </body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
	</html>`;
  }
}