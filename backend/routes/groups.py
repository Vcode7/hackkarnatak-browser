from fastapi import APIRouter, HTTPException, Depends
from database.mongodb import get_database
from database.group_model import (
    Group, GroupMember, SharedContext,
    CreateGroupRequest, JoinGroupRequest,
    AddContextRequest, GetGroupContextRequest
)
from datetime import datetime
import logging
import secrets
import string
from typing import List
from bson import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

def generate_invite_code(length=8):
    """Generate a random invite code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@router.post("/groups/create")
async def create_group(request: CreateGroupRequest, user_id: str = "default_user"):
    """Create a new group"""
    try:
        db = get_database()
        
        # Generate unique invite code
        invite_code = generate_invite_code()
        
        # Check if invite code already exists (very unlikely but safe)
        while await db.groups.find_one({"invite_code": invite_code}):
            invite_code = generate_invite_code()
        
        # Get user info (in real app, this would come from auth)
        # For now, using placeholder
        user_name = f"User_{user_id}"
        user_email = f"{user_id}@example.com"
        
        # Create group
        group = Group(
            name=request.name,
            description=request.description,
            created_by=user_id,
            invite_code=invite_code,
            members=[
                GroupMember(
                    user_id=user_id,
                    user_name=user_name,
                    user_email=user_email,
                    role="admin"
                )
            ]
        )
        
        result = await db.groups.insert_one(group.model_dump(by_alias=True, exclude=["id"]))
        
        logger.info(f"Created group: {request.name} with invite code: {invite_code}")
        
        return {
            "success": True,
            "group_id": str(result.inserted_id),
            "invite_code": invite_code,
            "message": "Group created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/groups/join")
async def join_group(request: JoinGroupRequest, user_id: str = "default_user"):
    """Join a group using invite code"""
    try:
        db = get_database()
        
        # Find group by invite code
        group = await db.groups.find_one({"invite_code": request.invite_code, "is_active": True})
        
        if not group:
            raise HTTPException(status_code=404, detail="Invalid invite code or group not found")
        
        # Check if user is already a member
        is_member = any(member["user_id"] == user_id for member in group.get("members", []))
        
        if is_member:
            return {
                "success": True,
                "group_id": str(group["_id"]),
                "message": "You are already a member of this group"
            }
        
        # Get user info
        user_name = f"User_{user_id}"
        user_email = f"{user_id}@example.com"
        
        # Add user to group
        new_member = GroupMember(
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            role="member"
        )
        
        await db.groups.update_one(
            {"_id": group["_id"]},
            {
                "$push": {"members": new_member.model_dump()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        logger.info(f"User {user_id} joined group {group['name']}")
        
        return {
            "success": True,
            "group_id": str(group["_id"]),
            "group_name": group["name"],
            "message": f"Successfully joined group: {group['name']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups/my-groups")
async def get_my_groups(user_id: str = "default_user"):
    """Get all groups the user is a member of"""
    try:
        db = get_database()
        
        # Find all groups where user is a member
        groups = await db.groups.find({
            "members.user_id": user_id,
            "is_active": True
        }).to_list(length=100)
        
        result = []
        for group in groups:
            # Count members and contexts
            member_count = len(group.get("members", []))
            context_count = await db.shared_contexts.count_documents({"group_id": str(group["_id"])})
            
            result.append({
                "id": str(group["_id"]),
                "name": group["name"],
                "description": group.get("description"),
                "invite_code": group["invite_code"],
                "member_count": member_count,
                "context_count": context_count,
                "created_at": group["created_at"].isoformat(),
                "is_admin": any(m["user_id"] == user_id and m["role"] == "admin" for m in group.get("members", []))
            })
        
        return {
            "success": True,
            "groups": result
        }
        
    except Exception as e:
        logger.error(f"Error getting groups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups/{group_id}")
async def get_group_details(group_id: str, user_id: str = "default_user"):
    """Get detailed information about a group"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(group_id):
            raise HTTPException(status_code=400, detail="Invalid group ID")
        
        group = await db.groups.find_one({"_id": ObjectId(group_id)})
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is a member
        is_member = any(member["user_id"] == user_id for member in group.get("members", []))
        
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Get context count
        context_count = await db.shared_contexts.count_documents({"group_id": group_id})
        
        return {
            "success": True,
            "group": {
                "id": str(group["_id"]),
                "name": group["name"],
                "description": group.get("description"),
                "invite_code": group["invite_code"],
                "members": group.get("members", []),
                "context_count": context_count,
                "created_at": group["created_at"].isoformat(),
                "updated_at": group["updated_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting group details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/groups/context/add")
async def add_shared_context(request: AddContextRequest, user_id: str = "default_user"):
    """Add browsing context to a group"""
    try:
        db = get_database()
        
        # Verify group exists and user is a member
        if not ObjectId.is_valid(request.group_id):
            raise HTTPException(status_code=400, detail="Invalid group ID")
        
        group = await db.groups.find_one({"_id": ObjectId(request.group_id)})
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        is_member = any(member["user_id"] == user_id for member in group.get("members", []))
        
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Get user name
        user_member = next((m for m in group.get("members", []) if m["user_id"] == user_id), None)
        user_name = user_member["user_name"] if user_member else f"User_{user_id}"
        
        # Create shared context
        context = SharedContext(
            group_id=request.group_id,
            user_id=user_id,
            user_name=user_name,
            page_url=request.page_url,
            page_title=request.page_title,
            content=request.content,
            content_type=request.content_type,
            search_query=request.search_query,
            tags=request.tags
        )
        
        result = await db.shared_contexts.insert_one(context.model_dump(by_alias=True, exclude=["id"]))
        
        # Update group's updated_at
        await db.groups.update_one(
            {"_id": ObjectId(request.group_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"Added shared context to group {request.group_id} by user {user_id}")
        
        return {
            "success": True,
            "context_id": str(result.inserted_id),
            "message": "Context added to group successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding shared context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/groups/context/get")
async def get_shared_context(request: GetGroupContextRequest, user_id: str = "default_user"):
    """Get all shared context from a group"""
    try:
        db = get_database()
        
        # Verify group exists and user is a member
        if not ObjectId.is_valid(request.group_id):
            raise HTTPException(status_code=400, detail="Invalid group ID")
        
        group = await db.groups.find_one({"_id": ObjectId(request.group_id)})
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        is_member = any(member["user_id"] == user_id for member in group.get("members", []))
        
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Build query
        query = {"group_id": request.group_id}
        
        # Optional text search
        if request.query:
            query["$or"] = [
                {"content": {"$regex": request.query, "$options": "i"}},
                {"page_title": {"$regex": request.query, "$options": "i"}},
                {"search_query": {"$regex": request.query, "$options": "i"}}
            ]
        
        # Get contexts sorted by timestamp (newest first)
        contexts = await db.shared_contexts.find(query).sort("timestamp", -1).limit(request.limit).to_list(length=request.limit)
        
        result = []
        for ctx in contexts:
            result.append({
                "id": str(ctx["_id"]),
                "user_id": ctx["user_id"],
                "user_name": ctx["user_name"],
                "page_url": ctx["page_url"],
                "page_title": ctx["page_title"],
                "content": ctx["content"][:500] + "..." if len(ctx["content"]) > 500 else ctx["content"],  # Truncate for list view
                "full_content": ctx["content"],  # Full content for AI
                "content_type": ctx["content_type"],
                "search_query": ctx.get("search_query"),
                "tags": ctx.get("tags", []),
                "timestamp": ctx["timestamp"].isoformat()
            })
        
        return {
            "success": True,
            "contexts": result,
            "total": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shared context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, user_id: str = "default_user"):
    """Leave a group"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(group_id):
            raise HTTPException(status_code=400, detail="Invalid group ID")
        
        group = await db.groups.find_one({"_id": ObjectId(group_id)})
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is the only admin
        admins = [m for m in group.get("members", []) if m["role"] == "admin"]
        if len(admins) == 1 and admins[0]["user_id"] == user_id:
            raise HTTPException(status_code=400, detail="Cannot leave group as the only admin. Transfer admin role first or delete the group.")
        
        # Remove user from group
        await db.groups.update_one(
            {"_id": ObjectId(group_id)},
            {
                "$pull": {"members": {"user_id": user_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        logger.info(f"User {user_id} left group {group_id}")
        
        return {
            "success": True,
            "message": "Successfully left the group"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving group: {e}")
        raise HTTPException(status_code=500, detail=str(e))
