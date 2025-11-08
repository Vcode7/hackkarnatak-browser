from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class CommandAction(str, Enum):
    """Browser command actions"""
    OPEN_URL = "open_url"
    BACK = "back"
    FORWARD = "forward"
    REFRESH = "refresh"
    SWITCH_TAB = "switch_tab"
    CLOSE_TAB = "close_tab"
    NEW_TAB = "new_tab"
    SUMMARIZE_PAGE = "summarize_page"
    QUESTION = "question"
    SEARCH = "search"

class VoiceCommandRequest(BaseModel):
    """Voice command request model"""
    audio_data: Optional[str] = Field(None, description="Base64 encoded audio data")
    audio_url: Optional[str] = Field(None, description="URL to audio file")
    text: Optional[str] = Field(None, description="Direct text input (bypasses STT)")

class CommandResponse(BaseModel):
    """Parsed command response"""
    action: CommandAction
    data: Optional[Dict[str, Any]] = None
    message: str
    is_aichat_query: bool = False
    transcript: Optional[str] = Field(None, description="Transcribed text from audio")

class AIRequest(BaseModel):
    """AI assistant request"""
    query: str
    context: Optional[str] = Field(None, description="Page content or context")
    page_url: Optional[str] = Field(None, description="Current page URL")

class AIResponse(BaseModel):
    """AI assistant response"""
    text: str
    audio_url: Optional[str] = None
    audio_base64: Optional[str] = None
    suggested_websites: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Suggested websites for learning")

class SummarizeRequest(BaseModel):
    """Page summarization request"""
    content: str = Field(..., description="Page content to summarize")
    url: Optional[str] = Field(None, description="Page URL")

class QuestionRequest(BaseModel):
    """Question answering request"""
    question: str
    context: str = Field(..., description="Page content or PDF text")
    url: Optional[str] = None

class TTSRequest(BaseModel):
    """Text-to-speech request"""
    text: str
    voice_id: Optional[str] = None

class BrowserAction(BaseModel):
    """Browser action model"""
    action: str
    url: Optional[str] = None
    tab_index: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
