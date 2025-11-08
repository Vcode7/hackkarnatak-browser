from dotenv import load_dotenv
import os
load_dotenv()
print("Loaded GROQ_API_KEY:", os.getenv("GROQ_API_KEY"))
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from database.mongodb import connect_to_mongo, close_mongo_connection
from routes import ai, voice, browser, proxy, data, focus, auth, downloads, voice_navigation

# Load environment variables


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Lernova Browser API",
    description="AI-powered browser with focus mode and intelligent features",
    version="2.0.0"
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await connect_to_mongo()
    logger.info("✅ Lernova API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo_connection()
    logger.info("✅ Lernova API shutdown complete")

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice Commands"])
app.include_router(voice_navigation.router, prefix="/api/ai", tags=["Voice Navigation"])
app.include_router(browser.router, prefix="/api/browser", tags=["Browser Control"])
app.include_router(proxy.router, prefix="/api/proxy", tags=["Proxy"])
app.include_router(data.router, prefix="/api/data", tags=["Data Management"])
app.include_router(focus.router, prefix="/api", tags=["Focus Mode"])
app.include_router(downloads.router, prefix="/api", tags=["Downloads"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Lernova Browser API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "AI Assistant",
            "Voice Commands",
            "Focus Mode",
            "Bookmarks & History",
            "Smart URL Validation"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            
            # Echo back for now - can be extended for real-time features
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
