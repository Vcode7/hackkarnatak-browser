from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
from groq import Groq
import os

router = APIRouter()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class VoiceCommandRequest(BaseModel):
    command: str
    history: Optional[List[Dict[str, str]]] = []

class VoiceCommandResponse(BaseModel):
    action: str  # 'navigate', 'answer', 'exit'
    response: str
    url: Optional[str] = None

@router.post("/voice-command", response_model=VoiceCommandResponse)
async def process_voice_command(request: VoiceCommandRequest):
    """
    Process voice command using AI to interpret intent
    """
    try:
        command = request.command.strip()
        
        # Use AI to interpret the command
        interpretation = await interpret_command_with_ai(command, request.history)
        
        return interpretation
        
    except Exception as e:
        print(f"Error processing voice command: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def interpret_command_with_ai(command: str, history: List[Dict[str, str]]) -> VoiceCommandResponse:
    """
    Use AI to interpret whether the command is a navigation request or a question
    """
    try:
        # Build conversation context
        messages = [
            {
                "role": "system",
                "content": """You are a voice assistant for a web browser. Analyze user commands and respond in one of these formats:

1. For navigation/opening websites:
   COMMAND: open [url]
   Example: "COMMAND: open https://youtube.com"
   
2. For search requests:
   COMMAND: search [query]
   Example: "COMMAND: search machine learning tutorials"
   
3. For exit/quit:
   COMMAND: exit
   
4. For questions or conversations:
   ANSWER: [your response]
   Example: "ANSWER: The weather today is sunny."

Rules:
- If user wants to open/visit/go to a website, use "COMMAND: open [url]"
- If user wants to search/find/google something, use "COMMAND: search [query]"
- If user says exit/quit/goodbye, use "COMMAND: exit"
- For questions, explanations, or conversations, use "ANSWER: [response]"
- Keep answers concise (2-3 sentences max) for text-to-speech
- For known websites (youtube, google, facebook, etc.), provide full URLs
- Be friendly and conversational

Respond ONLY in the format specified above."""
            }
        ]
        
        # Add recent history for context
        for msg in history[-4:]:  # Last 4 messages
            if msg['speaker'] == 'You':
                messages.append({"role": "user", "content": msg['message']})
            elif msg['speaker'] == 'AI':
                messages.append({"role": "assistant", "content": msg['message']})
        
        # Add current command
        messages.append({"role": "user", "content": command})
        
        # Get AI interpretation
        completion = groq_client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
            messages=messages,
            temperature=0.3,
            max_tokens=300,
            top_p=1,
            stream=False
        )
        
        ai_response = completion.choices[0].message.content.strip()
        
        # Parse AI response
        if ai_response.startswith("COMMAND: open "):
            target = ai_response.replace("COMMAND: open ", "").strip()
            url = get_url_from_target(target)
            return VoiceCommandResponse(
                action='navigate',
                response=f"Opening {target}",
                url=url
            )
        
        elif ai_response.startswith("COMMAND: search "):
            query = ai_response.replace("COMMAND: search ", "").strip()
            url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            return VoiceCommandResponse(
                action='navigate',
                response=f"Searching for {query}",
                url=url
            )
        
        elif ai_response.startswith("COMMAND: exit"):
            return VoiceCommandResponse(
                action='exit',
                response="Goodbye! Have a great day!",
                url=None
            )
        
        elif ai_response.startswith("ANSWER: "):
            answer = ai_response.replace("ANSWER: ", "").strip()
            return VoiceCommandResponse(
                action='answer',
                response=answer,
                url=None
            )
        
        else:
            # Fallback: treat as answer if format is unexpected
            return VoiceCommandResponse(
                action='answer',
                response=ai_response,
                url=None
            )
        
    except Exception as e:
        print(f"Error interpreting command with AI: {e}")
        return VoiceCommandResponse(
            action='answer',
            response="I'm sorry, I didn't understand that. Could you please try again?",
            url=None
        )

def get_url_from_target(target: str) -> str:
    """
    Convert target name to URL
    """
    target_lower = target.lower().strip()
    
    # Common websites mapping
    website_map = {
        'youtube': 'https://www.youtube.com',
        'google': 'https://www.google.com',
        'facebook': 'https://www.facebook.com',
        'twitter': 'https://www.twitter.com',
        'x': 'https://www.x.com',
        'instagram': 'https://www.instagram.com',
        'linkedin': 'https://www.linkedin.com',
        'github': 'https://www.github.com',
        'reddit': 'https://www.reddit.com',
        'amazon': 'https://www.amazon.com',
        'netflix': 'https://www.netflix.com',
        'wikipedia': 'https://www.wikipedia.org',
        'gmail': 'https://mail.google.com',
        'whatsapp': 'https://web.whatsapp.com',
        'spotify': 'https://www.spotify.com',
        'twitch': 'https://www.twitch.tv',
        'tiktok': 'https://www.tiktok.com',
        'pinterest': 'https://www.pinterest.com',
        'stackoverflow': 'https://stackoverflow.com',
        'stack overflow': 'https://stackoverflow.com',
    }
    
    # Check if target matches a known website
    for key, url in website_map.items():
        if key in target_lower:
            return url
    
    # Check if it's already a URL
    if target_lower.startswith('http://') or target_lower.startswith('https://'):
        return target
    
    # Check if it looks like a domain
    if '.' in target and ' ' not in target:
        if not target.startswith('http'):
            return f'https://{target}'
        return target
    
    # Default: search on Google
    return f"https://www.google.com/search?q={target.replace(' ', '+')}"

@router.get("/test")
async def test_voice_navigation():
    """Test endpoint"""
    return {"status": "Voice navigation API is working"}
