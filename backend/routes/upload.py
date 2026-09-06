import io
import re
from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from services.resume_parser import resume_parser
from services.auth_helper import get_current_user
import models

router = APIRouter(prefix="/upload", tags=["Resume & JD Uploads"])

class JDAnalysisRequest(BaseModel):
    jd_text: str
    target_company: str = ""

@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(('.pdf', '.txt')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF or TXT document."
        )

    content = await file.read()
    if file.filename.lower().endswith('.pdf'):
        extracted_text = resume_parser.extract_text_from_pdf(content)
    else:
        try:
            extracted_text = content.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = str(content)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded file.")

    analysis = resume_parser.analyze_resume(extracted_text)
    
    # Infer recommended role based on skills
    skills_str = " ".join(analysis["detected_skills"]).lower()
    inferred_role = "Software Developer"
    if "cyber" in extracted_text.lower() or "penetration" in skills_str or "security" in skills_str:
        inferred_role = "Cybersecurity Analyst"
    elif "pandas" in skills_str or "sql" in skills_str or "data analysis" in skills_str:
        inferred_role = "Data Analyst"
    elif "machine learning" in skills_str or "pytorch" in skills_str or "tensorflow" in skills_str:
        inferred_role = "AI/ML Engineer"
    elif "docker" in skills_str or "kubernetes" in skills_str or "aws" in skills_str or "ci/cd" in skills_str:
        inferred_role = "DevOps / Cloud Engineer"
    elif "react" in skills_str and "node" in skills_str:
        inferred_role = "Full Stack Developer"

    return {
        "filename": file.filename,
        "candidate_name": analysis["candidate_name"],
        "detected_skills": analysis["detected_skills"],
        "estimated_experience": analysis["estimated_experience"],
        "inferred_role": inferred_role,
        "resume_text_preview": extracted_text[:1500] + ("..." if len(extracted_text) > 1500 else ""),
        "full_text": extracted_text
    }

@router.post("/analyze-jd")
def analyze_job_description(
    data: JDAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    text = data.jd_text.strip()
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Job description text is too short to analyze.")

    text_lower = text.lower()
    
    # Identify key skills
    skills_found = []
    from services.resume_parser import COMMON_SKILLS
    for s in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(s.lower()) + r'\b', text_lower):
            skills_found.append(s)

    # Inferred role title
    inferred_role = "Software Engineer"
    for r in ["Cybersecurity Analyst", "Data Analyst", "Data Scientist", "Full Stack Developer", "Cloud Architect", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Product Manager"]:
        if r.lower() in text_lower:
            inferred_role = r
            break

    # Inferred difficulty
    difficulty = "Medium"
    if any(k in text_lower for k in ["senior", "lead", "architect", "staff", "principal", "7+ years", "5+ years"]):
        difficulty = "Hard"
    elif any(k in text_lower for k in ["junior", "entry", "intern", "graduate", "associate", "0-1 years"]):
        difficulty = "Easy"

    return {
        "target_company": data.target_company or "Target Company",
        "inferred_role": inferred_role,
        "difficulty": difficulty,
        "key_requirements": skills_found[:8],
        "word_count": len(text.split()),
        "full_text": text
    }
