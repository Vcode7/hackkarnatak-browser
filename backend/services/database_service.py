"""Database service for CRUD operations"""
from datetime import datetime
from typing import List, Optional
from database.mongodb import get_database
from database.models import BookmarkModel, HistoryModel, SettingsModel, FocusSessionModel


class DatabaseService:
    """Service for database operations"""
    
    def __init__(self):
        self.db = get_database()
        print(self.db)
    def ensure_db(self):
        if self.db is None:
            self.db = get_database()
    # ============ Bookmarks ============
    
    async def add_bookmark(self, bookmark: BookmarkModel) -> str:
        """Add a new bookmark"""
        self.ensure_db()
        result = await self.db.bookmarks.insert_one(bookmark.dict(by_alias=True, exclude={"id"}))
        return str(result.inserted_id)
    
    async def get_bookmarks(self, user_id: str = "default_user", folder: Optional[str] = None) -> List[dict]:
        """Get all bookmarks for a user"""
        self.ensure_db()
        query = {"user_id": user_id}
        if folder:
            query["folder"] = folder
        
        cursor = self.db.bookmarks.find(query).sort("created_at", -1)
        bookmarks = await cursor.to_list(length=1000)
        
        # Convert ObjectId to string
        for bookmark in bookmarks:
            bookmark["_id"] = str(bookmark["_id"])
        
        return bookmarks
    
    async def delete_bookmark(self, bookmark_id: str) -> bool:
        """Delete a bookmark"""
        self.ensure_db()
        from bson import ObjectId
        result = await self.db.bookmarks.delete_one({"_id": ObjectId(bookmark_id)})
        return result.deleted_count > 0
    
    async def search_bookmarks(self, user_id: str, query: str) -> List[dict]:
        """Search bookmarks by title or URL"""
        self.ensure_db()
        cursor = self.db.bookmarks.find({
            "user_id": user_id,
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"url": {"$regex": query, "$options": "i"}},
                {"tags": {"$regex": query, "$options": "i"}}
            ]
        }).sort("created_at", -1)
        
        bookmarks = await cursor.to_list(length=100)
        for bookmark in bookmarks:
            bookmark["_id"] = str(bookmark["_id"])
        
        return bookmarks
    
    # ============ History ============
    
    async def add_history(self, history: HistoryModel) -> str:
        """Add or update browsing history"""
        self.ensure_db()
        # Check if URL already exists for user
        existing = await self.db.history.find_one({
            "user_id": history.user_id,
            "url": history.url
        })
        
        if existing:
            # Update visit count and timestamp
            await self.db.history.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "visited_at": datetime.utcnow(),
                        "title": history.title,
                        "favicon": history.favicon
                    },
                    "$inc": {"visit_count": 1}
                }
            )
            return str(existing["_id"])
        else:
            # Insert new history entry
            result = await self.db.history.insert_one(history.dict(by_alias=True, exclude={"id"}))
            return str(result.inserted_id)
    
    async def get_history(self, user_id: str = "default_user", limit: int = 100) -> List[dict]:
        """Get browsing history for a user"""
        self.ensure_db()
        cursor = self.db.history.find({"user_id": user_id}).sort("visited_at", -1).limit(limit)
        history = await cursor.to_list(length=limit)
        
        for item in history:
            item["_id"] = str(item["_id"])
        
        return history
    
    async def search_history(self, user_id: str, query: str) -> List[dict]:
        """Search browsing history"""
        self.ensure_db()
        cursor = self.db.history.find({
            "user_id": user_id,
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"url": {"$regex": query, "$options": "i"}}
            ]
        }).sort("visited_at", -1).limit(50)
        
        history = await cursor.to_list(length=50)
        for item in history:
            item["_id"] = str(item["_id"])
        
        return history
    
    async def clear_history(self, user_id: str = "default_user") -> int:
        """Clear all history for a user"""
        self.ensure_db()
        result = await self.db.history.delete_many({"user_id": user_id})
        return result.deleted_count
    
    # ============ Settings ============
    
    async def get_settings(self, user_id: str = "default_user") -> dict:
        """Get user settings"""
        self.ensure_db()
        settings = await self.db.settings.find_one({"user_id": user_id})
        
        if not settings:
            # Create default settings
            default_settings = SettingsModel(user_id=user_id)
            await self.db.settings.insert_one(default_settings.dict(by_alias=True, exclude={"id"}))
            settings = default_settings.dict()
        else:
            settings["_id"] = str(settings["_id"])
        
        return settings
    
    async def update_settings(self, user_id: str, settings_update: dict) -> bool:
        """Update user settings"""
        self.ensure_db()
        settings_update["updated_at"] = datetime.utcnow()
        
        result = await self.db.settings.update_one(
            {"user_id": user_id},
            {"$set": settings_update},
            upsert=True
        )
        
        return result.modified_count > 0 or result.upserted_id is not None
    
    # ============ Focus Mode ============
    
    async def create_focus_session(self, session: FocusSessionModel) -> str:
        """Create a new focus mode session"""
        self.ensure_db()
        # Deactivate any existing active sessions
        await self.db.focus_sessions.update_many(
            {"user_id": session.user_id, "active": True},
            {"$set": {"active": False, "ended_at": datetime.utcnow()}}
        )
        
        # Create new session
        result = await self.db.focus_sessions.insert_one(session.dict(by_alias=True, exclude={"id"}))
        return str(result.inserted_id)
    
    async def get_active_focus_session(self, user_id: str = "default_user") -> Optional[dict]:
        """Get active focus mode session"""
        self.ensure_db()
        session = await self.db.focus_sessions.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if session:
            session["_id"] = str(session["_id"])
        
        return session
    
    async def update_focus_session_stats(self, session_id: str, allowed: bool) -> bool:
        """Update focus session statistics"""
        self.ensure_db()
        from bson import ObjectId
        
        update = {
            "$inc": {
                "urls_checked": 1,
                "urls_allowed": 1 if allowed else 0,
                "urls_blocked": 0 if allowed else 1
            }
        }
        
        result = await self.db.focus_sessions.update_one(
            {"_id": ObjectId(session_id)},
            update
        )
        
        return result.modified_count > 0
    
    async def end_focus_session(self, session_id: str) -> bool:
        """End a focus mode session"""
        self.ensure_db()
        from bson import ObjectId
        
        result = await self.db.focus_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"active": False, "ended_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    
    async def get_focus_history(self, user_id: str = "default_user", limit: int = 10) -> List[dict]:
        """Get focus mode session history"""
        self.ensure_db()
        cursor = self.db.focus_sessions.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        sessions = await cursor.to_list(length=limit)
        
        for session in sessions:
            session["_id"] = str(session["_id"])
        
        return sessions


# Global service instance
db_service = DatabaseService()
