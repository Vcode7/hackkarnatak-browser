from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database.mongodb import get_database
from database.notes_model import NoteModel
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class CreateNoteRequest(BaseModel):
    content: str
    page_url: str
    page_title: Optional[str] = None
    tags: Optional[List[str]] = []
    color: Optional[str] = None

class UpdateNoteRequest(BaseModel):
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None

@router.post("/notes")
async def create_note(request: CreateNoteRequest):
    """Create a new note"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        note = NoteModel(
            content=request.content,
            page_url=request.page_url,
            page_title=request.page_title,
            tags=request.tags or [],
            color=request.color,
            created_at=datetime.utcnow()
        )
        
        result = await notes_collection.insert_one(note.dict(by_alias=True, exclude={"id"}))
        
        return {
            "success": True,
            "note_id": str(result.inserted_id),
            "message": "Note created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes")
async def get_notes(
    user_id: str = "default_user",
    page_url: Optional[str] = None,
    limit: int = 100
):
    """Get all notes, optionally filtered by page URL"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        query = {"user_id": user_id}
        if page_url:
            query["page_url"] = page_url
        
        cursor = notes_collection.find(query).sort("created_at", -1).limit(limit)
        notes = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for note in notes:
            note["_id"] = str(note["_id"])
        
        return {
            "success": True,
            "notes": notes,
            "count": len(notes)
        }
        
    except Exception as e:
        logger.error(f"Error getting notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes/{note_id}")
async def get_note(note_id: str):
    """Get a specific note by ID"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        note["_id"] = str(note["_id"])
        
        return {
            "success": True,
            "note": note
        }
        
    except Exception as e:
        logger.error(f"Error getting note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notes/{note_id}")
async def update_note(note_id: str, request: UpdateNoteRequest):
    """Update a note"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        update_data = {}
        if request.content is not None:
            update_data["content"] = request.content
        if request.tags is not None:
            update_data["tags"] = request.tags
        if request.color is not None:
            update_data["color"] = request.color
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await notes_collection.update_one(
            {"_id": ObjectId(note_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return {
            "success": True,
            "message": "Note updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        result = await notes_collection.delete_one({"_id": ObjectId(note_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return {
            "success": True,
            "message": "Note deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notes")
async def delete_multiple_notes(note_ids: List[str]):
    """Delete multiple notes"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        object_ids = [ObjectId(note_id) for note_id in note_ids]
        result = await notes_collection.delete_many({"_id": {"$in": object_ids}})
        
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} notes"
        }
        
    except Exception as e:
        logger.error(f"Error deleting notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes/export/json")
async def export_notes_json(user_id: str = "default_user"):
    """Export all notes as JSON"""
    try:
        db = get_database()
        notes_collection = db.notes
        
        cursor = notes_collection.find({"user_id": user_id}).sort("created_at", -1)
        notes = await cursor.to_list(length=None)
        
        # Convert ObjectId to string and datetime to ISO format
        for note in notes:
            note["_id"] = str(note["_id"])
            if "created_at" in note:
                note["created_at"] = note["created_at"].isoformat()
            if "updated_at" in note and note["updated_at"]:
                note["updated_at"] = note["updated_at"].isoformat()
        
        return {
            "success": True,
            "notes": notes,
            "count": len(notes),
            "exported_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error exporting notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
