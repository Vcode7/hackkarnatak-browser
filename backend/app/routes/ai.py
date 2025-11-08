from fastapi import APIRouter, HTTPException
from models import AIRequest, AIResponse, SummarizeRequest, QuestionRequest, TTSRequest
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.langchain_utils import langchain_service
from services.eleven_labs import eleven_labs_client
import logging
import json
import re

logger = logging.getLogger(__name__)
router = APIRouter()


async def generate_website_suggestions(query: str, ai_response: str) -> List[Dict[str, str]]:
    """Generate website suggestions based on user query"""
    try:
        # Extract topic from query
        topic = query.replace('learn about', '').replace('teach me', '').replace('explain', '').strip()
        
        # Predefined quality learning resources
        suggestions = []
        
        # Add topic-specific suggestions
        topic_lower = topic.lower()
        
        # Programming & Tech
        if any(word in topic_lower for word in ['python', 'javascript', 'programming', 'coding', 'web development', 'java', 'c++', 'react', 'node']):
            suggestions.extend([
                {"title": "MDN Web Docs", "description": "Comprehensive web development documentation and tutorials", "url": "https://developer.mozilla.org"},
                {"title": "freeCodeCamp", "description": "Learn to code for free with interactive tutorials", "url": "https://www.freecodecamp.org"},
                {"title": "W3Schools", "description": "Web development tutorials and references", "url": "https://www.w3schools.com"},
                {"title": "Stack Overflow", "description": "Q&A community for programmers", "url": "https://stackoverflow.com"},
                {"title": "GitHub", "description": "Explore open source projects and code", "url": "https://github.com"}
            ])
        
        # Science & Math
        elif any(word in topic_lower for word in ['math', 'physics', 'chemistry', 'biology', 'science', 'calculus', 'algebra']):
            suggestions.extend([
                {"title": "Khan Academy", "description": "Free courses in math, science, and more", "url": "https://www.khanacademy.org"},
                {"title": "Wolfram Alpha", "description": "Computational knowledge engine", "url": "https://www.wolframalpha.com"},
                {"title": "MIT OpenCourseWare", "description": "Free MIT course materials", "url": "https://ocw.mit.edu"},
                {"title": "Coursera", "description": "Online courses from top universities", "url": "https://www.coursera.org"},
                {"title": "edX", "description": "University-level courses online", "url": "https://www.edx.org"}
            ])
        
        # Languages
        elif any(word in topic_lower for word in ['language', 'spanish', 'french', 'german', 'chinese', 'japanese', 'english']):
            suggestions.extend([
                {"title": "Duolingo", "description": "Learn languages for free", "url": "https://www.duolingo.com"},
                {"title": "Memrise", "description": "Language learning with native speakers", "url": "https://www.memrise.com"},
                {"title": "BBC Languages", "description": "Free language courses from BBC", "url": "https://www.bbc.co.uk/languages"},
                {"title": "italki", "description": "Learn languages with native teachers", "url": "https://www.italki.com"},
                {"title": "Busuu", "description": "Language learning community", "url": "https://www.busuu.com"}
            ])
        
        # General Learning
        else:
            suggestions.extend([
                {"title": "Wikipedia", "description": f"Encyclopedia article about {topic}", "url": f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"},
                {"title": "Khan Academy", "description": "Free educational resources", "url": "https://www.khanacademy.org"},
                {"title": "Coursera", "description": "Online courses from universities", "url": "https://www.coursera.org"},
                {"title": "YouTube Education", "description": "Educational videos and tutorials", "url": f"https://www.youtube.com/results?search_query={topic.replace(' ', '+')}+tutorial"},
                {"title": "Reddit", "description": f"Community discussions about {topic}", "url": f"https://www.reddit.com/search/?q={topic.replace(' ', '+')}"}
            ])
        
        # Return top 5 suggestions
        return suggestions[:5]
        
    except Exception as e:
        logger.error(f"Error generating website suggestions: {e}")
        return []


class HighlightRequest(BaseModel):
    topic: str
    pageTitle: str
    pageUrl: str
    elements: List[Dict]

class WebsiteSuggestionRequest(BaseModel):
    topic: str

@router.post("/chat", response_model=AIResponse)
async def chat(request: AIRequest):
    """General AI chat endpoint"""
    try:
        # Generate text response
        text_response = await langchain_service.general_chat(
            query=request.query,
            context=request.context
        )
        
        # Generate voice response
        audio_base64 = await eleven_labs_client.text_to_speech(text_response)
        
        # Check if query is about learning/research and suggest websites
        suggested_websites = []
        learning_keywords = ['learn', 'study', 'tutorial', 'course', 'guide', 'teach', 'explain', 'understand', 'research', 'information', 'about']
        query_lower = request.query.lower()
        
        if any(keyword in query_lower for keyword in learning_keywords):
            # Generate website suggestions based on the query
            suggested_websites = await generate_website_suggestions(request.query, text_response)
        
        return AIResponse(
            text=text_response,
            audio_base64=audio_base64,
            suggested_websites=suggested_websites
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize", response_model=AIResponse)
async def summarize(request: SummarizeRequest):
    """Summarize webpage content"""
    try:
        # Generate summary
        summary = await langchain_service.summarize_content(
            content=request.content,
            url=request.url
        )
        
        # Generate voice
        audio_base64 = await eleven_labs_client.text_to_speech(summary)
        
        return AIResponse(
            text=summary,
            audio_base64=audio_base64
        )
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/question", response_model=AIResponse)
async def answer_question(request: QuestionRequest):
    """Answer question based on context"""
    try:
        # Generate answer
        answer = await langchain_service.answer_question(
            question=request.question,
            context=request.context,
            url=request.url
        )
        
        # Generate voice
        audio_base64 = await eleven_labs_client.text_to_speech(answer)
        
        return AIResponse(
            text=answer,
            audio_base64=audio_base64
        )
    except Exception as e:
        logger.error(f"Question error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts", response_model=AIResponse)
async def text_to_speech(request: TTSRequest):
    """Convert text to speech"""
    try:
        audio_base64 = await eleven_labs_client.text_to_speech(
            text=request.text,
            voice_id=request.voice_id
        )
        
        return AIResponse(
            text=request.text,
            audio_base64=audio_base64
        )
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-websites")
async def suggest_websites(request: WebsiteSuggestionRequest):
    """Get website suggestions based on a topic"""
    try:
        # Generate website suggestions
        suggested_websites = await generate_website_suggestions(request.topic, "")
        
        if not suggested_websites:
            return {
                "success": False,
                "message": "No website suggestions found for this topic",
                "suggested_websites": []
            }
        
        return {
            "success": True,
            "suggested_websites": suggested_websites,
            "topic": request.topic
        }
        
    except Exception as e:
        logger.error(f"Website suggestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/highlight-important")
async def highlight_important(request: HighlightRequest):
    """Analyze page content and identify important sections based on topic"""
    try:
        # Build prompt for AI
        elements_text = "\n\n".join([
            f"[ID: {el['id']}] {el['tag']}: {el['text'][:300]}"
            for el in request.elements[:50]  # Limit to first 50 elements
        ])
        
        prompt = f"""You are analyzing a webpage titled "{request.pageTitle}" to help a user research the topic: "{request.topic}".

Below are sections of the webpage with their IDs. Identify which sections are most relevant and important for understanding "{request.topic}".

Webpage sections:
{elements_text}

Task: Return ONLY a JSON array of IDs for the most important sections. Include 5-15 sections that are most relevant to the topic "{request.topic}".

Example response format: {{"important_ids": [0, 3, 7, 12]}}

Your response (JSON only):"""

        # Call AI
        response = await langchain_service.general_chat(
            query=prompt,
            context=f"Analyzing webpage: {request.pageUrl}"
        )
        
        # Parse response
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*"important_ids".*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            important_ids = result.get('important_ids', [])
        else:
            # Fallback: try to find numbers in response
            numbers = re.findall(r'\d+', response)
            important_ids = [int(n) for n in numbers[:15]]
        
        logger.info(f"Identified {len(important_ids)} important sections for topic: {request.topic}")
        
        return {
            "success": True,
            "important_ids": important_ids,
            "topic": request.topic,
            "count": len(important_ids)
        }
        
    except Exception as e:
        logger.error(f"Highlight error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
