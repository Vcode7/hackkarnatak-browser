from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from services.vector_store import vector_store
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class StorePageRequest(BaseModel):
    url: str
    title: str
    content: str
    description: Optional[str] = None
    access_time: Optional[str] = None  # ISO format datetime string

class QueryContentRequest(BaseModel):
    query: str
    n_results: Optional[int] = 5
    filter_url: Optional[str] = None

@router.post("/store-page")
async def store_page(request: StorePageRequest):
    """Store webpage content in vector database"""
    try:
        # Parse access time if provided
        access_time = None
        if request.access_time:
            try:
                access_time = datetime.fromisoformat(request.access_time)
            except ValueError:
                access_time = datetime.now()
        
        # Store in vector database
        result = await vector_store.store_page(
            url=request.url,
            title=request.title,
            content=request.content,
            description=request.description,
            access_time=access_time
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error storing page: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query-content")
async def query_content(request: QueryContentRequest):
    """Query vector database for relevant content"""
    try:
        results = await vector_store.query_relevant_content(
            query=request.query,
            n_results=request.n_results,
            filter_url=request.filter_url
        )
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error querying content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page-history")
async def get_page_history(url: Optional[str] = None, limit: int = 10):
    """Get browsing history from vector store"""
    try:
        history = await vector_store.get_page_history(url=url, limit=limit)
        
        return {
            "success": True,
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        logger.error(f"Error getting page history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """Get vector store statistics"""
    try:
        stats = vector_store.get_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
