from pathlib import Path

current_directory= Path('test_directory')
ignore_list = {".git", ".gitignore", ".vscode"}

def is_leaf_directory(directory: Path)->bool:
    for item in directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):  
            return False
    return True

def generate_doc(directory: Path):

    print(f"doc for {directory}")

    for item in directory.iterdir():
        text = get_item_text(item)
        print(text)
        print("\n")
        # TODO: write leaf doc
    

def generate_doc_from_child(directory: Path):
    # TODO: aggregate child docs into this directory's doc
    print(f"Aggregating for: {directory}")

    for item in directory.iterdir():
        if(item.is_dir()) and item.name not in ignore_list:
            get_dir_doc(item)
        else:
            text= get_item_text(item)
            print(text)
            print("\n")
            

def get_item_text(item:Path)->str:  
    #TODO: Read from files in the directory that are not other directories and not in the ignore list
        if item.name not in ignore_list:
            print(f"\t {item.parent}: {item.name}") # read the file 

            if item.is_file():
                with item.open( "r", encoding="utf-8") as f:
                    text= f.read()
                return text    


def get_dir_doc(directory: Path):
    #TODO: get directory documentation and return it
    return

def depth_traversal(current_directory: Path):

    if current_directory.name in ignore_list:
        return
    
    if is_leaf_directory(current_directory):
        generate_doc(current_directory)
        return 

    for item in current_directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):
            depth_traversal(item)

    generate_doc_from_child(current_directory)

depth_traversal(current_directory)             
        