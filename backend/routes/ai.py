from fastapi import APIRouter, HTTPException
from models import AIRequest, AIResponse, SummarizeRequest, QuestionRequest, TTSRequest
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.langchain_utils import langchain_service
from services.eleven_labs import eleven_labs_client
from services.vector_store import vector_store
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

class GenerateQuestionsRequest(BaseModel):
    topic: str

class AnswerQuestionsRequest(BaseModel):
    topic: str
    questions: List[str]
    answers: List[str]

@router.post("/chat", response_model=AIResponse)
async def chat(request: AIRequest):
    """General AI chat endpoint with RAG (Retrieval Augmented Generation)"""
    try:
        # Query vector store for relevant context from browsing history
        relevant_chunks = await vector_store.query_relevant_content(
            query=request.query,
            n_results=3  # Get top 3 most relevant chunks
        )
        
        # Build enhanced context from vector store results
        enhanced_context = request.context or ""
        
        if relevant_chunks:
            logger.info(f"Found {len(relevant_chunks)} relevant chunks from browsing history")
            vector_context = "\n\n--- Relevant information from your browsing history ---\n"
            
            for i, chunk in enumerate(relevant_chunks, 1):
                metadata = chunk['metadata']
                vector_context += f"\n[Source {i}] {metadata['title']} ({metadata['url']})\n"
                vector_context += f"Accessed: {metadata['access_date']}\n"
                vector_context += f"Content: {chunk['content'][:500]}...\n"
            
            enhanced_context = vector_context + "\n\n" + enhanced_context
        
        # Generate text response with enhanced context
        text_response = await langchain_service.general_chat(
            query=request.query,
            context=enhanced_context
        )
        
        # Generate voice response (optional - don't fail if quota exceeded)
        audio_base64 = None
        try:
            audio_base64 = await eleven_labs_client.text_to_speech(text_response)
        except Exception as tts_error:
            logger.warning(f"TTS generation failed (continuing without audio): {tts_error}")
        
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
        
        # Generate voice (optional)
        audio_base64 = None
        try:
            audio_base64 = await eleven_labs_client.text_to_speech(summary)
        except Exception as tts_error:
            logger.warning(f"TTS generation failed (continuing without audio): {tts_error}")
        
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
        
        # Generate voice (optional)
        audio_base64 = None
        try:
            audio_base64 = await eleven_labs_client.text_to_speech(answer)
        except Exception as tts_error:
            logger.warning(f"TTS generation failed (continuing without audio): {tts_error}")
        
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


@router.post("/generate-questions")
async def generate_questions(request: GenerateQuestionsRequest):
    """Generate AI questions to assess user's knowledge about a topic"""
    try:
        prompt = f"""You are an educational assistant. Generate exactly 5 questions to assess a user's knowledge level about the topic: "{request.topic}".

The questions should:
1. Range from basic to intermediate difficulty
2. Help understand what the user already knows
3. Be clear and concise
4. Cover different aspects of the topic

Return ONLY a JSON object with this exact format:
{{
    "questions": [
        "Question 1 text here?",
        "Question 2 text here?",
        "Question 3 text here?",
        "Question 4 text here?",
        "Question 5 text here?"
    ]
}}

Topic: {request.topic}

Your response (JSON only):"""

        # Call AI to generate questions
        response = await langchain_service.general_chat(
            query=prompt,
            context=f"Generating assessment questions for topic: {request.topic}"
        )
        
        # Parse JSON response
        json_match = re.search(r'\{.*"questions".*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            questions = result.get('questions', [])
        else:
            # Fallback: extract questions manually
            questions = []
            lines = response.split('\n')
            for line in lines:
                line = line.strip()
                if line and ('?' in line or line[0].isdigit()):
                    # Clean up the question
                    question = re.sub(r'^\d+[\.\)]\s*', '', line)
                    question = question.strip('"\'')
                    if question and len(questions) < 5:
                        questions.append(question)
        
        # Ensure we have exactly 5 questions
        if len(questions) < 5:
            questions.extend([
                f"What do you already know about {request.topic}?",
                f"What specific aspect of {request.topic} interests you most?",
                f"What is your current skill level with {request.topic}?",
                f"What would you like to learn about {request.topic}?",
                f"Have you studied {request.topic} before?"
            ])
        
        questions = questions[:5]
        
        logger.info(f"Generated {len(questions)} questions for topic: {request.topic}")
        
        return {
            "success": True,
            "questions": questions,
            "topic": request.topic
        }
        
    except Exception as e:
        logger.error(f"Question generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-websites-ai")
async def suggest_websites_ai(request: AnswerQuestionsRequest):
    """Generate AI-powered website suggestions based on user's answers"""
    try:
        # Build context from Q&A
        qa_context = "\n".join([
            f"Q: {q}\nA: {a}"
            for q, a in zip(request.questions, request.answers)
        ])
        
        prompt = f"""You are an educational resource curator. Based on the user's knowledge level and interests about "{request.topic}", suggest the 10 most relevant and helpful websites.

User's Assessment:
{qa_context}

Task: Recommend exactly 10 websites that match the user's knowledge level and learning goals. Include a mix of:
- Beginner-friendly resources if they're new to the topic
- Advanced resources if they're experienced
- Interactive learning platforms
- Documentation and reference sites
- Community forums or discussion boards

Return ONLY a JSON object with this exact format:
{{
    "websites": [
        {{
            "title": "Website Name",
            "description": "Brief description of what this site offers and why it's relevant",
            "url": "https://example.com",
            "difficulty": "beginner|intermediate|advanced"
        }}
    ]
}}

Provide real, working URLs for popular educational websites. Your response (JSON only):"""

        # Call AI to generate suggestions
        response = await langchain_service.general_chat(
            query=prompt,
            context=f"Generating personalized website suggestions for: {request.topic}"
        )
        
        # Parse JSON response
        json_match = re.search(r'\{.*"websites".*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            websites = result.get('websites', [])
        else:
            # Fallback to predefined suggestions
            websites = await generate_website_suggestions(request.topic, "")
        
        # Ensure we have up to 10 websites
        websites = websites[:10]
        
        # If we got fewer than 10, supplement with predefined ones
        if len(websites) < 10:
            fallback = await generate_website_suggestions(request.topic, "")
            for site in fallback:
                if len(websites) >= 10:
                    break
                if not any(w.get('url') == site['url'] for w in websites):
                    websites.append(site)
        
        logger.info(f"Generated {len(websites)} AI-powered suggestions for topic: {request.topic}")
        
        return {
            "success": True,
            "suggested_websites": websites,
            "topic": request.topic,
            "count": len(websites)
        }
        
    except Exception as e:
        logger.error(f"AI website suggestion error: {e}")
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
