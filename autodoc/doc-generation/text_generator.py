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
        "- Summarizes each function or method in 1–2 sentences\n"
        "Do not include code snippets unless necessary for clarity."
    ),
    (
        "You are given a directory containing files and nested subdirectory summaries, "
        "where each subdirectory summary is already provided in Markdown format. "
        "Generate a Markdown-formatted document that:\n"
        "- Describes the overall directory structure\n"
        "- Integrates and references the existing subdirectory summaries\n"
        "- Briefly explains the role of each file in the current directory\n"
        "Do not rewrite the subdirectory summaries; synthesize them at a higher level."
    )
]

load_dotenv()
api_key= os.getenv('GOOGLE_API_KEY')

client = genai.Client(api_key=api_key)

def llm_response(prompt_type: int, input_string:str)->str:
    '''
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents= input_string,
        config=types.GenerateContentConfig(
            system_instruction=prompts[prompt_type]
        )

    )

    return response.text
    '''

    return "LLM WOULD BE CALLED HERE"