from google import genai
from google.genai import types
from pathlib import Path
import argparse
from pydantic import BaseModel
from typing import List



def visualize_code(api_key, code, system_prompt):
    client = genai.Client(api_key=api_key)

    

    prompt = system_prompt + code

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents = prompt,
    )

    return response.text


def main():
    parser = argparse.ArgumentParser(description="AutoDoc relative file path for current working directory")
    parser.add_argument("--code", type=str, default="")
    parser.add_argument("--apikey", type=str, default="")
    parser.add_argument("--prompt", type=str)
    parseargs = parser.parse_args()

    code = parseargs.code
    apikey = parseargs.apikey

    with open(parseargs.prompt, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    html = visualize_code(api_key=apikey, code=code, system_prompt=system_prompt)

    out_file = Path.cwd() / "visualization.html"
    out_file.write_text(html, encoding="utf-8")

    print(html)           

main()  