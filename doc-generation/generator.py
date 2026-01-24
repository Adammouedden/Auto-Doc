from pathlib import Path

current_directory= Path('.')

def is_leaf_directory(directory: Path):
    for item in directory.iterdir():
        if(item.is_dir()):
            return False
    return True

def generate_doc(current_directory):
    print("WE ARE IN A LEAF DIREC")
    #TODO

def depth_traversal(current_directory: Path):
    if is_leaf_directory(current_directory):
        generate_doc(current_directory)

    for item in current_directory.iterdir():
        if(item.is_dir()):
            depth_traversal(item)
            
             
        