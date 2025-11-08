from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from database.mongodb import get_database
from database.quiz_model import QuizScoreModel, QuizQuestion
from services.groq_client import groq_client
import logging
import json
import random
import os
logger = logging.getLogger(__name__)
router = APIRouter()

class GenerateQuizRequest(BaseModel):
    user_id: str = "default_user"
    num_questions: int = 10

class SaveQuizScoreRequest(BaseModel):
    user_id: str = "default_user"
    score: int
    total_questions: int
    questions: List[Dict]
    time_taken_seconds: Optional[int] = None

@router.post("/quiz/generate")
async def generate_quiz(request: GenerateQuizRequest):
    """Generate a quiz based on user's browsing history"""
    try:
        db = get_database()
        history_collection = db.history
        
        # Get recent browsing history (last 50 items)
        cursor = history_collection.find({"user_id": request.user_id}).sort("visited_at", -1).limit(50)
        history_items = await cursor.to_list(length=50)
        
        if len(history_items) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Not enough browsing history to generate a quiz. Browse more pages first!"
            )
        
        # Prepare history context for AI
        history_context = []
        for item in history_items[:30]:  # Use top 30 for context
            history_context.append({
                "title": item.get("title", "Unknown"),
                "url": item.get("url", ""),
                "visited_at": item.get("visited_at", "").isoformat() if item.get("visited_at") else ""
            })
        
        # Generate quiz using AI
        prompt = f"""Based on the following browsing history, create {request.num_questions} multiple-choice quiz questions to test knowledge about the topics the user has been learning about.

Browsing History:
{json.dumps(history_context[:20], indent=2)}

Generate exactly {request.num_questions} questions in the following JSON format:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Brief explanation of the correct answer",
      "source_url": "URL from history that inspired this question"
    }}
  ]
}}

Rules:
1. Questions should be about the topics/subjects in the browsing history
2. Make questions educational and interesting
3. Each question must have exactly 4 options
4. correct_answer is the index (0-3) of the correct option
5. Include a brief explanation for each answer
6. Reference the source URL from the history
7. Vary difficulty levels
8. Return ONLY valid JSON, no additional text

JSON Response:"""

        # Call Groq API
        completion = groq_client.client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a quiz generator. Generate educational quiz questions based on browsing history. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=3000
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            
            quiz_data = json.loads(response_text)
            questions = quiz_data.get("questions", [])
            
            if len(questions) < request.num_questions:
                logger.warning(f"AI generated only {len(questions)} questions instead of {request.num_questions}")
            
            # Validate and format questions
            formatted_questions = []
            for q in questions[:request.num_questions]:
                if len(q.get("options", [])) == 4:
                    formatted_questions.append({
                        "question": q.get("question", ""),
                        "options": q.get("options", []),
                        "correct_answer": q.get("correct_answer", 0),
                        "explanation": q.get("explanation", ""),
                        "source_url": q.get("source_url", "")
                    })
            
            if len(formatted_questions) < 5:
                raise ValueError("Not enough valid questions generated")
            
            return {
                "success": True,
                "questions": formatted_questions,
                "total_questions": len(formatted_questions)
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")
            raise HTTPException(status_code=500, detail="Failed to generate quiz. Please try again.")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/save-score")
async def save_quiz_score(request: SaveQuizScoreRequest):
    """Save quiz score to database"""
    try:
        db = get_database()
        quiz_scores_collection = db.quiz_scores
        
        percentage = (request.score / request.total_questions) * 100
        
        quiz_score = QuizScoreModel(
            user_id=request.user_id,
            quiz_type="history",
            score=request.score,
            total_questions=request.total_questions,
            percentage=percentage,
            questions=request.questions,
            completed_at=datetime.utcnow(),
            time_taken_seconds=request.time_taken_seconds
        )
        
        result = await quiz_scores_collection.insert_one(quiz_score.dict(by_alias=True, exclude={"id"}))
        
        return {
            "success": True,
            "score_id": str(result.inserted_id),
            "percentage": percentage,
            "message": f"Quiz completed! You scored {request.score}/{request.total_questions} ({percentage:.1f}%)"
        }
        
    except Exception as e:
        logger.error(f"Error saving quiz score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quiz/scores")
async def get_quiz_scores(user_id: str = "default_user", limit: int = 10):
    """Get recent quiz scores"""
    try:
        db = get_database()
        quiz_scores_collection = db.quiz_scores
        
        cursor = quiz_scores_collection.find({"user_id": user_id}).sort("completed_at", -1).limit(limit)
        scores = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and format dates
        for score in scores:
            score["_id"] = str(score["_id"])
            if "completed_at" in score:
                score["completed_at"] = score["completed_at"].isoformat()
        
        return {
            "success": True,
            "scores": scores,
            "count": len(scores)
        }
        
    except Exception as e:
        logger.error(f"Error getting quiz scores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quiz/stats")
async def get_quiz_stats(user_id: str = "default_user"):
    """Get quiz statistics"""
    try:
        db = get_database()
        quiz_scores_collection = db.quiz_scores
        
        cursor = quiz_scores_collection.find({"user_id": user_id})
        all_scores = await cursor.to_list(length=None)
        
        if not all_scores:
            return {
                "success": True,
                "stats": {
                    "total_quizzes": 0,
                    "average_score": 0,
                    "best_score": 0,
                    "total_questions_answered": 0
                }
            }
        
        total_quizzes = len(all_scores)
        average_percentage = sum(s.get("percentage", 0) for s in all_scores) / total_quizzes
        best_score = max(s.get("percentage", 0) for s in all_scores)
        total_questions = sum(s.get("total_questions", 0) for s in all_scores)
        
        return {
            "success": True,
            "stats": {
                "total_quizzes": total_quizzes,
                "average_score": round(average_percentage, 1),
                "best_score": round(best_score, 1),
                "total_questions_answered": total_questions
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting quiz stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
