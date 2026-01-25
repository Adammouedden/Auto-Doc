// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();
    window.addEventListener("message", (event) => {
        const message = event.data;

        if (message.type === "renderSvg") {
            const root = document.getElementById("root");
            if (!root) return;

            // Basic safety: strip scripts and foreignObject
            const svg = String(message.svg)
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "");

            root.innerHTML = svg;
        }
    });
    
    console.log('Hello from webview script!');

}());
