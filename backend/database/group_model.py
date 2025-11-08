from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.no_info_plain_validator_function(cls.validate),
        ])

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

class GroupMember(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    role: str = "member"  # "admin" or "member"

class Group(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    created_by: str  # user_id
    members: List[GroupMember] = []
    invite_code: str  # Unique code to join group
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class SharedContext(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    group_id: str
    user_id: str
    user_name: str
    page_url: str
    page_title: str
    content: str  # Page content or document content
    content_type: str  # "webpage", "pdf", "docx", "xlsx"
    search_query: Optional[str] = None  # If user searched for something
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None

class JoinGroupRequest(BaseModel):
    invite_code: str

class AddContextRequest(BaseModel):
    group_id: str
    page_url: str
    page_title: str
    content: str
    content_type: str = "webpage"
    search_query: Optional[str] = None
    tags: List[str] = []

class GetGroupContextRequest(BaseModel):
    group_id: str
    query: Optional[str] = None  # Optional search query to filter context
    limit: int = 50
