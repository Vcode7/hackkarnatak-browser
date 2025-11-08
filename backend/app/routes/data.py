"""Routes for bookmarks, history, and settings"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from services.database_service import db_service
from database.models import BookmarkModel, HistoryModel

router = APIRouter()


# ============ Request Models ============

class BookmarkCreate(BaseModel):
    url: str
    title: str
    favicon: Optional[str] = None
    folder: Optional[str] = "Default"
    tags: List[str] = []


class HistoryCreate(BaseModel):
    url: str
    title: str
    favicon: Optional[str] = None


class SettingsUpdate(BaseModel):
    default_search_engine: Optional[str] = None
    homepage_url: Optional[str] = None
    save_history: Optional[bool] = None
    save_cookies: Optional[bool] = None
    block_trackers: Optional[bool] = None
    theme: Optional[str] = None
    font_size: Optional[str] = None
    ai_voice_enabled: Optional[bool] = None
    ai_voice_speed: Optional[float] = None
    ai_auto_summarize: Optional[bool] = None
    focus_mode_enabled: Optional[bool] = None
    focus_mode_strict: Optional[bool] = None


# ============ Bookmarks Routes ============

@router.post("/bookmarks")
async def add_bookmark(bookmark: BookmarkCreate, user_id: str = "default_user"):
    """Add a new bookmark"""
    try:
        bookmark_model = BookmarkModel(
            user_id=user_id,
            **bookmark.dict()
        )
        bookmark_id = await db_service.add_bookmark(bookmark_model)
        return {"success": True, "bookmark_id": bookmark_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookmarks")
async def get_bookmarks(user_id: str = "default_user", folder: Optional[str] = None):
    """Get all bookmarks"""
    try:
        bookmarks = await db_service.get_bookmarks(user_id, folder)
        return {"success": True, "bookmarks": bookmarks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    """Delete a bookmark"""
    try:
        success = await db_service.delete_bookmark(bookmark_id)
        if success:
            return {"success": True, "message": "Bookmark deleted"}
        else:
            raise HTTPException(status_code=404, detail="Bookmark not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookmarks/search")
async def search_bookmarks(query: str, user_id: str = "default_user"):
    """Search bookmarks"""
    try:
        bookmarks = await db_service.search_bookmarks(user_id, query)
        return {"success": True, "bookmarks": bookmarks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ History Routes ============

@router.post("/history")
async def add_history(history: HistoryCreate, user_id: str = "default_user"):
    """Add browsing history"""
    try:
        print(history)
        history_model = HistoryModel(
            user_id=user_id,
            **history.dict()
        )
        history_id = await db_service.add_history(history_model)
        return {"success": True, "history_id": history_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(user_id: str = "default_user", limit: int = 100):
    """Get browsing history"""
    try:
        print(user_id)
        history = await db_service.get_history(user_id, limit)
        print(history)
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/search")
async def search_history(query: str, user_id: str = "default_user"):
    """Search browsing history"""
    try:

        history = await db_service.search_history(user_id, query)
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history")
async def clear_history(user_id: str = "default_user"):
    """Clear all browsing history"""
    try:
        count = await db_service.clear_history(user_id)
        return {"success": True, "deleted_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ Settings Routes ============

@router.get("/settings")
async def get_settings(user_id: str = "default_user"):
    """Get user settings"""
    try:
        settings = await db_service.get_settings(user_id)
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings")
async def update_settings(settings: SettingsUpdate, user_id: str = "default_user"):
    """Update user settings"""
    try:
        # Only update provided fields
        settings_dict = {k: v for k, v in settings.dict().items() if v is not None}
        
        success = await db_service.update_settings(user_id, settings_dict)
        if success:
            return {"success": True, "message": "Settings updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update settings")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
