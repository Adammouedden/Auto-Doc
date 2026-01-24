import os
import argparse

def recursively_find_classes_in_file(file_path):
    classes = {}
    try:
        file_path = os.listdir(file_path)
        print(f"Files and directories in '{file_path}':")
        for item in file_path:
            print(item)
    except FileNotFoundError:
        print(f"Error: The directory '{file_path}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def main():
    parser = argparse.ArgumentParser(description="Finds classes within the current working directory")
    parser.add_argument('--filepath', type=str, help='Relative file path from current working directory')
    args = parser.parse_args()
    file_path = args.filepath
    print("File path received for class finder:", file_path)

    parent_dir = os.path.dirname(file_path)
    classes = recursively_find_classes_in_file(parent_dir)

main()