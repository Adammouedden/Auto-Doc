# AutoDoc Extension

Auto Doc helps developers rapidly understand unfamiliar codebases by automatically summarizing files, documenting logic, and generating structural figures on demand. Designed for fast, folder-by-folder exploration of a repository.

## Features

- Summarizes code files and directories
- Generates documentation to explain structure and behavior
- Produces figures and visualizations for ML-related code
- Folder-aware execution for context-based documentation
- Clean output, optimized for developers inspecting large repos

## Commands

| Command | Description |
|--------|-------------|
| `Doc Gen` | Generate documentation for the current directory |
| `ML Gen` | Generate ML-specific figures and summaries |
| `Delete API Key` | Clear stored API keys used by the extension |
| `Doc Visualize` | AI Generated Visualization of Code Logic |


## Keybindings

| Keybinding | Action |
|-----------|--------|
| `Ctrl + Shift + A` | Run `Doc Gen` |
| `Ctrl + Shift + M` | Run `ML Gen` |
| `Ctrl + Shift + H` | Run `Delete API Key` |
| `Ctrl + Shift + S` | Run `Doc Visualize` |

Keybindings only activate when the editor is focused.

## Usage

1. Open a file or folder in VS Code.
2. Trigger one of the commands via:
   - Command Palette (`Ctrl + Shift + P`), or
   - The keybindings listed above.
3. Auto Doc processes context and outputs structured summaries and figures.

## Suggested Workflow

- Start in a top-level directory to get a high-level summary.
- Drill down into subfolders to explore behavior and architecture.
- Use `ML Gen` on model/ML directories for specialized analysis.

## Future Enhancements

- Expanded language support
- Richer interactivity and visual navigation
- Better ML model graphing and dependency tracing
