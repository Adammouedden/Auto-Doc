from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from tex2img import Latex2PNG
from PIL import Image

import json
import os
import re

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
    
    def extract_svg(self, diagram_code: str):
        match = re.search(r"```svg\s*(.*?)\s*```", diagram_code, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1)
        match = re.search(r"(<svg[\s\S]*?</svg>)", diagram_code, re.IGNORECASE)
        if match:
            return match.group(1)
        return None

    def generate_diagram(self, code):     #TODO: input may be interpreted by Gemini first ("extract the exact architecture from this code")
        response = self.client.models.generate_content(
            model=self.model,
            contents=self.system_prompt+"CODE TO ANALYZE:\n"+code,
        )
        
        text = response.candidates[0].content.parts[0].text
        svg = self.extract_svg(text)

        payload = {
            "ok": bool(svg),
            "svg": svg,
            "raw": None if svg else text,
        }

        print(json.dumps(payload))

        # match = re.search(r"```latex\s*(.*?)\s*```", diagram_code, re.DOTALL)
        # latex_code = match.group(1) if match else None
        
        # file = self.render_latex(latex_code)

        # #print(latex_code)
        # img = Image.open(file)
        # img.show()

        

if __name__ == "__main__":
    file_path = r"alexnet.txt"
    with open(file_path, mode="r") as FILE:    # TODO: switch with real file path
        #print(f"Reading in {file_path}...")
        text = FILE.read()
    
    generator = DiagramGenerator(GEMINI_API_KEY, MODEL)
    is_valid_model = generator.validateML(text)
    if is_valid_model:
        #print("Valid model detected! Here is your diagram code:")
        generator.generate_diagram(text)
    
