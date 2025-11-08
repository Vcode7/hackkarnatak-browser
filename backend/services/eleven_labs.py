import os
from elevenlabs.client import ElevenLabs
import logging
import base64
from typing import Optional

logger = logging.getLogger(__name__)

class ElevenLabsClient:
    """ElevenLabs TTS client"""
    
    def __init__(self):
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            logger.warning("ELEVENLABS_API_KEY not found - TTS will be disabled")
            self.enabled = False
            self.client = None
        else:
            self.client = ElevenLabs(api_key=api_key)
            self.enabled = True
            self.default_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    
    async def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        return_base64: bool = True
    ) -> Optional[str]:
        """Convert text to speech"""
        if not self.enabled:
            logger.warning("ElevenLabs TTS is disabled")
            return None
        
        try:
            voice_id = voice_id or self.default_voice_id
            
            # Generate audio using new API
            audio_generator = self.client.generate(
                text=text,
                voice=voice_id,
                model="eleven_monolingual_v1"
            )
            
            # Collect audio bytes
            audio_bytes = b"".join(audio_generator)
            
            if return_base64:
                # Convert to base64 for easy transmission
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                return audio_base64
            else:
                return audio_bytes
                
        except Exception as e:
            logger.error(f"ElevenLabs TTS error: {e}")
            return None

# Global instance
eleven_labs_client = ElevenLabsClient()
