from fastapi import APIRouter, HTTPException, UploadFile, File
from models import VoiceCommandRequest, CommandResponse
from services.groq_client import groq_client
import logging
import base64
import tempfile
import os

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/command", response_model=CommandResponse)
async def process_voice_command(request: VoiceCommandRequest):
    """Process voice command - transcribe and parse"""
    try:
        # If text is provided directly, skip transcription
        if request.text:
            transcribed_text = request.text
        elif request.audio_data:
            # Decode base64 audio
            audio_bytes = base64.b64decode(request.audio_data)
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name
            
            try:
                # Transcribe
                transcribed_text = await groq_client.transcribe_audio(temp_audio_path)
            finally:
                # Clean up temp file
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
        else:
            raise HTTPException(status_code=400, detail="No audio or text provided")
        
        logger.info(f"Transcribed: {transcribed_text}")
        
        # Parse command
        parsed_command = await groq_client.parse_command(transcribed_text)
        
        # Add transcript to response
        parsed_command['transcript'] = transcribed_text
        
        return CommandResponse(**parsed_command)
        
    except Exception as e:
        logger.error(f"Voice command error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio file in English only"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await audio.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name

        try:
            # Transcribe in English explicitly
            transcribed_text = await groq_client.transcribe_audio(
                temp_audio_path, 
                language="en"  # 👈 Force transcription in English
            )
            return {"text": transcribed_text}
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
                
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse")
async def parse_command(text: str):
    """Parse text command into structured action"""
    try:
        parsed = await groq_client.parse_command(text)
        return parsed
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
