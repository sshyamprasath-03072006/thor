from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class RiskZone(BaseModel):
    id: str
    name: str
    city: str
    risk_level: str
    description: str
    latitude: float
    longitude: float
    radius: float
    created_at: str
    updated_at: Optional[str] = None

# Mock data for development
MOCK_RISK_ZONES = {
    "chennai": [
        {
            "id": "rz_001",
            "name": "Beach Safety Zone",
            "city": "chennai",
            "risk_level": "medium",
            "description": "High tourist traffic area",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius": 2.0,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "rz_002", 
            "name": "Marina Risk Area",
            "city": "chennai",
            "risk_level": "low",
            "description": "Generally safe with occasional crowds",
            "latitude": 13.0500,
            "longitude": 80.2800,
            "radius": 1.5,
            "created_at": datetime.now().isoformat()
        }
    ]
}

@router.get("/risk-zones")
async def get_risk_zones(city: str = "chennai", since: int = 0):
    """
    Get risk zones for a city, optionally filtered by timestamp
    """
    try:
        zones = MOCK_RISK_ZONES.get(city.lower(), [])
        
        # Filter by 'since' timestamp if provided
        if since > 0:
            zones = [
                zone for zone in zones 
                if datetime.fromisoformat(zone["created_at"]).timestamp() > since
            ]
        
        return {"zones": zones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch risk zones: {str(e)}")
