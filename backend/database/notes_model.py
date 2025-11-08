from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId

# Pydantic v2 compatible ObjectId type
PyObjectId = Annotated[str, Field(description="MongoDB ObjectId as string")]

class NoteModel(BaseModel):
    """Note model for storing user notes from web pages"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str = "default_user"
    content: str  # The selected text content
    page_url: str  # URL of the page where note was created
    page_title: Optional[str] = None  # Title of the page
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    tags: list[str] = []  # Optional tags for organization
    color: Optional[str] = None  # Optional color for note
