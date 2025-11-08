from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
import requests
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/fetch")
async def proxy_fetch(url: str):
    """
    Proxy endpoint to fetch web content and bypass CORS
    Usage: /api/proxy/fetch?url=https://example.com
    """
    try:
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid URL")
        
        # Fetch the content
        response = requests.get(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout=10
        )
        
        # Return the content with CORS headers
        return Response(
            content=response.content,
            status_code=response.status_code,
            media_type=response.headers.get('content-type', 'text/html'),
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }
        )
        
    except requests.RequestException as e:
        logger.error(f"Proxy fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")

@router.options("/fetch")
async def proxy_options():
    """Handle OPTIONS preflight requests"""
    return Response(
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        }
    )
