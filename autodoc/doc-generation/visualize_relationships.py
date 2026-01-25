from __future__ import annotations

from pathlib import Path
import ast


# ---------------------------------------------------------------------
# Config: root directory to analyze
# ---------------------------------------------------------------------

START_PATH = Path(r"C:\Users\adamm\Documents\PROJECTS\Auto-Doc\test_directory")


# ---------------------------------------------------------------------
# Filesystem + Parsing
# ---------------------------------------------------------------------

def find_python_files(root: Path) -> list[Path]:
    """Return all .py files under root (or the file itself if it's a .py file)."""
    if root.is_file() and root.suffix == ".py":
        return [root]
    if root.is_dir():
        return list(root.rglob("*.py"))
    return []


def parse_python_file(path: Path) -> ast.AST:
    """Parse a Python file into an AST."""
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(path))
    return tree


# ---------------------------------------------------------------------
# Data Structures
# ---------------------------------------------------------------------

class MethodInfo:
    def __init__(self, name: str):
        self.name = name
        self.calls: list[str] = []  # raw call strings


class FunctionInfo:
    def __init__(self, name: str):
        self.name = name
        self.calls: list[str] = []  # raw call strings


class ClassInfo:
    def __init__(self, name: str):
        self.name = name
        self.methods: dict[str, MethodInfo] = {}  # method_name -> MethodInfo


class ModuleInfo:
    def __init__(self, path: Path):
        self.path = path
        # e.g. "sub_directory1.child_three" or "sub_directory1"
        self.imports: list[str] = []
        self.functions: dict[str, FunctionInfo] = {}  # function_name -> FunctionInfo
        self.classes: dict[str, ClassInfo] = {}       # class_name -> ClassInfo


# ---------------------------------------------------------------------
# AST Visitors
# ---------------------------------------------------------------------

def extract_callee_name(func: ast.AST) -> str | None:
    """
    Turn a call target into a simple string:
      foo()                -> "foo"
      mod.func()           -> "mod.func"
      obj.method()         -> "obj.method"
      pkg.mod.func()       -> "pkg.mod.func"
    """
    if isinstance(func, ast.Name):
        return func.id

    if isinstance(func, ast.Attribute):
        parts: list[str] = []
        while isinstance(func, ast.Attribute):
            parts.append(func.attr)
            func = func.value
        if isinstance(func, ast.Name):
            parts.append(func.id)
        return ".".join(reversed(parts))

    return None


class CallVisitor(ast.NodeVisitor):
    """Collects all call expressions inside a function/method."""

    def __init__(self):
        self.calls: list[str] = []

    def visit_Call(self, node: ast.Call):
        callee = extract_callee_name(node.func)
        if callee:
            self.calls.append(callee)
        self.generic_visit(node)


def index_ast(path: Path, tree: ast.AST) -> ModuleInfo:
    """Build a ModuleInfo from an AST."""
    module = ModuleInfo(path)

    for node in tree.body:

        # imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                # e.g. "sub_directory1.child_three"
                module.imports.append(alias.name)

        elif isinstance(node, ast.ImportFrom):
            # e.g. from sub_directory1 import child_three
            # node.module -> "sub_directory1"
            if node.module:
                module.imports.append(node.module)

        # top-level functions
        elif isinstance(node, ast.FunctionDef):
            func = FunctionInfo(node.name)
            visitor = CallVisitor()
            visitor.visit(node)
            func.calls = visitor.calls
            module.functions[node.name] = func

        # classes + methods
        elif isinstance(node, ast.ClassDef):
            class_info = ClassInfo(node.name)
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    method = MethodInfo(item.name)
                    visitor = CallVisitor()
                    visitor.visit(item)
                    method.calls = visitor.calls
                    class_info.methods[item.name] = method
            module.classes[node.name] = class_info

    return module


# ---------------------------------------------------------------------
# Resolution (functions only)
# ---------------------------------------------------------------------

def build_resolution_maps(
    module_index: dict[Path, ModuleInfo]
) -> tuple[dict[str, tuple[Path, str]], dict[str, tuple[Path, str]]]:
    """
    Construct simple lookup tables:
      - local_lookup: function_name -> (module_path, function_name)
      - qualified_lookup: moduleStem.function -> (module_path, function_name)
    """
    local_lookup: dict[str, tuple[Path, str]] = {}
    qualified_lookup: dict[str, tuple[Path, str]] = {}

    for mod_path, mod in module_index.items():
        module_stem = mod_path.stem
        for fname in mod.functions:
            local_lookup[fname] = (mod_path, fname)
            qualified_lookup[f"{module_stem}.{fname}"] = (mod_path, fname)

    return local_lookup, qualified_lookup


def resolve_call(
    raw: str,
    module: ModuleInfo,
    module_index: dict[Path, ModuleInfo],
    local_lookup: dict[str, tuple[Path, str]],
    qualified_lookup: dict[str, tuple[Path, str]],
) -> tuple[Path | str, str]:
    """
    Resolve a raw call string to either:
      - (module_path, function_name)
      - ("external", raw)
    """
    # Rule 1: direct local function
    if raw in module.functions:
        return (module.path, raw)

    # Rule 2: qualified lookup (e.g. "child_three.min_value")
    if raw in qualified_lookup:
        return qualified_lookup[raw]

    # Rule 3: imported module resolution (best effort)
    # Example:
    #   import sub_directory1.child_three
    #   raw = "sub_directory1.child_three.min_value"
    for imp in module.imports:
        if imp and raw.startswith(f"{imp}."):
            suffix = raw[len(imp) + 1 :]  # after "imp."
            # Try to match by module stem (last component of imported module)
            last = imp.split(".")[-1]
            for mod_path, imported_mod in module_index.items():
                if mod_path.stem == last and suffix in imported_mod.functions:
                    return (mod_path, suffix)

    # Rule 4: fallback: external/built-in/unknown
    return ("external", raw)


def resolve_outgoing_dependencies_for_module(
    mod_path: Path,
    module_index: dict[Path, ModuleInfo],
    local_lookup: dict[str, tuple[Path, str]],
    qualified_lookup: dict[str, tuple[Path, str]],
) -> dict[str, list[tuple[Path | str, str]]]:
    """
    Resolve outgoing dependencies for all functions in a single module.
    Returns: dict function_name -> list[(mod_path | 'external', func_or_raw)]
    """
    module = module_index[mod_path]
    resolved: dict[str, list[tuple[Path | str, str]]] = {}

    for fname, finfo in module.functions.items():
        out: list[tuple[Path | str, str]] = []
        for raw in finfo.calls:
            out.append(
                resolve_call(
                    raw,
                    module,
                    module_index,
                    local_lookup,
                    qualified_lookup,
                )
            )
        resolved[fname] = out

    return resolved


# ---------------------------------------------------------------------
# Reachable-module traversal
# ---------------------------------------------------------------------

def build_module_lookup(module_index: dict[Path, ModuleInfo]) -> dict[str, Path]:
    """Map module stem (e.g. 'child_three') -> module path."""
    lookup: dict[str, Path] = {}
    for path in module_index:
        lookup[path.stem] = path
    return lookup


def collect_reachable_modules(
    start_module: Path,
    module_index: dict[Path, ModuleInfo],
) -> tuple[set[Path], dict[Path, dict[str, list[tuple[Path | str, str]]]]]:
    """
    Starting from start_module, recursively traverse:
      - imports
      - cross-module function calls
    Returns:
      visited_modules, resolved_calls_by_module
    """
    module_lookup = build_module_lookup(module_index)
    local_lookup, qualified_lookup = build_resolution_maps(module_index)

    visited: set[Path] = set()
    resolved_by_module: dict[Path, dict[str, list[tuple[Path | str, str]]]] = {}

    stack: list[Path] = [start_module]

    while stack:
        mod_path = stack.pop()
        if mod_path in visited:
            continue

        visited.add(mod_path)
        mod = module_index[mod_path]

        # Resolve this module's outgoing calls (once)
        resolved = resolve_outgoing_dependencies_for_module(
            mod_path, module_index, local_lookup, qualified_lookup
        )
        resolved_by_module[mod_path] = resolved

        # Follow imports
        for imp in mod.imports:
            if not imp:
                continue
            last = imp.split(".")[-1]
            neighbor = module_lookup.get(last)
            if neighbor is not None and neighbor not in visited:
                stack.append(neighbor)

        # Follow cross-module calls
        for calls in resolved.values():
            for (tgt_mod, _tgt_func) in calls:
                if isinstance(tgt_mod, Path) and tgt_mod not in visited:
                    stack.append(tgt_mod)

    return visited, resolved_by_module


# ---------------------------------------------------------------------
# Mermaid Graph Generation (multi-module) w/ styling
# ---------------------------------------------------------------------

def module_node_id(path: Path) -> str:
    return f"mod_{path.stem}"


def function_node_id(path: Path, func_name: str) -> str:
    return f"{path.stem}.{func_name}"


def class_node_id(path: Path, class_name: str) -> str:
    return f"{path.stem}.{class_name}"


def method_node_id(path: Path, class_name: str, method_name: str) -> str:
    return f"{path.stem}.{class_name}.{method_name}"


def external_node_id(raw: str) -> str:
    return f"external.{raw}"


def build_mermaid_graph_multi(
    root_path: Path,
    reachable_modules: set[Path],
    module_index: dict[Path, ModuleInfo],
    resolved_by_module: dict[Path, dict[str, list[tuple[Path | str, str]]]],
) -> str:
    """
    Build a Mermaid 'graph TD' diagram that shows, for all reachable modules:
      - module -> imported modules (if reachable)
      - module -> its functions
      - module -> its classes
      - class -> its methods
      - function -> function calls (intra + cross-module)
      - function -> external calls

    With styling:
      - Modules: light-blue rectangles
      - Functions: dark-gray diamonds
      - External calls: gray rectangles
    """
    lines: list[str] = []
    lines.append("graph TD")

    # Mermaid class styling
    lines.append("%% Node Styling Classes")
    lines.append("classDef module fill:#80c7ff,stroke:#1e90ff,color:#000,font-weight:bold;")
    lines.append("classDef func fill:#333,stroke:#666,color:#fff,stroke-width:1px;")
    lines.append("classDef external fill:#777,stroke:#aaa,color:#fff;")
    lines.append("classDef class fill:#555,stroke:#888,color:#fff;")
    lines.append("classDef method fill:#444,stroke:#777,color:#fff;")

    module_lookup = build_module_lookup(module_index)

    # 1) Module nodes and structure (functions, classes, methods)
    for mod_path in reachable_modules:
        mod = module_index[mod_path]
        mod_node = module_node_id(mod_path)

        # module label
        if mod_path == root_path:
            lines.append(f'    {mod_node}["{mod_path.stem}.py (root)"]')
        else:
            lines.append(f'    {mod_node}["{mod_path.stem}.py"]')
        lines.append(f"class {mod_node} module")

        # imports (only link to reachable modules)
        for imp in mod.imports:
            if not imp:
                continue
            last = imp.split(".")[-1]
            if last in module_lookup:
                imported_path = module_lookup[last]
                if imported_path in reachable_modules:
                    imported_node = module_node_id(imported_path)
                    lines.append(f'    {imported_node}["{imported_path.stem}.py"]')
                    lines.append(f"class {imported_node} module")
                    lines.append(f"    {mod_node} --> {imported_node}")

        # functions
        for fname in mod.functions:
            func_node = function_node_id(mod_path, fname)
            # Diamonds for functions: {{ }} or { "" } in Mermaid
            lines.append(f'    {func_node}{{"{fname}()"}}')
            lines.append(f"    {mod_node} --> {func_node}")
            lines.append(f"class {func_node} func")

        # classes + methods
        for cls_name, cls_info in mod.classes.items():
            cls_node = class_node_id(mod_path, cls_name)
            lines.append(f'    {cls_node}["class {cls_name}"]')
            lines.append(f"    {mod_node} --> {cls_node}")
            lines.append(f"class {cls_node} class")

            for m_name in cls_info.methods:
                meth_node = method_node_id(mod_path, cls_name, m_name)
                lines.append(f'    {meth_node}["{cls_name}.{m_name}()"]')
                lines.append(f"    {cls_node} --> {meth_node}")
                lines.append(f"class {meth_node} method")

    # 2) Function call edges (resolved) for all reachable modules
    for mod_path in reachable_modules:
        mod_resolved = resolved_by_module.get(mod_path, {})
        for src_func, calls in mod_resolved.items():
            src_node = function_node_id(mod_path, src_func)

            for (tgt_mod, tgt_func) in calls:
                if tgt_mod == "external":
                    ext_node = external_node_id(tgt_func)
                    lines.append(f'    {ext_node}["{tgt_func} (external)"]')
                    lines.append(f"class {ext_node} external")
                    lines.append(f"    {src_node} --> {ext_node}")
                else:
                    assert isinstance(tgt_mod, Path)
                    tgt_node = function_node_id(tgt_mod, tgt_func)
                    # ensure target node exists and is styled as a function
                    lines.append(f'    {tgt_node}{{"{tgt_func}()"}}')
                    lines.append(f"class {tgt_node} func")
                    lines.append(f"    {src_node} --> {tgt_node}")

    return "\n".join(lines)


def build_html_with_mermaid_multi(
    root_path: Path,
    reachable_modules: set[Path],
    module_index: dict[Path, ModuleInfo],
    resolved_by_module: dict[Path, dict[str, list[tuple[Path | str, str]]]],
) -> str:
    """Wrap the Mermaid graph in a dark-themed HTML page."""
    graph = build_mermaid_graph_multi(root_path, reachable_modules, module_index, resolved_by_module)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Function Relationships (root: {root_path.stem}.py)</title>
    <style>
        body {{
            background: #111;
            color: #ddd;
            padding: 10px;
            font-family: sans-serif;
        }}
    </style>
    <script type="module">
        import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
        mermaid.initialize({{
            startOnLoad: true,
            theme: "dark",
            themeVariables: {{
                primaryColor: "#80c7ff",
                primaryBorderColor: "#1e90ff",
                secondaryColor: "#333",
                tertiaryColor: "#222",
                fontSize: "14px"
            }}
        }});
    </script>
</head>
<body>
<div class="mermaid">
{graph}
</div>
</body>
</html>
"""
    return html


# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------

def main() -> None:
    python_files = find_python_files(START_PATH)
    if not python_files:
        print(f"No Python files found under: {START_PATH}")
        return

    ast_by_file: dict[Path, ast.AST] = {}
    for py_file in python_files:
        tree = parse_python_file(py_file)
        ast_by_file[py_file] = tree

    # Debug: show top-level statement counts
    for path, tree in ast_by_file.items():
        print(f"{path}: {len(tree.body)} top-level statements")

    # Index modules
    module_index: dict[Path, ModuleInfo] = {}
    for path, tree in ast_by_file.items():
        module_index[path] = index_ast(path, tree)

    # Debug: raw calls
    for path, mod in module_index.items():
        print(f"\n{path}")
        for f, info in mod.functions.items():
            print("  func", f, "calls raw:", info.calls)
        for cls in mod.classes.values():
            for m, minfo in cls.methods.items():
                print("  class", cls.name, "method", m, "calls raw:", minfo.calls)

    # Pick a target file (replace with VS Code active file later if needed)
    target_file = next(iter(module_index.keys()))
    print(f"\nUsing target file: {target_file}")

    # Recursively traverse imports + cross-module calls
    reachable, resolved_by_module = collect_reachable_modules(target_file, module_index)

    print("\nReachable modules from:", target_file)
    for m in reachable:
        print("  ", m)

    print("\nMermaid Graph (multi-module):\n")
    graph_text = build_mermaid_graph_multi(target_file, reachable, module_index, resolved_by_module)
    print(graph_text)

    # Write HTML
    html = build_html_with_mermaid_multi(target_file, reachable, module_index, resolved_by_module)
    out_path = target_file.with_suffix(".relationships.html")
    out_path.write_text(html, encoding="utf-8")
    print(f"\nWrote HTML to: {out_path}")


if __name__ == "__main__":
    main()
