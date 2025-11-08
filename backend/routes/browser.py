from fastapi import APIRouter, HTTPException
from models import BrowserAction
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/action")
async def execute_browser_action(action: BrowserAction):
    """
    Receive browser action from frontend
    This is mainly for logging/analytics on the backend
    The actual execution happens in the frontend
    """
    try:
        logger.info(f"Browser action: {action.action}")
        return {
            "status": "received",
            "action": action.action,
            "message": f"Action {action.action} received"
        }
    except Exception as e:
        logger.error(f"Browser action error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def browser_health():
    """Browser service health check"""
    return {"status": "healthy", "service": "browser"}
