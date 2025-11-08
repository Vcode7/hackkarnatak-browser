from app.database.connection import get_database
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

class HistoryService:
    async def create_conversation(self) -> str:
        """Create a new conversation and return its ID"""
        db = get_database()
        result = await db.conversations.insert_one({
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        return str(result.inserted_id)
    
    async def add_message(self, conversation_id: str, role: str, content: str):
        """Add a message to a conversation"""
        db = get_database()
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$push": {
                    "messages": {
                        "role": role,
                        "content": content,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    
    async def get_messages(self, conversation_id: str) -> List[Dict[str, str]]:
        """Get all messages from a conversation"""
        db = get_database()
        try:
            conversation = await db.conversations.find_one(
                {"_id": ObjectId(conversation_id)}
            )
            if not conversation:
                return []
            
            # Return messages in format expected by Groq
            return [
                {"role": msg["role"], "content": msg["content"]}
                for msg in conversation.get("messages", [])
            ]
        except Exception:
            return []

