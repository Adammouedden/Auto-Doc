from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os
import json

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = "gemini-3-flash-preview"

class isModel(BaseModel):
    is_model: bool = Field(description="Whether the file contains the architecture of a machine learning algorithm, and if its architecture can be drawn as a diagram.")

class DiagramGenerator():
    def __init__(self, api_key, model=MODEL):
        self.client = genai.Client(api_key=api_key)
        
        with open(r"sys_prompt.txt", mode="r") as FILE:
            self.system_prompt = FILE.read()
            
        self.model = model
        
    def validateML(self, prompt):
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": isModel.model_json_schema(),
            },
        )
        
        return json.loads(response.text)['is_model']
    
    def generate_diagram(self, code):     #TODO: input may be interpreted by Gemini first ("extract the exact architecture from this code")
        
        diagram_code = self.client.models.generate_content(
            model=self.model,
            contents=self.system_prompt+code
        )

if __name__ == "__main__":
    with open(r"ml_code.txt", mode="r") as FILE:    # TODO: switch with real file path
        text = FILE.read()
    
    generator = DiagramGenerator(GEMINI_API_KEY, MODEL)
    result = generator.validateML(text)
    if result == True:
        print("It's a boolean")
