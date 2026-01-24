from google import genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class isModel(BaseModel):
    is_model: bool = Field(description="Whether the file contains the architecture of a machine learning algorithm, and if its architecture can be drawn as a diagram.")

client = genai.Client(api_key=GEMINI_API_KEY)

prompt = input("Paste code here \n>") # TODO: Link input to VS code extension, copy code when shortcut

response = client.models.generate_content(
    model="Gemini 3 Pro Preview",
    contents=prompt,
    config={
        "response_mime_type": "application/json",
        "response_json_schema": isModel.model_json_schema(),
    },
)

print(response.text)


