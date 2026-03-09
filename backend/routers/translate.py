from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

router = APIRouter()

# Initialize Gemini safely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
# We are currently defaulting to the user's requested model
MODEL_NAME = "gemini-3.1-flash-lite-preview"

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    context: str = "A user interface string in a travel safety app."

@router.post("/text")
async def translate_text(req: TranslationRequest):
    if not GEMINI_API_KEY:
        return {"translated_text": req.text} # Fallback if no API key

    if req.target_language.lower() == "english" or not req.text:
        return {"translated_text": req.text}

    prompt = f"""
    Translate the following text to {req.target_language}.
    Context: {req.context}
    
    Return ONLY the translated string, with absolutely no formatting, no markdown, and no quotes. Do NOT say 'Here is the translation:'. Just output the string.
    
    Text to translate: {req.text}
    """

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        translated = response.text.strip()
        return {"translated_text": translated}
    except Exception as e:
        print(f"Translation Error: {str(e)}")
        # Fail gracefully by just returning the original text so UI doesn't break
        return {"translated_text": req.text}
