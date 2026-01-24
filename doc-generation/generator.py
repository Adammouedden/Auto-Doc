from pathlib import Path

current_directory= Path('.')
ignore_list = {".git", ".gitignore", ".vscode"}

def is_leaf_directory(directory: Path)->bool:
    for item in directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):
            return False
    return True

def generate_doc(directory):
    for item in directory.iterdir():
        if item.name in ignore_list:
            continue
        print(item)
        # TODO: write leaf doc
    

def generate_doc_from_doc(directory: Path):
    # TODO: aggregate child docs into this directory's doc
    print(f"Aggregating for: {directory}")

def depth_traversal(current_directory: Path):

    if current_directory.name in ignore_list:
        return
    
    if is_leaf_directory(current_directory):
        generate_doc(current_directory)
        return 

    for item in current_directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):
            depth_traversal(item)

    generate_doc_from_doc(current_directory)

depth_traversal(current_directory)             
        