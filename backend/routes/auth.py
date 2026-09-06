from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_helper import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    new_user = models.User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        target_role=user_data.target_role or "Software Developer",
        experience_years=user_data.experience_years or "1-3 years",
        bio=user_data.bio
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/demo-login", response_model=schemas.TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    demo_email = "demo.candidate@aiinterview.com"
    user = db.query(models.User).filter(models.User.email == demo_email).first()
    if not user:
        user = models.User(
            email=demo_email,
            hashed_password=get_password_hash("demo1234"),
            full_name="Alex Morgan",
            target_role="Full Stack Developer",
            experience_years="2-4 years",
            bio="Software engineer preparing for Senior Developer and Full-Stack roles."
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Seed sample mock interview history if new demo user to make dashboard rich immediately
        session1 = models.InterviewSession(
            user_id=user.id,
            title="Junior Frontend Developer Mock",
            role="Frontend Developer",
            interview_type="Technical",
            difficulty="Easy",
            source_type="Standard",
            total_questions=3,
            current_question_index=3,
            status="completed",
            overall_score=65.0,
            technical_score=68.0,
            communication_score=70.0,
            relevance_score=62.0,
            confidence_score=60.0,
            grammar_score=78.0,
            summary_feedback="Good fundamental knowledge of HTML, CSS, and basic JavaScript. Stated concepts clearly but could give more concrete project examples.",
            strengths='["Clean explanation of DOM manipulation", "Good grasp of CSS flexbox and grid"]',
            weak_areas='["Hesitation on asynchronous JavaScript promises", "Lack of deep component lifecycle discussion"]',
            improvement_tips='["Practice explaining React state management trade-offs", "Use the STAR method for behavioral queries"]',
            preparation_topics='["React Hooks & Context API", "Asynchronous JavaScript & Event Loop", "CSS Performance & Responsive Design"]'
        )
        db.add(session1)

        session2 = models.InterviewSession(
            user_id=user.id,
            title="Full Stack Software Engineer Mock",
            role="Full Stack Developer",
            interview_type="Technical",
            difficulty="Medium",
            source_type="Standard",
            total_questions=3,
            current_question_index=3,
            status="completed",
            overall_score=74.0,
            technical_score=76.0,
            communication_score=78.0,
            relevance_score=75.0,
            confidence_score=70.0,
            grammar_score=82.0,
            summary_feedback="Notable improvement in technical articulation and database indexing explanations. Handled REST API principles very well.",
            strengths='["Strong explanation of SQL vs NoSQL trade-offs", "Confident delivery with minimal filler words"]',
            weak_areas='["Could elaborate on caching strategies using Redis", "Missed discussing concurrency control"]',
            improvement_tips='["Include trade-off analysis in all architecture questions", "Elaborate on production incident debugging"]',
            preparation_topics='["Distributed Caching & Redis", "Database Indexing & Query Tuning", "Microservices Architecture"]'
        )
        db.add(session2)

        session3 = models.InterviewSession(
            user_id=user.id,
            title="Senior Full Stack Engineer - Technical & System Design",
            role="Full Stack Developer",
            interview_type="Mixed",
            difficulty="Hard",
            source_type="Standard",
            total_questions=3,
            current_question_index=3,
            status="completed",
            overall_score=82.0,
            technical_score=84.0,
            communication_score=85.0,
            relevance_score=88.0,
            confidence_score=79.0,
            grammar_score=86.0,
            summary_feedback="Excellent interview performance! Demonstrated deep understanding of system scalability, distributed architectures, and strong leadership communication.",
            strengths='["Outstanding system design breakdown for distributed services", "Authoritative communication tone", "Clear explanation of ACID properties and MVCC"]',
            weak_areas='["Could discuss cost optimization alongside performance", "Deepen understanding of Raft consensus edge cases"]',
            improvement_tips='["Highlight business impact and cost metrics during system design", "Keep sharpening distributed systems concepts"]',
            preparation_topics='["Advanced Distributed Systems & Consensus Protocols", "Observability (OpenTelemetry / Prometheus)", "Executive Behavioral Storytelling"]'
        )
        db.add(session3)
        db.commit()

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user
