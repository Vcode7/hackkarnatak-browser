from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.groq_clients import GroqService
from app.services.data import HistoryService
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])

groq_service = GroqService()
history_service = HistoryService()

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with Groq"""
    try:
        # Get conversation history if conversation_id exists
        history = []
        if request.conversation_id:
            history = await history_service.get_messages(request.conversation_id)
        
        # Add user message to history
        history.append({"role": "user", "content": request.message})
        
        # Get response from Groq
        response_text = await groq_service.chat_completion(
            messages=history,
            system_prompt="You are a helpful AI assistant embedded in a code editor. You help developers understand and modify codebases. Be concise and actionable."
        )
        
        # Save messages to history
        conversation_id = request.conversation_id or await history_service.create_conversation()
        await history_service.add_message(conversation_id, "user", request.message)
        await history_service.add_message(conversation_id, "assistant", response_text)
        
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

