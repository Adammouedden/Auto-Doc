from pathlib import Path
import text_generator
import logging
import argparse

import sys
sys.stdout.reconfigure(write_through=True)


DEBUG_MODE = True


ignore_list = {".git", ".gitignore", ".vscode", "node_modules"}

def is_leaf_directory(directory: Path)->bool:
    for item in directory.iterdir():
        if(item.is_dir() and item.name not in ignore_list):  
            return False
    return True

def is_generated_readme(item: Path) -> bool:
    return item.is_file() and item.name == f"{item.parent.name}README.md"


def generate_doc(directory: Path):

    #print(f"doc for {directory}")
    

    text=[]

    for item in directory.iterdir():
        if item.name in ignore_list:
            continue
        if is_generated_readme(item):
            continue
        text.append(f"file name: {item.name} in directory: {directory.name}")
        text.append(get_item_text(item))
    
    prompt_input = "\n".join(text)
    md_doc_text= text_generator.llm_response(0, prompt_input)

    md_path= directory/f"{directory.name}README.md"
    with md_path.open('w') as file:

        logging.info(f"WRITING TO THIS FILE: {item.name}")
        file.write(md_doc_text)
        
        
    

def generate_doc_from_child(directory: Path):
    # TODO: aggregate child docs into this directory's doc
    #print(f"Aggregating for: {directory}")

    text =[]

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
    md_doc_text = text_generator.llm_response(0, prompt_input)

    md_path= directory/f"{directory.name}README.md"
    with md_path.open('w') as file:
        logging.info(f"WRITING TO THIS FILE: {item.name}")
        file.write(md_doc_text)

            
def get_dir_doc(directory: Path):
    md_path = directory/f"{directory.name}README.md"
    with md_path.open("r", encoding="utf-8") as f:
        text = f.read()
    return text

def get_item_text(item:Path)->str:  

    if item.name not in ignore_list:
        #print(f"\t {item.parent}: {item.name}") # read the file 

        if item.is_file():
            print("INGESTING:", item)

            with item.open( "r", encoding="utf-8") as f:
                text= f.read()
            if text is None: return ""
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
        