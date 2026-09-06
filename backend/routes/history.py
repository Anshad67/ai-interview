import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_helper import get_current_user
from routes.interview import _format_session_response

router = APIRouter(prefix="/history", tags=["Interview History & Analytics"])

@router.get("", response_model=List[schemas.SessionSummaryResponse])
def get_all_interviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).all()

    return [_format_session_response(s) for s in sessions]

@router.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).order_by(models.InterviewSession.created_at.asc()).all()

    if not sessions:
        return {
            "total_interviews": 0,
            "avg_overall_score": 0.0,
            "best_score": 0.0,
            "latest_score": 0.0,
            "category_averages": {
                "technical_knowledge": 0.0,
                "communication": 0.0,
                "relevance": 0.0,
                "confidence": 0.0,
                "grammar": 0.0
            },
            "progress_history": [],
            "strengths_pool": ["Complete mock interviews to discover your top strengths"],
            "improvements_pool": ["Complete mock interviews to generate personalized roadmaps"]
        }

    total = len(sessions)
    scores = [s.overall_score for s in sessions]
    avg_score = round(sum(scores) / total, 1)
    best_score = round(max(scores), 1)
    latest_score = round(sessions[-1].overall_score, 1)

    avg_tech = round(sum(s.technical_score for s in sessions) / total, 1)
    avg_comm = round(sum(s.communication_score for s in sessions) / total, 1)
    avg_rel = round(sum(s.relevance_score for s in sessions) / total, 1)
    avg_conf = round(sum(s.confidence_score for s in sessions) / total, 1)
    avg_gram = round(sum(s.grammar_score for s in sessions) / total, 1)

    progress_history = []
    for idx, s in enumerate(sessions):
        progress_history.append({
            "interview_id": s.id,
            "title": f"Interview {idx + 1}: {s.role}",
            "role": s.role,
            "score": round(s.overall_score, 1),
            "date": s.created_at.strftime("%b %d") if s.created_at else f"Round {idx+1}"
        })

    # Strengths pool
    strengths_pool = []
    improvements_pool = []
    for s in sessions[-3:]: # Look at recent sessions
        if s.strengths:
            try:
                items = json.loads(s.strengths) if s.strengths.startswith("[") else [s.strengths]
                strengths_pool.extend(items)
            except Exception:
                pass
        if s.weak_areas:
            try:
                items = json.loads(s.weak_areas) if s.weak_areas.startswith("[") else [s.weak_areas]
                improvements_pool.extend(items)
            except Exception:
                pass

    return {
        "total_interviews": total,
        "avg_overall_score": avg_score,
        "best_score": best_score,
        "latest_score": latest_score,
        "category_averages": {
            "technical_knowledge": avg_tech,
            "communication": avg_comm,
            "relevance": avg_rel,
            "confidence": avg_conf,
            "grammar": avg_gram
        },
        "progress_history": progress_history,
        "strengths_pool": list(dict.fromkeys(strengths_pool))[:5],
        "improvements_pool": list(dict.fromkeys(improvements_pool))[:5]
    }

@router.delete("/{session_id}")
def delete_interview(
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

    db.delete(session)
    db.commit()
    return {"message": "Interview session deleted successfully"}
