import os
import aiosqlite
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "thor_db"
SQLITE_PATH = "./thor_offline.db"

# MongoDB client (lazy init)
_mongo_client = None

def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        if MONGODB_URI and MONGODB_URI.strip():
            _mongo_client = AsyncIOMotorClient(MONGODB_URI)
        else:
            _mongo_client = None
    return _mongo_client

def get_database():
    client = get_mongo_client()
    return client[DB_NAME]

def get_users_collection():
    return get_database()["users"]

def get_trips_collection():
    return get_database()["trips"]

def get_enterprise_trips_collection():
    return get_database()["enterprise_trips"]

def get_invitations_collection():
    return get_database()["invitations"]

def get_tracked_tourists_collection():
    return get_database()["tracked_tourists"]

# SQLite — offline fallback
async def init_sqlite():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password    TEXT NOT NULL,
                medical     TEXT,
                emergency   TEXT,
                created_at  TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS trips (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                destination TEXT NOT NULL,
                start_date  TEXT,
                end_date    TEXT,
                plan        TEXT,
                created_at  TEXT
            )
        """)
        await db.commit()

async def sqlite_upsert_user(user_data: dict):
    import json
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO users (id, name, email, password, medical, emergency, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_data.get("id", ""),
            user_data.get("name", ""),
            user_data.get("email", ""),
            user_data.get("hashed_password", ""),
            json.dumps(user_data.get("medical_details", {})),
            json.dumps(user_data.get("emergency_contacts", [])),
            user_data.get("created_at", ""),
        ))
        await db.commit()

async def sqlite_get_user_by_email(email: str):
    import json
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE email = ?", (email,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
    return None
