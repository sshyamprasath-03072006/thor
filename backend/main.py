from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, trip, safety, sos, enterprise, translate, risk_zones
from database import init_sqlite

import os
from dotenv import load_dotenv

load_dotenv()

# Debug: Print environment variables
print(f"ALLOWED_ORIGINS from env: {os.getenv('ALLOWED_ORIGINS')}")

app = FastAPI(title="THOR API", description="Guard of Tourism — Backend API", version="1.0.0")

# Allowed origins: local dev + production Vercel frontend
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")

print(f"Final ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(trip.router, prefix="/trip", tags=["Trip Planner"])
app.include_router(safety.router, prefix="/safety", tags=["Safety"])
app.include_router(sos.router, prefix="/sos", tags=["SOS & Emergency"])
app.include_router(enterprise.router, prefix="/enterprise", tags=["Enterprise"])
app.include_router(translate.router, prefix="/translate", tags=["Translation (Gemini)"])
app.include_router(risk_zones.router, prefix="/api", tags=["Risk Zones"])

@app.on_event("startup")
async def startup():
    await init_sqlite()

@app.get("/")
async def root():
    return {"message": "THOR API — Guard of Tourism ⚡", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
