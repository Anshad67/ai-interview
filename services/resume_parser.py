import io
import re
from typing import Dict, Any, List
from pypdf import PdfReader

COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Flask",
    "Django", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "Git", "CI/CD", "REST API", "GraphQL",
    "Machine Learning", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch",
    "Cybersecurity", "Network Security", "Penetration Testing", "Linux", "Java", "C++", "C#"
]

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        text = ""
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            print(f"[ResumeParser] Error extracting PDF: {e}")
        return text.strip()

    @classmethod
    def analyze_resume(cls, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        
        # Detect matching skills
        detected_skills = []
        for skill in COMMON_SKILLS:
            if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
                detected_skills.append(skill)

        # Estimate experience
        exp_match = re.search(r'(\d+)\+?\s*(?:years|yrs)\s*(?:of\s*)?experience', text_lower)
        estimated_exp = f"{exp_match.group(1)}+ years" if exp_match else "1-3 years"

        # Detect candidate name heuristic
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        candidate_name = lines[0] if lines and len(lines[0].split()) <= 4 else "Candidate"

        return {
            "candidate_name": candidate_name,
            "detected_skills": detected_skills,
            "estimated_experience": estimated_exp,
            "word_count": len(text.split()),
            "raw_text": text
        }

resume_parser = ResumeParser()
