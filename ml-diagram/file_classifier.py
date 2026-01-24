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
    
    def extract_architecture(self, text):
        """
        For a block of code input from a FILE, extract only the relevant ML architecture blocks/code.
        
        :param self: Description
        :param text: string, code from FILE, input by user.
        """
        architecture_isolated = self.client.models.generate_content(
            model=self.model,
            contents="Extract only the machine learning architecture block or code that will be useful for drawing the diagram from this code file:" + text
        )

        return architecture_isolated

    def render_latex(self, latex):
        renderer = Latex2PNG(api_url="https://latex.ytotech.com/builds/sync")

        png_data = renderer.compile(latex)
        image_file = 'output.png'

        with open(image_file, 'wb') as FILE:
            FILE.write(png_data)

        print(f"LaTeX rendered and outputted as {image_file}.")

        return image_file
    
    def simulate_latex_render(self):
        #subprocess.run
        pass

    def generate_diagram(self, code):     #TODO: input may be interpreted by Gemini first ("extract the exact architecture from this code")
        
        diagram_code = self.client.models.generate_content(
            model=self.model,
            contents=self.system_prompt+"CODE TO ANALYZE:\n"+code,
        )
        
        diagram_code = diagram_code.candidates[0].content.parts[0].text

        print(diagram_code)
        # match = re.search(r"```latex\s*(.*?)\s*```", diagram_code, re.DOTALL)
        # latex_code = match.group(1) if match else None
        
        # file = self.render_latex(latex_code)

        # #print(latex_code)
        # img = Image.open(file)
        # img.show()

        

if __name__ == "__main__":
    file_path = r"alexnet.txt"
    with open(file_path, mode="r") as FILE:    # TODO: switch with real file path
        print(f"Reading in {file_path}...")
        text = FILE.read()
    
    generator = DiagramGenerator(GEMINI_API_KEY, MODEL)
    is_valid_model = generator.validateML(text)
    if is_valid_model:
        print("Valid model detected! Here is your diagram code:")
        generator.generate_diagram(text)
    
