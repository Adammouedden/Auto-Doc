from pathlib import Path
import text_generator
import argparse

import sys
sys.stdout.reconfigure(write_through=True)


DEBUG_MODE = True


ignore_list = {".git", ".gitignore", ".vscode", "node_modules", "__pycache__", "<frozen codecs>"}
TEXT_EXTENSIONS = {".py", ".js", ".ts", ".md", ".txt", ".java", ".cpp", ".json", ".txt", ".c"}
INVALID_FILES = {
    ".jpeg", ".jpg", ".png", ".gif", ".bmp", ".ico",
    ".pdf", ".zip", ".tar", ".gz", ".7z",
    ".exe", ".dll", ".so", ".bin",
    ".db", ".sqlite", ".ttf", ".woff", ".woff2"
}

def is_text_file(path: Path):
    return path.suffix.lower() in TEXT_EXTENSIONS


def is_leaf_directory(directory: Path)->bool:
    for item in directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):  
            return False
    return True

def is_generated_readme(item: Path) -> bool:
    return item.is_file() and item.name == f"{item.parent.name}README.md"


def generate_doc(directory: Path, apikey: str):
    #print(f"doc for {directory}")
    

    text=[""]

    for item in directory.iterdir():
        if item.name in ignore_list or item.suffix in INVALID_FILES:
            continue
        if is_generated_readme(item):
            continue
        text.append(f"file name: {item.name} in directory: {directory.name}")

        content = get_item_text(item)
        if content:
            text.append(content)
    
    prompt_input = "\n".join(text)
    md_doc_text= text_generator.llm_response(0, prompt_input, apikey)

    md_path= directory/"README.md"

    #DEBUG MODE COMMENT
    if DEBUG_MODE:
        print(f"Writing to: {md_path}", flush=True)
    
    with md_path.open('w', encoding='utf-8', errors='ignore') as file:
        file.write(md_doc_text)
        

def generate_doc_from_child(directory: Path, apikey: str):
    # TODO: aggregate child docs into this directory's doc
    #print(f"Aggregating for: {directory}")

    text = [""]

    for item in directory.iterdir():
        if item.name in ignore_list:
            continue
        if is_generated_readme(item):
            continue

        if(item.is_dir()) and item.name not in ignore_list:
            text.append(f"child directory name: {item.name} in directory: {directory.name}")
            text.append(get_dir_doc(item))
            
        else:   
            text.append(f"file name: {item.name} in directory: {directory.name}")
            text.append(get_item_text(item))
        
    prompt_input = "\n".join(text)
    md_doc_text = text_generator.llm_response(0, prompt_input, apikey)

    md_path= directory/"README.md"

    #DEBUG MODE COMMENT
    if DEBUG_MODE:
        print(f"Writing to: {md_path}", flush=True)

    with md_path.open('w', encoding='utf-8', errors='ignore') as file:
        file.write(md_doc_text)


def get_dir_doc(directory: Path):
    md_path = directory / "README.md"

    if DEBUG_MODE:
        print(f"Reading from: {md_path}", flush=True)

    if not md_path.exists() or not md_path.is_file():
        return ""

    

    try:
        with md_path.open("r", encoding="utf-8", errors="ignore") as f:
            return f.read() or ""
    except Exception:
        return ""


def get_item_text(item:Path)->str:  
    if item.name in ignore_list:
        return ""
    
    if not item.is_file():
        return ""
    
    if not is_text_file(item):
        return ""
    
    ext = item.suffix.lower()
    if ext in INVALID_FILES:
        if DEBUG_MODE:
            print(f"Skipping invalid file type: {item}")
        return ""
    
    try:
        with item.open("r", encoding="utf-8") as f:
            return f.read() or ""
        
    except UnicodeDecodeError:
        return ""
            

def depth_traversal(current_directory: Path, apikey: str):
    if current_directory.name in ignore_list:
        return

    if not current_directory.is_dir():
        return
    
    if is_leaf_directory(current_directory):
        generate_doc(current_directory, apikey)
        return 

    for item in current_directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):
            depth_traversal(item, apikey)

    generate_doc_from_child(current_directory, apikey)


def main():
    parser = argparse.ArgumentParser(description="AutoDoc relative file path for current working directory")
    parser.add_argument("--filepath", type=str, default="")
    parser.add_argument("--apikey", type=str, default="")
    parseargs = parser.parse_args()

    current_directory= Path(parseargs.filepath)
    apikey = parseargs.apikey
    #current_directory = Path(r"C:\Users\hello\Auto-Doc\test_directory")
    depth_traversal(current_directory, apikey) 

    print("Completed Auto Doc")             

main()          
        