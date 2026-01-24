from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

prompts = [
    (
        "You are given the contents of multiple code files from a directory. "
        "Generate a Markdown-formatted document that:\n"
        "- Lists each file\n"
        "- Briefly describes its purpose\n"
        "- Summarizes each function or method in 1–2 sentences\n\n"
        "At the very top of the document, add a section titled '## Libraries'.\n"
        "- Identify all external libraries used in the code files.\n"
        "- For each library, include a link to its official documentation.\n"
        "- Do not list local or standard project files as libraries.\n"
        "- Prefer official documentation over tutorials or blogs.\n\n"
        "Do not include code snippets unless necessary for clarity."
    ),
    (
        "You are given input representing the contents of a directory.\n\n"
        "The input contains two kinds of content:\n"
        "1. Raw source code files from the current directory.\n"
        "2. Markdown README summaries generated for child directories.\n\n"
        "Instructions:\n"
        "- For raw source code files, briefly describe the purpose of each file and its functions.\n"
        "- For README or Markdown content, do NOT describe individual files or functions inside it.\n"
        "  Instead, produce a short high-level summary of what that README describes.\n"
        "- Use child README summaries only as contextual information.\n"
        "- Do not repeat or expand the child README content verbatim.\n\n"
        "At the very top of the document, add a section titled '## Libraries'.\n"
        "- Identify all external libraries used in the current directory's code files.\n"
        "- Merge and deduplicate libraries across files.\n"
        "- For each library, include a link to its official documentation.\n"
        "- If a library is mentioned only in child README summaries, include it only if relevant to the current directory.\n"
        "- Prefer official documentation links (e.g., project website or official docs).\n\n"
        "Produce a concise Markdown summary of the current directory."
    )
]


load_dotenv(override=True)
api_key = os.getenv('GOOGLE_API_KEY')

client = genai.Client(api_key=api_key)

def llm_response(prompt_type: int, input_string:str)->str:
    
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents= input_string,
        config=types.GenerateContentConfig(
            system_instruction=prompts[prompt_type]
        )

    )

    return response.text
    