from fastapi import APIRouter
from app.database.connection import get_database

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def health_check():
    """Health check endpoint"""
    db = get_database()
    try:
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}

