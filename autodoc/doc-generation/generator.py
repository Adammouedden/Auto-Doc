from pathlib import Path
import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    filename="app.log",
    filemode="a"
)

left, right = (0, 0)

logging.info("")


ignore_list = {".git", ".gitignore", ".vscode"}

def is_leaf_directory(directory: Path)->bool:
    for item in directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):  
            return False
    return True

def generate_doc(directory: Path):

    print(f"doc for {directory}")
    
    md_path= directory/f"{directory.name}README.md"

    with md_path.open('w') as file:
        for item in directory.iterdir():
            text = get_item_text(item)
            file.write(text)
            file.write("\n")
            # TODO: write leaf doc
    

def generate_doc_from_child(directory: Path):
    # TODO: aggregate child docs into this directory's doc
    print(f"Aggregating for: {directory}")

    md_path= directory/f"{directory.name}README.md"

    with md_path.open('w') as file:
        for item in directory.iterdir():
            if(item.is_dir()) and item.name not in ignore_list:
                child_doc= get_dir_doc(item)
                file.write(f"THIS COMES FROM A CHILD DIRECTORY:{item.name}")
                file.write(child_doc)

            else:
                text = get_item_text(item)
                file.write(text)
                file.write("\n")
            
def get_dir_doc(directory: Path):
    md_path = directory/f"{directory.name}README.md"
    with md_path.open("r", encoding="utf-8") as f:
        text = f.read()
    return text

def get_item_text(item:Path)->str:  
    #TODO: Read from files in the directory that are not other directories and not in the ignore list
        if item.name not in ignore_list:
            #print(f"\t {item.parent}: {item.name}") # read the file 

            if item.is_file():
                with item.open( "r", encoding="utf-8") as f:
                    text= f.read()
                return text    




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

def main():
    parser = argparse.ArgumentParser(description="AutoDoc relative file path for current working directory")
    parser.add_argument("--filepath", type=str, default="")
    parseargs = parser.parse_args()

    current_directory= Path(parseargs.filepath)
    depth_traversal(current_directory)             

main()