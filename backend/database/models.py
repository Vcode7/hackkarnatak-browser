"""Database models for MongoDB collections"""
from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: Any,
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class BookmarkModel(BaseModel):
    """Bookmark model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = "default_user"
    url: str
    title: str
    favicon: Optional[str] = None
    folder: Optional[str] = "Default"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class HistoryModel(BaseModel):
    """Browsing history model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = "default_user"
    url: str
    title: str
    favicon: Optional[str] = None
    visited_at: datetime = Field(default_factory=datetime.utcnow)
    visit_count: int = 1
    last_visit_duration: Optional[int] = None  # seconds

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class SettingsModel(BaseModel):
    """User settings model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = "default_user"
    
    # General settings
    default_search_engine: str = "google"
    homepage_url: str = ""
    
    # Privacy settings
    save_history: bool = True
    save_cookies: bool = True
    block_trackers: bool = False
    
    # Appearance settings
    theme: str = "system"  # light, dark, system
    font_size: str = "medium"
    
    # AI settings
    ai_voice_enabled: bool = True
    ai_voice_speed: float = 1.0
    ai_auto_summarize: bool = False
    
    # Focus mode settings
    focus_mode_enabled: bool = False
    focus_mode_strict: bool = False
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class FocusSessionModel(BaseModel):
    """Focus mode session model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = "default_user"
    topic: str
    description: Optional[str] = None
    keywords: List[str] = []
    allowed_domains: List[str] = []
    blocked_urls: List[str] = []
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    
    # Statistics
    urls_checked: int = 0
    urls_allowed: int = 0
    urls_blocked: int = 0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DownloadModel(BaseModel):
    """Download tracking model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = "default_user"
    filename: str
    url: str
    file_size: Optional[int] = None  # bytes
    mime_type: Optional[str] = None
    save_path: Optional[str] = None
    status: str = "in_progress"  # in_progress, completed, failed, cancelled
    progress: float = 0.0  # 0-100
    downloaded_bytes: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
