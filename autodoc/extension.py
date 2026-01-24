import argparse
import time
from datetime import datetime

def main():
    parser = argparse.ArgumentParser("AutoDoc Extension Tester")
    parser.add_argument("--filepath", type=str)
    parseargs = parser.parse_args()

    print("AutoDoc Extension Tester is running...")
    print(parseargs.filepath) if parseargs.filepath else print("No filepath provided.")

    with open(r"C:\Users\Kenta\Desktop\Auto-Doc\autodoc\loggingtime.txt", "a") as f:
        f.write(f"Ran extension.py at {datetime.now()} with {parseargs.filepath}\n")

if __name__ == "__main__":
    main()