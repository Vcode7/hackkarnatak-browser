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
    Process voice command and determine action
    """
    try:
        command = request.command.lower().strip()
        
        # Check for exit commands
        exit_keywords = ['exit', 'quit', 'close', 'stop', 'goodbye', 'bye']
        if any(keyword in command for keyword in exit_keywords):
            return VoiceCommandResponse(
                action='exit',
                response="Goodbye! Have a great day!",
                url=None
            )
        
        # Check for navigation commands
        navigation_patterns = [
            r'open\s+(.+)',
            r'go\s+to\s+(.+)',
            r'visit\s+(.+)',
            r'navigate\s+to\s+(.+)',
            r'take\s+me\s+to\s+(.+)',
            r'show\s+me\s+(.+)',
        ]
        
        for pattern in navigation_patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                target = match.group(1).strip()
                url = get_url_from_target(target)
                
                response_text = f"Okay, opening {target}. Please wait..."
                
                return VoiceCommandResponse(
                    action='navigate',
                    response=response_text,
                    url=url
                )
        
        # Check for search commands
        search_patterns = [
            r'search\s+for\s+(.+)',
            r'find\s+(.+)',
            r'look\s+up\s+(.+)',
            r'google\s+(.+)',
        ]
        
        for pattern in search_patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                query = match.group(1).strip()
                url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                
                response_text = f"Searching for {query}..."
                
                return VoiceCommandResponse(
                    action='navigate',
                    response=response_text,
                    url=url
                )
        
        # If not a navigation command, treat as a question
        # Use AI to answer
        answer = await get_ai_answer(command, request.history)
        
        return VoiceCommandResponse(
            action='answer',
            response=answer,
            url=None
        )
        
    except Exception as e:
        print(f"Error processing voice command: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

async def get_ai_answer(question: str, history: List[Dict[str, str]]) -> str:
    """
    Get AI answer for a question using Groq
    """
    try:
        # Build conversation context
        messages = [
            {
                "role": "system",
                "content": "You are a helpful voice assistant in a web browser. Provide concise, clear answers suitable for text-to-speech. Keep responses under 3 sentences when possible. Be friendly and conversational."
            }
        ]
        
        # Add recent history for context
        for msg in history[-4:]:  # Last 4 messages
            if msg['speaker'] == 'You':
                messages.append({"role": "user", "content": msg['message']})
            elif msg['speaker'] == 'AI':
                messages.append({"role": "assistant", "content": msg['message']})
        
        # Add current question
        messages.append({"role": "user", "content": question})
        
        # Get AI response
        completion = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
            top_p=1,
            stream=False
        )
        
        answer = completion.choices[0].message.content.strip()
        return answer
        
    except Exception as e:
        print(f"Error getting AI answer: {e}")
        return "I'm sorry, I couldn't find an answer to that question. Could you please try rephrasing it?"

@router.get("/test")
async def test_voice_navigation():
    """Test endpoint"""
    return {"status": "Voice navigation API is working"}
