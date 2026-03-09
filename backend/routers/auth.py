import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from models.user import UserRegister, UserLogin, Token, UserResponse
from database import get_users_collection, sqlite_upsert_user, sqlite_get_user_by_email
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "thor-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

bearer_scheme = HTTPBearer()
router = APIRouter()


def hash_password(password: str) -> str:
    # Use SHA-256 with salt for now (more secure than plain bcrypt with this issue)
    salt = os.urandom(32).hex()
    return hashlib.sha256((password + salt).encode()).hexdigest() + ":" + salt


def verify_password(plain: str, hashed: str) -> bool:
    try:
        hash_part, salt = hashed.split(":")
        return hashlib.sha256((plain + salt).encode()).hexdigest() == hash_part
    except:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)





async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):

    token = credentials.credentials

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: str = payload.get("sub")

        if user_id is None:

            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    except JWTError:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")



    users = get_users_collection()

    try:

        user = await users.find_one({"_id": ObjectId(user_id)})

    except Exception:

        user = None



    if not user:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")



    return user





@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)

async def register(data: UserRegister):

    users = get_users_collection()



    # Check duplicate email

    existing = await users.find_one({"email": data.email})

    if existing:

        raise HTTPException(status_code=400, detail="Email already registered")



    hashed = hash_password(data.password)

    now = datetime.now(timezone.utc).isoformat()



    user_doc = {

        "name": data.name,

        "email": data.email,

        "hashed_password": hashed,

        "medical_details": data.medical_details.model_dump() if data.medical_details else {},

        "emergency_contacts": [e.model_dump() for e in data.emergency_contacts] if data.emergency_contacts else [],

        "created_at": now,

    }



    result = await users.insert_one(user_doc)

    user_id = str(result.inserted_id)



    # Mirror to SQLite for offline access

    await sqlite_upsert_user({**user_doc, "id": user_id})



    token = create_access_token({"sub": user_id})

    user_response = UserResponse(

        id=user_id,

        name=data.name,

        email=data.email,

        medical_details=user_doc["medical_details"],

        emergency_contacts=user_doc["emergency_contacts"],

        created_at=now,

    )

    return Token(access_token=token, token_type="bearer", user=user_response)





@router.post("/login", response_model=Token)

async def login(data: UserLogin):

    users = get_users_collection()

    user = await users.find_one({"email": data.email})



    now = datetime.now(timezone.utc).isoformat()



    if not user:

        # --- DEMO MODE: Auto-register unknown users seamlessly ---

        hashed = hash_password(data.password)

        name_from_email = data.email.split("@")[0].replace(".", " ").replace("_", " ").title()

        user_doc = {

            "name": name_from_email,

            "email": data.email,

            "hashed_password": hashed,

            "medical_details": {},

            "emergency_contacts": [],

            "created_at": now,

        }

        result = await users.insert_one(user_doc)

        user_id = str(result.inserted_id)

        name = name_from_email

        email = data.email

        medical = {}

        emergency = []

        created_at = now

    else:

        # --- DEMO MODE: Accept any password for existing users ---

        user_id = str(user["_id"])

        name = user["name"]

        email = user["email"]

        medical = user.get("medical_details", {})

        emergency = user.get("emergency_contacts", [])

        created_at = user.get("created_at", "")



    token = create_access_token({"sub": user_id})

    user_response = UserResponse(

        id=user_id,

        name=name,

        email=email,

        medical_details=medical,

        emergency_contacts=emergency,

        created_at=created_at,

    )

    return Token(access_token=token, token_type="bearer", user=user_response)





@router.get("/me", response_model=UserResponse)

async def get_me(current_user=Depends(get_current_user)):

    return UserResponse(

        id=str(current_user["_id"]),

        name=current_user["name"],

        email=current_user["email"],

        medical_details=current_user.get("medical_details", {}),

        emergency_contacts=current_user.get("emergency_contacts", []),

        created_at=current_user.get("created_at", ""),

    )

