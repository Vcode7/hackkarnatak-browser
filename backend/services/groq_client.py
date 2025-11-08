import os
from groq import Groq
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class GroqClient:
    """Groq API client for LLM and Whisper"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
        self.whisper_model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
    
    async def chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> str:
        """Generate chat completion"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq chat completion error: {e}")
            raise
    
    async def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio using Whisper"""
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model=self.whisper_model,
                    response_format="text"
                )
            return transcription
        except Exception as e:
            logger.error(f"Groq transcription error: {e}")
            raise
    
    async def parse_command(self, text: str) -> Dict[str, Any]:
        """Parse natural language command into structured action"""
        system_prompt = """You are a command parser for a browser application. 
Parse user commands into structured JSON actions.

Available actions:
- open_url: Open a URL (extract or infer URL)
- back: Navigate back
- forward: Navigate forward
- refresh: Refresh page
- switch_tab: Switch to tab (extract index or relative: +1, -1)
- close_tab: Close current tab
- new_tab: Open new tab
- search: Search query (if not a direct URL)
- summarize_page: Summarize current page
- question: Ask question about page content

If the command contains "aichat" or "hey aichat", set is_aichat_query to true.

Return ONLY valid JSON in this format:
{
    "action": "action_name",
    "data": {"key": "value"},
    "message": "Human readable interpretation",
    "is_aichat_query": false
}

Examples:
"open google" -> {"action": "open_url", "data": {"url": "https://google.com"}, "message": "Opening Google", "is_aichat_query": false}
"go back" -> {"action": "back", "data": null, "message": "Going back", "is_aichat_query": false}
"next tab" -> {"action": "switch_tab", "data": {"index": 1}, "message": "Switching to next tab", "is_aichat_query": false}
"hey aichat summarize this page" -> {"action": "summarize_page", "data": null, "message": "Summarizing page", "is_aichat_query": true}
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Parse this command: {text}"}
        ]
        
        response = await self.chat_completion(messages, temperature=0.3)
        
        # Extract JSON from response
        import json
        try:
            # Try to find JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
            else:
                return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse command response: {response}")
            return {
                "action": "search",
                "data": {"query": text},
                "message": f"Searching for: {text}",
                "is_aichat_query": "aichat" in text.lower()
            }

# Global instance
groq_client = GroqClient()
