"""Routes for Focus Mode"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.focus_mode import focus_service
from app.database.connection import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/focus", tags=["focus"])


# ============ Request Models ============

class FocusSessionCreate(BaseModel):
    topic: str
    description: Optional[str] = None
    keywords: List[str] = []
    allowed_domains: List[str] = []


class URLCheckRequest(BaseModel):
    url: str
    use_quick_check: bool = False


class BatchURLCheckRequest(BaseModel):
    urls: List[str]


# ============ Focus Mode Routes ============

@router.post("/start")
async def start_focus_session(session: FocusSessionCreate, user_id: str = "default_user"):
    """Start a new focus mode session"""
    try:
        db = get_database()
        
        # Create focus session
        focus_session = {
            "user_id": user_id,
            "topic": session.topic,
            "description": session.description,
            "keywords": session.keywords,
            "allowed_domains": session.allowed_domains,
            "active": True,
            "urls_checked": 0,
            "urls_allowed": 0,
            "urls_blocked": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.focus_sessions.insert_one(focus_session)
        session_id = str(result.inserted_id)
        
        return {
            "success": True,
            "session_id": session_id,
            "message": f"Focus mode started for topic: {session.topic}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active")
async def get_active_focus_session(user_id: str = "default_user"):
    """Get active focus mode session"""
    try:
        db = get_database()
        session = await db.focus_sessions.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if session:
            session["_id"] = str(session["_id"])
            return {"success": True, "session": session, "active": True}
        else:
            return {"success": True, "session": None, "active": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-url")
async def check_url(request: URLCheckRequest, user_id: str = "default_user"):
    """Check if URL is allowed in current focus session"""
    try:
        db = get_database()
        
        # Get active focus session
        session = await db.focus_sessions.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if not session:
            return {
                "success": True,
                "allowed": True,
                "reason": "No active focus session",
                "session_active": False
            }
        
        # Check if URL is in whitelisted domains
        if focus_service.is_whitelisted_domain(request.url, session.get("allowed_domains", [])):
            await db.focus_sessions.update_one(
                {"_id": session["_id"]},
                {"$inc": {"urls_checked": 1, "urls_allowed": 1}, "$set": {"updated_at": datetime.utcnow()}}
            )
            return {
                "success": True,
                "allowed": True,
                "reason": "Domain is whitelisted",
                "session_active": True
            }
        
        # Quick check if requested
        if request.use_quick_check:
            allowed = focus_service.get_quick_decision(request.url, session.get("keywords", []))
            inc_update = {"urls_checked": 1}
            if allowed:
                inc_update["urls_allowed"] = 1
            else:
                inc_update["urls_blocked"] = 1
            await db.focus_sessions.update_one(
                {"_id": session["_id"]},
                {"$inc": inc_update, "$set": {"updated_at": datetime.utcnow()}}
            )
            return {
                "success": True,
                "allowed": allowed,
                "reason": "Quick keyword-based check",
                "session_active": True
            }
        
        # AI-based check
        result = await focus_service.check_url_relevance(
            url=request.url,
            topic=session["topic"],
            description=session.get("description", ""),
            keywords=session.get("keywords", []),
            strict_mode=False
        )
        
        # Update session stats
        inc_update = {"urls_checked": 1}
        if result["allowed"]:
            inc_update["urls_allowed"] = 1
        else:
            inc_update["urls_blocked"] = 1
        await db.focus_sessions.update_one(
            {"_id": session["_id"]},
            {
                "$inc": inc_update,
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return {
            "success": True,
            "allowed": result["allowed"],
            "reason": result["reason"],
            "confidence": result.get("confidence", 50),
            "session_active": True,
            "topic": session["topic"]
        }
        
    except Exception as e:
        print(f"Error checking URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-urls")
async def check_multiple_urls(request: BatchURLCheckRequest, user_id: str = "default_user"):
    """Check multiple URLs at once"""
    try:
        db = get_database()
        session = await db.focus_sessions.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if not session:
            return {
                "success": True,
                "results": {url: {"allowed": True, "reason": "No active focus session"} for url in request.urls},
                "session_active": False
            }
        
        # Batch check
        results = await focus_service.batch_check_urls(
            urls=request.urls,
            topic=session["topic"],
            description=session.get("description", ""),
            keywords=session.get("keywords", []),
            strict_mode=False
        )
        
        return {
            "success": True,
            "results": results,
            "session_active": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end")
async def end_focus_session(user_id: str = "default_user"):
    """End the active focus session"""
    try:
        db = get_database()
        session = await db.focus_sessions.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if not session:
            return {"success": False, "message": "No active focus session"}
        
        await db.focus_sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {"active": False, "ended_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Focus session ended",
            "stats": {
                "urls_checked": session.get("urls_checked", 0),
                "urls_allowed": session.get("urls_allowed", 0),
                "urls_blocked": session.get("urls_blocked", 0)
            }
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
