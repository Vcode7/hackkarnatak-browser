"""Routes for download management"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.mongodb import get_database
from database.models import DownloadModel
from bson import ObjectId

router = APIRouter()


class DownloadCreate(BaseModel):
    filename: str
    url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    save_path: Optional[str] = None


class DownloadUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[float] = None
    downloaded_bytes: Optional[int] = None
    error_message: Optional[str] = None


@router.post("/downloads")
async def create_download(download: DownloadCreate, user_id: str = "default_user"):
    """Create a new download entry"""
    try:
        db = get_database()
        download_model = DownloadModel(
            user_id=user_id,
            **download.dict()
        )
        result = await db.downloads.insert_one(download_model.dict(by_alias=True, exclude={"id"}))
        return {"success": True, "download_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/downloads")
async def get_downloads(user_id: str = "default_user", limit: int = 100):
    """Get all downloads for a user"""
    try:
        db = get_database()
        cursor = db.downloads.find({"user_id": user_id}).sort("started_at", -1).limit(limit)
        downloads = await cursor.to_list(length=limit)
        
        for download in downloads:
            download["_id"] = str(download["_id"])
        
        return {"success": True, "downloads": downloads}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/downloads/{download_id}")
async def get_download(download_id: str):
    """Get a specific download"""
    try:
        db = get_database()
        download = await db.downloads.find_one({"_id": ObjectId(download_id)})
        
        if not download:
            raise HTTPException(status_code=404, detail="Download not found")
        
        download["_id"] = str(download["_id"])
        return {"success": True, "download": download}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/downloads/{download_id}")
async def update_download(download_id: str, update: DownloadUpdate):
    """Update download status/progress"""
    try:
        db = get_database()
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        
        # Add completion time if status is completed
        if update_data.get("status") == "completed":
            update_data["completed_at"] = datetime.utcnow()
        
        result = await db.downloads.update_one(
            {"_id": ObjectId(download_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Download not found")
        
        return {"success": True, "message": "Download updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/downloads/{download_id}")
async def delete_download(download_id: str):
    """Delete a download entry"""
    try:
        db = get_database()
        result = await db.downloads.delete_one({"_id": ObjectId(download_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Download not found")
        
        return {"success": True, "message": "Download deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/downloads")
async def clear_downloads(user_id: str = "default_user", status: Optional[str] = None):
    """Clear downloads (optionally by status)"""
    try:
        db = get_database()
        query = {"user_id": user_id}
        
        if status:
            query["status"] = status
        
        result = await db.downloads.delete_many(query)
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
