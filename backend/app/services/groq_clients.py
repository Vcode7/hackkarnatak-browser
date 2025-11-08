from groq import Groq
import os
import asyncio
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = None
    ) -> str:
        """Send chat completion request to Groq"""
        try:
            chat_messages = []
            
            if system_prompt:
                chat_messages.append({"role": "system", "content": system_prompt})
            
            chat_messages.extend(messages)
            
            # Run synchronous Groq client in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=chat_messages,
                    temperature=0.7,
                    max_tokens=2048,
                )
            )
            
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")

