import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    target_role = Column(String(255), default="Software Developer")
    experience_years = Column(String(50), default="1-3 years")
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    interview_type = Column(String(50), default="Technical")  # Technical, HR, Mixed
    difficulty = Column(String(50), default="Medium")         # Easy, Medium, Hard
    source_type = Column(String(50), default="Standard")     # Standard, Resume, Job Description
    
    resume_text = Column(Text, nullable=True)
    jd_text = Column(Text, nullable=True)
    
    total_questions = Column(Integer, default=5)
    current_question_index = Column(Integer, default=0)
    status = Column(String(50), default="in_progress")       # in_progress, completed
    
    # Overall and category scores (0-100)
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    grammar_score = Column(Float, default=0.0)
    
    # AI Summary & Actionable Recommendations
    summary_feedback = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)          # JSON array string
    weak_areas = Column(Text, nullable=True)         # JSON array string
    improvement_tips = Column(Text, nullable=True)   # JSON array string
    preparation_topics = Column(Text, nullable=True) # JSON array string
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.question_number")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), default="Technical")
    difficulty = Column(String(50), default="Medium")
    expected_topics = Column(Text, nullable=True)
    
    # User Response
    user_answer_text = Column(Text, nullable=True)
    user_audio_duration = Column(Float, default=0.0)
    is_answered = Column(Boolean, default=False)
    
    # Evaluation Scores
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    grammar_score = Column(Float, default=0.0)
    
    # Detailed AI Insights
    strengths = Column(Text, nullable=True)          # JSON string or bullet points
    weaknesses = Column(Text, nullable=True)         # JSON string or bullet points
    feedback_summary = Column(Text, nullable=True)
    ideal_answer = Column(Text, nullable=True)
    follow_up_hint = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
