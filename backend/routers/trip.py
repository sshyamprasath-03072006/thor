import os
import json
import urllib.parse
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from routers.auth import get_current_user
from dotenv import load_dotenv
import google.generativeai as genai
import httpx

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-3.1-flash-lite-preview"

router = APIRouter()

def clean_json(text: str) -> str:
    """Strip markdown code fences from AI response."""
    t = text.strip()
    if t.startswith("```"):
        parts = t.split("```")
        t = parts[1] if len(parts) > 1 else t
        if t.startswith("json"):
            t = t[4:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()

class TripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    traveler_name: Optional[str] = "Traveler"

@router.post("/generate")
async def generate_trip_plan(req: TripRequest, current_user=Depends(get_current_user)):
    """
    Generates a highly structured JSON mapping of hotels, meals, and route stops for the user's trip.
    """
    prompt = f"""You are an elite travel concierge. The traveler, {req.traveler_name}, is going to {req.destination} from {req.start_date} to {req.end_date}.
    
    You must design a detailed, realistic travel itinerary. You must pick SPECIFIC REAL PLACES (not generic names) in {req.destination}.
    Return ONLY valid JSON. The JSON must EXACTLY match this structure:
    {{
      "destination": "{req.destination}",
      "start_date": "{req.start_date}",
      "end_date": "{req.end_date}",
      "hotel_recommendation": {{
        "name": "Exact Name of a Highly Rated Hotel in {req.destination}",
        "latitude": 0.0,
        "longitude": 0.0
      }},
      "days": [
        {{
          "day": 1,
          "breakfast": {{ "name": "Real Cafe Name", "lat": 0.0, "lng": 0.0 }},
          "lunch": {{ "name": "Real Lunch Spot", "lat": 0.0, "lng": 0.0 }},
          "dinner": {{ "name": "Real Dinner Restaurant", "lat": 0.0, "lng": 0.0 }},
          "route_spots": [
            {{ "name": "Real Tourist Attraction 1", "lat": 0.0, "lng": 0.0, "description": "Short exciting detail" }},
            {{ "name": "Real Tourist Attraction 2", "lat": 0.0, "lng": 0.0, "description": "Short exciting detail" }}
          ]
        }}
      ]
    }}
    
    Ensure you generate the correct number of days between {req.start_date} and {req.end_date}.
    For demo purposes, please ensure coordinates are roughly accurate for {req.destination}.
    Provide NO OTHER TEXT EXCEPT THE JSON.
    """

    try:
        model = genai.GenerativeModel(MODEL)
        response = model.generate_content(prompt)
        json_str = clean_json(response.text)
        data = json.loads(json_str)
        return {"status": "success", "plan": data}
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate trip plan via AI.")

@router.get("/guides")
async def get_local_guides(destination: str, current_user=Depends(get_current_user)):
    """
    Dynamically fetches REAL local guides / tourism offices using Google Places API TextSearch and Details.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {"status": "success", "guides": []}

    encoded_dest = urllib.parse.quote(f"tour guides and tourism offices in {destination}")
    search_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={encoded_dest}&key={api_key}"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(search_url)
            data = resp.json()
            results = data.get("results", [])[:3]
            
            guides = []
            for r in results:
                place_id = r.get("place_id")
                # Fetch deeper details for real contact info
                details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=formatted_phone_number,website&key={api_key}"
                d_resp = await client.get(details_url)
                d_data = d_resp.json().get("result", {})
                
                guides.append({
                    "id": place_id,
                    "name": r.get("name", "Local Guide"),
                    "role": r.get("formatted_address", "Local Agency"),
                    "languages": ["English", "Local"],
                    "rating": r.get("rating", 4.0),
                    "price": "Check Website",
                    "phone": d_data.get("formatted_phone_number", ""),
                    "website": d_data.get("website", "")
                })
                
            return {"status": "success", "guides": guides}
    except Exception as e:
        print(f"Guides API Error: {str(e)}")
        # Fallback raw data if Places API struggles
        return {"status": "success", "guides": []}

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    language: str = "English"
    context: str = "concierge" # 'concierge' or 'global'
    active_plan: Optional[dict] = None

@router.post("/chat")
async def chat_with_ai(req: ChatRequest):
    """
    Stateful chat endpoint for the Concierge and Global Chatbot.
    """
    sys_prompt = ""
    if req.context == "concierge":
        plan_str = json.dumps(req.active_plan) if req.active_plan else "No active plan."
        sys_prompt = f"You are THOR AI, an elite cultural concierge and local translator. The user is on a trip. Current Plan: {plan_str}. You MUST reply entirely in {req.language}. Keep answers incredibly concise, helpful, and safety-focused."
    else:
        sys_prompt = f"You are THOR AI, the overarching system intelligence for the Guard of Tourism app. You help the user navigate the app (e.g. tell them the Community tab is on the bottom, Plan trip is the big button on Home). You MUST reply entirely in {req.language}. Keep answers concise and helpful."

    # Convert history
    formatted_history = []
    for h in req.history:
        role = "user" if h["role"] == "user" else "model"
        formatted_history.append({"role": role, "parts": [h["content"]]})

    try:
        model = genai.GenerativeModel(MODEL, system_instruction=sys_prompt)
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(req.message)
        return {"reply": response.text}
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"reply": "I am experiencing network interference. Please try again."}
