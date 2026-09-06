from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    target_role: Optional[str] = "Software Developer"
    experience_years: Optional[str] = "1-3 years"
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    target_role: str
    experience_years: str
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Interview Schemas ---
class InterviewCreate(BaseModel):
    role: str
    interview_type: Optional[str] = "Technical" # Technical, HR, Mixed
    difficulty: Optional[str] = "Medium"        # Easy, Medium, Hard
    source_type: Optional[str] = "Standard"     # Standard, Resume, Job Description
    total_questions: Optional[int] = 5
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None
    title: Optional[str] = None

class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str
    audio_duration: Optional[float] = 0.0

class CategoryScores(BaseModel):
    technical_knowledge: float
    communication: float
    relevance: float
    confidence: float
    grammar: float
    overall: float

class QuestionDetail(BaseModel):
    id: int
    question_number: int
    question_text: str
    category: str
    difficulty: str
    expected_topics: Optional[str] = None
    user_answer_text: Optional[str] = None
    is_answered: bool
    scores: Optional[CategoryScores] = None
    strengths: Optional[List[str]] = []
    weaknesses: Optional[List[str]] = []
    feedback_summary: Optional[str] = None
    ideal_answer: Optional[str] = None
    follow_up_hint: Optional[str] = None

    class Config:
        from_attributes = True

class EvaluationResult(BaseModel):
    question_id: int
    is_session_completed: bool
    scores: CategoryScores
    strengths: List[str]
    weaknesses: List[str]
    feedback_summary: str
    ideal_answer: str
    next_question: Optional[QuestionDetail] = None

class SessionSummaryResponse(BaseModel):
    id: int
    title: str
    role: str
    interview_type: str
    difficulty: str
    source_type: str
    total_questions: int
    current_question_index: int
    status: str
    overall_score: float
    technical_score: float
    communication_score: float
    relevance_score: float
    confidence_score: float
    grammar_score: float
    summary_feedback: Optional[str] = None
    strengths: Optional[List[str]] = []
    weak_areas: Optional[List[str]] = []
    improvement_tips: Optional[List[str]] = []
    preparation_topics: Optional[List[str]] = []
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuestionDetail] = []

    class Config:
        from_attributes = True

# --- Dashboard & Progress Schemas ---
class ProgressPoint(BaseModel):
    interview_id: int
    title: str
    role: str
    score: float
    date: str

class AnalyticsResponse(BaseModel):
    total_interviews: int
    avg_overall_score: float
    best_score: float
    latest_score: float
    category_averages: Dict[str, float]
    progress_history: List[ProgressPoint]
    strengths_pool: List[str]
    improvements_pool: List[str]
