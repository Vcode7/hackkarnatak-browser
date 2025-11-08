"""Authentication routes for user login/signup"""
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets
from database.mongodb import get_database

router = APIRouter()


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    session_token: str


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserSignup):
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_doc = {
        "email": user.email,
        "name": user.name,
        "password_hash": hash_password(user.password),
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create session
    session_token = generate_session_token()
    await db.sessions.insert_one({
        "user_id": user_id,
        "token": session_token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=30)
    })
    
    return UserResponse(
        user_id=user_id,
        email=user.email,
        name=user.name,
        session_token=session_token
    )


@router.post("/login", response_model=UserResponse)
async def login(user: UserLogin):
    """Login user"""
    db = get_database()
    
    # Find user
    user_doc = await db.users.find_one({"email": user.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if user_doc["password_hash"] != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create new session
    session_token = generate_session_token()
    await db.sessions.insert_one({
        "user_id": str(user_doc["_id"]),
        "token": session_token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=30)
    })
    
    return UserResponse(
        user_id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        session_token=session_token
    )


@router.post("/logout")
async def logout(session_token: str):
    """Logout user by invalidating session"""
    db = get_database()
    
    result = await db.sessions.delete_one({"token": session_token})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True, "message": "Logged out successfully"}


@router.get("/verify")
async def verify_session(session_token: str):
    """Verify if session is valid"""
    db = get_database()
    
    session = await db.sessions.find_one({"token": session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if expired
    if session["expires_at"] < datetime.utcnow():
        await db.sessions.delete_one({"token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user info
    user = await db.users.find_one({"_id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "valid": True,
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"]
    }


@router.get("/user/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    db = get_database()
    from bson import ObjectId
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"],
        "last_login": user.get("last_login")
    }
