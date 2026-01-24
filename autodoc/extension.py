import argparse
import time
from datetime import datetime

def main():
    parser = argparse.ArgumentParser("AutoDoc Extension Tester")
    parser.add_argument("--filepath", type=str)
    parseargs = parser.parse_args()

    print("AutoDoc Extension Tester is running...")
    print(parseargs.filepath) if parseargs.filepath else print("No filepath provided.")

<<<<<<< HEAD
    with open(r"C:\Users\adamm\Documents\PROJECTS\Auto-Doc\autodoc\loggingtime.txt", "a") as f:
=======
    with open(r"C:\Users\Kenta\Desktop\Auto-Doc\autodoc\loggingtime.txt", "a") as f:
>>>>>>> 1e938fc99646f9bbfc945729147c8dd5361d6585
        f.write(f"Ran extension.py at {datetime.now()} with {parseargs.filepath}\n")

if __name__ == "__main__":
    main()