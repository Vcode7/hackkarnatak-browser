"""Routes for Focus Mode"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.focus_mode import focus_service
from services.database_service import db_service
from database.models import FocusSessionModel

router = APIRouter()


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

@router.post("/focus/start")
async def start_focus_session(session: FocusSessionCreate, user_id: str = "default_user"):
    """Start a new focus mode session"""
    try:
        # Get user settings to check if strict mode is enabled
        settings = await db_service.get_settings(user_id)
        strict_mode = settings.get("focus_mode_strict", False)
        
        # Create focus session
        focus_session = FocusSessionModel(
            user_id=user_id,
            topic=session.topic,
            description=session.description,
            keywords=session.keywords,
            allowed_domains=session.allowed_domains,
            active=True
        )
        
        session_id = await db_service.create_focus_session(focus_session)
        
        return {
            "success": True,
            "session_id": session_id,
            "message": f"Focus mode started for topic: {session.topic}",
            "strict_mode": strict_mode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/focus/active")
async def get_active_focus_session(user_id: str = "default_user"):
    """Get active focus mode session"""
    try:
        session = await db_service.get_active_focus_session(user_id)
        
        if session:
            return {"success": True, "session": session, "active": True}
        else:
            return {"success": True, "session": None, "active": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/focus/check-url")
async def check_url(request: URLCheckRequest, user_id: str = "default_user"):
    """Check if URL is allowed in current focus session"""
    try:
        # Get active focus session
        session = await db_service.get_active_focus_session(user_id)
        
        if not session:
            return {
                "success": True,
                "allowed": True,
                "reason": "No active focus session",
                "session_active": False
            }
        
        # Check if URL is in whitelisted domains
        if focus_service.is_whitelisted_domain(request.url, session.get("allowed_domains", [])):
            await db_service.update_focus_session_stats(session["_id"], allowed=True)
            return {
                "success": True,
                "allowed": True,
                "reason": "Domain is whitelisted",
                "session_active": True
            }
        
        # Quick check if requested
        if request.use_quick_check:
            allowed = focus_service.get_quick_decision(request.url, session.get("keywords", []))
            await db_service.update_focus_session_stats(session["_id"], allowed=allowed)
            return {
                "success": True,
                "allowed": allowed,
                "reason": "Quick keyword-based check",
                "session_active": True
            }
        
        # Get user settings for strict mode
        settings = await db_service.get_settings(user_id)
        strict_mode = settings.get("focus_mode_strict", False)
        
        # AI-based check
        result = await focus_service.check_url_relevance(
            url=request.url,
            topic=session["topic"],
            description=session.get("description", ""),
            keywords=session.get("keywords", []),
            strict_mode=strict_mode
        )
        
        # Update session stats
        await db_service.update_focus_session_stats(session["_id"], allowed=result["allowed"])
        
        return {
            "success": True,
            "allowed": result["allowed"],
            "reason": result["reason"],
            "confidence": result["confidence"],
            "session_active": True,
            "topic": session["topic"]
        }
        
    except Exception as e:
        print(f"Error checking URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/focus/check-urls")
async def check_multiple_urls(request: BatchURLCheckRequest, user_id: str = "default_user"):
    """Check multiple URLs at once"""
    try:
        session = await db_service.get_active_focus_session(user_id)
        
        if not session:
            return {
                "success": True,
                "results": {url: {"allowed": True, "reason": "No active focus session"} for url in request.urls},
                "session_active": False
            }
        
        # Get settings
        settings = await db_service.get_settings(user_id)
        strict_mode = settings.get("focus_mode_strict", False)
        
        # Batch check
        results = await focus_service.batch_check_urls(
            urls=request.urls,
            topic=session["topic"],
            description=session.get("description", ""),
            keywords=session.get("keywords", []),
            strict_mode=strict_mode
        )
        
        return {
            "success": True,
            "results": results,
            "session_active": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/focus/end")
async def end_focus_session(user_id: str = "default_user"):
    """End the active focus session"""
    try:
        session = await db_service.get_active_focus_session(user_id)
        
        if not session:
            return {"success": False, "message": "No active focus session"}
        
        success = await db_service.end_focus_session(session["_id"])
        
        if success:
            return {
                "success": True,
                "message": "Focus session ended",
                "stats": {
                    "urls_checked": session.get("urls_checked", 0),
                    "urls_allowed": session.get("urls_allowed", 0),
                    "urls_blocked": session.get("urls_blocked", 0)
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to end session")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/focus/history")
async def get_focus_history(user_id: str = "default_user", limit: int = 10):
    """Get focus mode session history"""
    try:
        history = await db_service.get_focus_history(user_id, limit)
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
