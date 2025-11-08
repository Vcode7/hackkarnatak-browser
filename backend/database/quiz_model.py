from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime

class QuizScoreModel(BaseModel):
    """Model for storing quiz scores"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = "default_user"
    quiz_type: str = "history"  # Type of quiz (history, bookmarks, etc.)
    score: int  # Number of correct answers
    total_questions: int  # Total number of questions
    percentage: float  # Score percentage
    questions: List[Dict]  # List of questions with user answers
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    time_taken_seconds: Optional[int] = None  # Time taken to complete quiz

class QuizQuestion(BaseModel):
    """Model for a single quiz question"""
    question: str
    options: List[str]  # 4 options
    correct_answer: int  # Index of correct option (0-3)
    explanation: Optional[str] = None  # Explanation for the answer
    source_url: Optional[str] = None  # URL from history that inspired this question
