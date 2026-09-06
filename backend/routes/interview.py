import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.ai_service import ai_service
from services.auth_helper import get_current_user
from services.pdf_service import generate_interview_pdf

router = APIRouter(prefix="/interview", tags=["Mock Interview"])

@router.post("/create", response_model=schemas.SessionSummaryResponse)
async def create_interview(
    data: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    title = data.title or f"{data.role} — {data.difficulty} {data.interview_type} Interview"
    
    session = models.InterviewSession(
        user_id=current_user.id,
        title=title,
        role=data.role,
        interview_type=data.interview_type or "Technical",
        difficulty=data.difficulty or "Medium",
        source_type=data.source_type or "Standard",
        resume_text=data.resume_text,
        jd_text=data.jd_text,
        total_questions=data.total_questions or 5,
        current_question_index=0,
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate initial pool of questions
    raw_questions = await ai_service.generate_questions(
        role=data.role,
        interview_type=data.interview_type or "Technical",
        difficulty=data.difficulty or "Medium",
        source_type=data.source_type or "Standard",
        resume_text=data.resume_text,
        jd_text=data.jd_text,
        count=data.total_questions or 5
    )

    created_questions = []
    for q_data in raw_questions:
        q_obj = models.InterviewQuestion(
            session_id=session.id,
            question_number=q_data.get("question_number", len(created_questions) + 1),
            question_text=q_data.get("question_text", "Explain your approach to this role."),
            category=q_data.get("category", "Technical"),
            difficulty=q_data.get("difficulty", session.difficulty),
            expected_topics=q_data.get("expected_topics", "")
        )
        db.add(q_obj)
        created_questions.append(q_obj)

    db.commit()
    db.refresh(session)

    return _format_session_response(session)

@router.get("/{session_id}/current")
def get_current_interview(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return _format_session_response(session)

@router.post("/submit-answer", response_model=schemas.EvaluationResult)
async def submit_answer(
    data: schemas.AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == data.question_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == question.session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=403, detail="Not authorized to submit for this session")

    # Evaluate answer using AI engine
    evaluation = await ai_service.evaluate_answer(
        role=session.role,
        question_text=question.question_text,
        expected_topics=question.expected_topics or "",
        user_answer=data.answer_text,
        difficulty=question.difficulty or session.difficulty
    )

    # Save to question record
    question.user_answer_text = data.answer_text
    question.user_audio_duration = data.audio_duration or 0.0
    question.is_answered = True
    question.technical_score = evaluation["technical_knowledge"]
    question.communication_score = evaluation["communication"]
    question.relevance_score = evaluation["relevance"]
    question.confidence_score = evaluation["confidence"]
    question.grammar_score = evaluation["grammar"]
    question.overall_score = evaluation["overall"]
    question.strengths = json.dumps(evaluation["strengths"])
    question.weaknesses = json.dumps(evaluation["weaknesses"])
    question.feedback_summary = evaluation["feedback_summary"]
    question.ideal_answer = evaluation["ideal_answer"]
    question.follow_up_hint = evaluation["follow_up_hint"]

    # Increment question index
    session.current_question_index = question.question_number

    # Check if there is a next question
    next_question_obj = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.session_id == session.id,
        models.InterviewQuestion.question_number == question.question_number + 1
    ).first()

    is_session_completed = next_question_obj is None

    if is_session_completed:
        # Complete session and calculate full session rollup
        all_questions = db.query(models.InterviewQuestion).filter(
            models.InterviewQuestion.session_id == session.id
        ).all()
        
        q_evals = []
        for q in all_questions:
            q_evals.append({
                "technical_score": q.technical_score or 0.0,
                "communication_score": q.communication_score or 0.0,
                "relevance_score": q.relevance_score or 0.0,
                "confidence_score": q.confidence_score or 0.0,
                "grammar_score": q.grammar_score or 0.0,
                "overall_score": q.overall_score or 0.0,
                "strengths": json.loads(q.strengths) if q.strengths else [],
                "weaknesses": json.loads(q.weaknesses) if q.weaknesses else []
            })

        summary = await ai_service.generate_session_summary(
            role=session.role,
            difficulty=session.difficulty,
            question_evaluations=q_evals
        )

        session.status = "completed"
        session.completed_at = datetime.datetime.utcnow()
        session.overall_score = summary["overall_score"]
        session.technical_score = summary["technical_score"]
        session.communication_score = summary["communication_score"]
        session.relevance_score = summary["relevance_score"]
        session.confidence_score = summary["confidence_score"]
        session.grammar_score = summary["grammar_score"]
        session.summary_feedback = summary["summary_feedback"]
        session.strengths = json.dumps(summary["strengths"])
        session.weak_areas = json.dumps(summary["weak_areas"])
        session.improvement_tips = json.dumps(summary["improvement_tips"])
        session.preparation_topics = json.dumps(summary["preparation_topics"])

    db.commit()
    db.refresh(session)
    db.refresh(question)

    formatted_next = None
    if next_question_obj:
        formatted_next = _format_question_detail(next_question_obj)

    return {
        "question_id": question.id,
        "is_session_completed": is_session_completed,
        "scores": {
            "technical_knowledge": question.technical_score,
            "communication": question.communication_score,
            "relevance": question.relevance_score,
            "confidence": question.confidence_score,
            "grammar": question.grammar_score,
            "overall": question.overall_score
        },
        "strengths": evaluation["strengths"],
        "weaknesses": evaluation["weaknesses"],
        "feedback_summary": evaluation["feedback_summary"],
        "ideal_answer": evaluation["ideal_answer"],
        "next_question": formatted_next
    }

@router.get("/{session_id}/report", response_model=schemas.SessionSummaryResponse)
def get_interview_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Interview report not found")

    return _format_session_response(session)

@router.get("/{session_id}/pdf")
def download_interview_pdf(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")

    questions = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.session_id == session.id
    ).order_by(models.InterviewQuestion.question_number).all()

    pdf_bytes = generate_interview_pdf(session, questions)
    
    filename = f"AI_Interview_Report_{session.role.replace(' ', '_')}_{session.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

def _format_question_detail(q: models.InterviewQuestion) -> Dict[str, Any]:
    strengths = []
    if q.strengths:
        try:
            strengths = json.loads(q.strengths) if q.strengths.startswith("[") else [q.strengths]
        except Exception:
            strengths = [q.strengths]
            
    weaknesses = []
    if q.weaknesses:
        try:
            weaknesses = json.loads(q.weaknesses) if q.weaknesses.startswith("[") else [q.weaknesses]
        except Exception:
            weaknesses = [q.weaknesses]

    scores = None
    if q.is_answered:
        scores = {
            "technical_knowledge": q.technical_score or 0.0,
            "communication": q.communication_score or 0.0,
            "relevance": q.relevance_score or 0.0,
            "confidence": q.confidence_score or 0.0,
            "grammar": q.grammar_score or 0.0,
            "overall": q.overall_score or 0.0
        }

    return {
        "id": q.id,
        "question_number": q.question_number,
        "question_text": q.question_text,
        "category": q.category,
        "difficulty": q.difficulty,
        "expected_topics": q.expected_topics,
        "user_answer_text": q.user_answer_text,
        "is_answered": q.is_answered,
        "scores": scores,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "feedback_summary": q.feedback_summary,
        "ideal_answer": q.ideal_answer,
        "follow_up_hint": q.follow_up_hint
    }

def _format_session_response(session: models.InterviewSession) -> Dict[str, Any]:
    strengths = []
    if session.strengths:
        try:
            strengths = json.loads(session.strengths) if session.strengths.startswith("[") else [session.strengths]
        except Exception:
            strengths = [session.strengths]

    weak_areas = []
    if session.weak_areas:
        try:
            weak_areas = json.loads(session.weak_areas) if session.weak_areas.startswith("[") else [session.weak_areas]
        except Exception:
            weak_areas = [session.weak_areas]

    improvement_tips = []
    if session.improvement_tips:
        try:
            improvement_tips = json.loads(session.improvement_tips) if session.improvement_tips.startswith("[") else [session.improvement_tips]
        except Exception:
            improvement_tips = [session.improvement_tips]

    preparation_topics = []
    if session.preparation_topics:
        try:
            preparation_topics = json.loads(session.preparation_topics) if session.preparation_topics.startswith("[") else [session.preparation_topics]
        except Exception:
            preparation_topics = [session.preparation_topics]

    formatted_questions = [_format_question_detail(q) for q in session.questions]

    return {
        "id": session.id,
        "title": session.title,
        "role": session.role,
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "source_type": session.source_type,
        "total_questions": session.total_questions,
        "current_question_index": session.current_question_index,
        "status": session.status,
        "overall_score": session.overall_score,
        "technical_score": session.technical_score,
        "communication_score": session.communication_score,
        "relevance_score": session.relevance_score,
        "confidence_score": session.confidence_score,
        "grammar_score": session.grammar_score,
        "summary_feedback": session.summary_feedback,
        "strengths": strengths,
        "weak_areas": weak_areas,
        "improvement_tips": improvement_tips,
        "preparation_topics": preparation_topics,
        "created_at": session.created_at,
        "completed_at": session.completed_at,
        "questions": formatted_questions
    }
