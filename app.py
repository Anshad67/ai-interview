import os
import json
import re
import datetime
import hashlib
import hmac
import urllib.request
import urllib.parse
from flask import Flask, request, jsonify, make_response, send_from_directory, redirect
from flask_cors import CORS
from db import get_db, init_db
from services.ai_service import ai_service
from services.resume_parser import resume_parser

FRONTEND_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

app = Flask(__name__, static_folder=FRONTEND_DIST_DIR if os.path.exists(FRONTEND_DIST_DIR) else None, static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})


JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_ai_interview_coach_key_2026")

def hash_password(password: str) -> str:
    return hashlib.sha256((password + JWT_SECRET).encode('utf-8')).hexdigest()

def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat()
    }
    raw = json.dumps(payload)
    sig = hmac.new(JWT_SECRET.encode('utf-8'), raw.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{raw.encode('utf-8').hex()}.{sig}"

def verify_token(token: str):
    if not token:
        return None
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        parts = token.split(".")
        if len(parts) != 2:
            return None
        raw_bytes = bytes.fromhex(parts[0])
        sig = parts[1]
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), raw_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(raw_bytes.decode('utf-8'))
        return payload.get("sub")
    except Exception:
        return None

def get_current_user_from_req():
    auth_header = request.headers.get("Authorization")
    email = verify_token(auth_header)
    conn = get_db()
    cursor = conn.cursor()
    if not email:
        cursor.execute("SELECT * FROM users WHERE email = 'demo.candidate@aiinterview.com'")
        user = cursor.fetchone()
        return dict(user) if user else None
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    return dict(user) if user else None

# ----------------- AUTH ROUTES ----------------- #

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    target_role = data.get("target_role", "Software Developer")
    experience_years = data.get("experience_years", "1-3 years")
    bio = data.get("bio", "")

    if not email or not password or not full_name:
        return jsonify({"detail": "Email, password, and full name are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        return jsonify({"detail": "An account with this email already exists"}), 400

    pwd_hash = hash_password(password)
    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name, target_role, experience_years, bio)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (email, pwd_hash, full_name, target_role, experience_years, bio))
    conn.commit()
    user_id = cursor.lastrowid
    
    token = create_token(email)
    cursor.execute("SELECT id, email, full_name, target_role, experience_years, bio, created_at FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    return jsonify({
        "access_token": token,
        "token_type": "bearer",
        "user": user
    })

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    if not user or user["password_hash"] != hash_password(password):
        # Check if demo candidate fallback password
        if email == "demo.candidate@aiinterview.com" and password == "demo1234":
            pass
        else:
            return jsonify({"detail": "Invalid email or password"}), 401

    token = create_token(email)
    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    return jsonify({
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    })

@app.route("/api/auth/demo-login", methods=["POST"])
def demo_login():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = 'demo.candidate@aiinterview.com'")
    user = cursor.fetchone()
    if not user:
        init_db()
        cursor.execute("SELECT * FROM users WHERE email = 'demo.candidate@aiinterview.com'")
        user = cursor.fetchone()

    token = create_token("demo.candidate@aiinterview.com")
    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    return jsonify({
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    })

@app.route("/api/auth/me", methods=["GET"])
def me():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401
    user.pop("password_hash", None)
    return jsonify(user)

# ----------------- INTERVIEW ROUTES ----------------- #

def format_question_dict(q_row):
    strengths = []
    if q_row["strengths"]:
        try:
            strengths = json.loads(q_row["strengths"]) if q_row["strengths"].startswith("[") else [q_row["strengths"]]
        except Exception:
            strengths = [q_row["strengths"]]
    weaknesses = []
    if q_row["weaknesses"]:
        try:
            weaknesses = json.loads(q_row["weaknesses"]) if q_row["weaknesses"].startswith("[") else [q_row["weaknesses"]]
        except Exception:
            weaknesses = [q_row["weaknesses"]]

    scores = None
    if q_row["is_answered"]:
        scores = {
            "technical_knowledge": q_row["technical_score"] or 0.0,
            "communication": q_row["communication_score"] or 0.0,
            "relevance": q_row["relevance_score"] or 0.0,
            "confidence": q_row["confidence_score"] or 0.0,
            "grammar": q_row["grammar_score"] or 0.0,
            "overall": q_row["overall_score"] or 0.0
        }

    return {
        "id": q_row["id"],
        "question_number": q_row["question_number"],
        "question_text": q_row["question_text"],
        "category": q_row["category"],
        "difficulty": q_row["difficulty"],
        "expected_topics": q_row["expected_topics"],
        "user_answer_text": q_row["user_answer_text"],
        "is_answered": bool(q_row["is_answered"]),
        "scores": scores,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "feedback_summary": q_row["feedback_summary"],
        "ideal_answer": q_row["ideal_answer"],
        "follow_up_hint": q_row["follow_up_hint"]
    }

def format_session_dict(s_row, questions_rows=None):
    strengths = []
    if s_row["strengths"]:
        try:
            strengths = json.loads(s_row["strengths"]) if s_row["strengths"].startswith("[") else [s_row["strengths"]]
        except Exception:
            strengths = [s_row["strengths"]]

    weak_areas = []
    if s_row["weak_areas"]:
        try:
            weak_areas = json.loads(s_row["weak_areas"]) if s_row["weak_areas"].startswith("[") else [s_row["weak_areas"]]
        except Exception:
            weak_areas = [s_row["weak_areas"]]

    improvement_tips = []
    if s_row["improvement_tips"]:
        try:
            improvement_tips = json.loads(s_row["improvement_tips"]) if s_row["improvement_tips"].startswith("[") else [s_row["improvement_tips"]]
        except Exception:
            improvement_tips = [s_row["improvement_tips"]]

    preparation_topics = []
    if s_row["preparation_topics"]:
        try:
            preparation_topics = json.loads(s_row["preparation_topics"]) if s_row["preparation_topics"].startswith("[") else [s_row["preparation_topics"]]
        except Exception:
            preparation_topics = [s_row["preparation_topics"]]

    formatted_questions = [format_question_dict(q) for q in (questions_rows or [])]

    return {
        "id": s_row["id"],
        "title": s_row["title"],
        "role": s_row["role"],
        "interview_type": s_row["interview_type"],
        "difficulty": s_row["difficulty"],
        "source_type": s_row["source_type"],
        "total_questions": s_row["total_questions"],
        "current_question_index": s_row["current_question_index"],
        "status": s_row["status"],
        "overall_score": s_row["overall_score"] or 0.0,
        "technical_score": s_row["technical_score"] or 0.0,
        "communication_score": s_row["communication_score"] or 0.0,
        "relevance_score": s_row["relevance_score"] or 0.0,
        "confidence_score": s_row["confidence_score"] or 0.0,
        "grammar_score": s_row["grammar_score"] or 0.0,
        "summary_feedback": s_row["summary_feedback"],
        "strengths": strengths,
        "weak_areas": weak_areas,
        "improvement_tips": improvement_tips,
        "preparation_topics": preparation_topics,
        "created_at": s_row["created_at"],
        "completed_at": s_row["completed_at"],
        "questions": formatted_questions
    }

@app.route("/api/interview/create", methods=["POST"])
def create_interview():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    data = request.get_json() or {}
    role = data.get("role", "Software Developer")
    interview_type = data.get("interview_type", "Technical")
    difficulty = data.get("difficulty", "Medium")
    source_type = data.get("source_type", "Standard")
    resume_text = data.get("resume_text")
    jd_text = data.get("jd_text")
    total_questions = int(data.get("total_questions", 5))
    title = data.get("title") or f"{role} — {difficulty} {interview_type} Interview"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO interview_sessions (
        user_id, title, role, interview_type, difficulty, source_type,
        resume_text, jd_text, total_questions, current_question_index, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'in_progress')
    """, (user["id"], title, role, interview_type, difficulty, source_type, resume_text, jd_text, total_questions))
    conn.commit()
    session_id = cursor.lastrowid

    # Generate questions via AI Service
    raw_questions = ai_service._generate_questions_fallback(
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        source_type=source_type,
        resume_text=resume_text,
        jd_text=jd_text,
        count=total_questions
    )

    for q in raw_questions:
        cursor.execute("""
        INSERT INTO interview_questions (
            session_id, question_number, question_text, category, difficulty, expected_topics
        ) VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, q["question_number"], q["question_text"], q["category"], q.get("difficulty", difficulty), q.get("expected_topics", "")))

    conn.commit()

    cursor.execute("SELECT * FROM interview_sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    cursor.execute("SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_number", (session_id,))
    questions = cursor.fetchall()

    return jsonify(format_session_dict(session, questions))

@app.route("/api/interview/<int:session_id>/current", methods=["GET"])
def get_current_interview(session_id):
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?", (session_id, user["id"]))
    session = cursor.fetchone()
    if not session:
        return jsonify({"detail": "Session not found"}), 404

    cursor.execute("SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_number", (session_id,))
    questions = cursor.fetchall()

    return jsonify(format_session_dict(session, questions))

@app.route("/api/interview/submit-answer", methods=["POST"])
def submit_answer():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    data = request.get_json() or {}
    question_id = data.get("question_id")
    answer_text = data.get("answer_text", "").strip()
    audio_duration = float(data.get("audio_duration", 0.0))

    if not question_id:
        return jsonify({"detail": "question_id is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_questions WHERE id = ?", (question_id,))
    question = cursor.fetchone()
    if not question:
        return jsonify({"detail": "Question not found"}), 404

    cursor.execute("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?", (question["session_id"], user["id"]))
    session = cursor.fetchone()
    if not session:
        return jsonify({"detail": "Unauthorized access to this session"}), 403

    # Run AI evaluation
    evaluation = ai_service._evaluate_answer_heuristic(
        role=session["role"],
        question_text=question["question_text"],
        expected_topics=question["expected_topics"] or "",
        user_answer=answer_text,
        difficulty=question["difficulty"] or session["difficulty"]
    )

    # Save to question record
    cursor.execute("""
    UPDATE interview_questions SET
        user_answer_text = ?,
        user_audio_duration = ?,
        is_answered = 1,
        technical_score = ?,
        communication_score = ?,
        relevance_score = ?,
        confidence_score = ?,
        grammar_score = ?,
        overall_score = ?,
        strengths = ?,
        weaknesses = ?,
        feedback_summary = ?,
        ideal_answer = ?,
        follow_up_hint = ?
    WHERE id = ?
    """, (
        answer_text, audio_duration,
        evaluation["technical_knowledge"], evaluation["communication"],
        evaluation["relevance"], evaluation["confidence"], evaluation["grammar"],
        evaluation["overall"],
        json.dumps(evaluation["strengths"]), json.dumps(evaluation["weaknesses"]),
        evaluation["feedback_summary"], evaluation["ideal_answer"], evaluation["follow_up_hint"],
        question_id
    ))

    # Advance current_question_index
    cursor.execute("""
    UPDATE interview_sessions SET current_question_index = ? WHERE id = ?
    """, (question["question_number"], session["id"]))

    # Check for next question
    cursor.execute("""
    SELECT * FROM interview_questions WHERE session_id = ? AND question_number = ?
    """, (session["id"], question["question_number"] + 1))
    next_q = cursor.fetchone()

    is_session_completed = next_q is None

    if is_session_completed:
        # Calculate full session rollup
        cursor.execute("SELECT * FROM interview_questions WHERE session_id = ?", (session["id"],))
        all_qs = cursor.fetchall()
        
        q_evals = []
        for q in all_qs:
            q_evals.append({
                "technical_score": q["technical_score"] or 0.0,
                "communication_score": q["communication_score"] or 0.0,
                "relevance_score": q["relevance_score"] or 0.0,
                "confidence_score": q["confidence_score"] or 0.0,
                "grammar_score": q["grammar_score"] or 0.0,
                "overall_score": q["overall_score"] or 0.0,
                "strengths": json.loads(q["strengths"]) if q["strengths"] else [],
                "weaknesses": json.loads(q["weaknesses"]) if q["weaknesses"] else []
            })

        # Calculate averages
        avg_tech = round(sum(q["technical_score"] for q in q_evals) / max(1, len(q_evals)), 1)
        avg_comm = round(sum(q["communication_score"] for q in q_evals) / max(1, len(q_evals)), 1)
        avg_rel = round(sum(q["relevance_score"] for q in q_evals) / max(1, len(q_evals)), 1)
        avg_conf = round(sum(q["confidence_score"] for q in q_evals) / max(1, len(q_evals)), 1)
        avg_gram = round(sum(q["grammar_score"] for q in q_evals) / max(1, len(q_evals)), 1)
        avg_overall = round(sum(q["overall_score"] for q in q_evals) / max(1, len(q_evals)), 1)

        all_s = []
        all_w = []
        for q in q_evals:
            all_s.extend(q.get("strengths", []))
            all_w.extend(q.get("weaknesses", []))

        unique_strengths = list(dict.fromkeys(all_s))[:4]
        unique_weaknesses = list(dict.fromkeys(all_w))[:4]

        tips = [
            f"Focus on deep-dive explanations in {session['role']} fundamentals to elevate Technical score.",
            "Structure complex answers using the STAR format (Situation, Task, Action, Result).",
            "Minimize hesitation words and maintain an authoritative speaking tone.",
            "Always state trade-offs (e.g. latency vs consistency, cost vs performance) before concluding an answer."
        ]
        topics = [
            f"Advanced System Design & Scalability patterns for {session['role']}",
            "Production Debugging, Error Handling & Observability best practices",
            "Database Indexing, Query Optimization, and Concurrency Controls",
            "Behavioral Leadership & Conflict Resolution frameworks"
        ]
        summary_feedback = (
            f"You completed the {session['difficulty']}-level mock interview for {session['role']} with an overall score of {avg_overall}%. "
            f"Your strongest area was {'Communication' if avg_comm >= avg_tech else 'Technical Knowledge'} ({max(avg_comm, avg_tech)}%), "
            f"while focusing on technical depth and concrete production examples will maximize your progress."
        )

        cursor.execute("""
        UPDATE interview_sessions SET
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            overall_score = ?,
            technical_score = ?,
            communication_score = ?,
            relevance_score = ?,
            confidence_score = ?,
            grammar_score = ?,
            summary_feedback = ?,
            strengths = ?,
            weak_areas = ?,
            improvement_tips = ?,
            preparation_topics = ?
        WHERE id = ?
        """, (
            avg_overall, avg_tech, avg_comm, avg_rel, avg_conf, avg_gram,
            summary_feedback, json.dumps(unique_strengths), json.dumps(unique_weaknesses),
            json.dumps(tips), json.dumps(topics),
            session["id"]
        ))

    conn.commit()

    return jsonify({
        "question_id": question_id,
        "is_session_completed": is_session_completed,
        "scores": {
            "technical_knowledge": evaluation["technical_knowledge"],
            "communication": evaluation["communication"],
            "relevance": evaluation["relevance"],
            "confidence": evaluation["confidence"],
            "grammar": evaluation["grammar"],
            "overall": evaluation["overall"]
        },
        "strengths": evaluation["strengths"],
        "weaknesses": evaluation["weaknesses"],
        "feedback_summary": evaluation["feedback_summary"],
        "ideal_answer": evaluation["ideal_answer"],
        "next_question": format_question_dict(next_q) if next_q else None
    })

@app.route("/api/interview/<int:session_id>/report", methods=["GET"])
def get_report(session_id):
    user = get_current_user_from_req()
    user_id = user["id"] if user else None

    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
        session = cursor.fetchone()
    else:
        session = None

    if not session:
        cursor.execute("SELECT * FROM interview_sessions WHERE id = ?", (session_id,))
        session = cursor.fetchone()

    if not session:
        return jsonify({"detail": "Session not found"}), 404

    cursor.execute("SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_number", (session_id,))
    questions = cursor.fetchall()

    return jsonify(format_session_dict(session, questions))

@app.route("/api/interview/<int:session_id>/pdf", methods=["GET"])
def download_pdf(session_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        return jsonify({"detail": "Interview session not found"}), 404

    cursor.execute("SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_number", (session_id,))
    questions = cursor.fetchall()

    try:
        from services.pdf_service import generate_interview_html_report
        html_report = generate_interview_html_report(session, questions)
        response = make_response(html_report)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({"detail": f"Failed to generate report: {str(e)}"}), 500

@app.route("/report/<int:session_id>", methods=["GET"])
def redirect_to_frontend_report(session_id):
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    if frontend_url:
        return redirect(f"{frontend_url}/report/{session_id}", code=302)
    if FRONTEND_DIST_DIR and os.path.exists(os.path.join(FRONTEND_DIST_DIR, "index.html")):
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")
    return redirect(f"http://localhost:5173/report/{session_id}", code=302)




# ----------------- HISTORY & ANALYTICS ----------------- #

@app.route("/api/history", methods=["GET"])
def get_history():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
    sessions = cursor.fetchall()

    result = []
    for s in sessions:
        cursor.execute("SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_number", (s["id"],))
        questions = cursor.fetchall()
        result.append(format_session_dict(s, questions))

    return jsonify(result)

@app.route("/api/history/analytics", methods=["GET"])
def get_analytics():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM interview_sessions 
    WHERE user_id = ? AND status = 'completed' 
    ORDER BY created_at ASC
    """, (user["id"],))
    sessions = cursor.fetchall()

    if not sessions:
        return jsonify({
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
        })

    total = len(sessions)
    scores = [s["overall_score"] for s in sessions]
    avg_score = round(sum(scores) / total, 1)
    best_score = round(max(scores), 1)
    latest_score = round(sessions[-1]["overall_score"], 1)

    avg_tech = round(sum(s["technical_score"] for s in sessions) / total, 1)
    avg_comm = round(sum(s["communication_score"] for s in sessions) / total, 1)
    avg_rel = round(sum(s["relevance_score"] for s in sessions) / total, 1)
    avg_conf = round(sum(s["confidence_score"] for s in sessions) / total, 1)
    avg_gram = round(sum(s["grammar_score"] for s in sessions) / total, 1)

    progress_history = []
    for idx, s in enumerate(sessions):
        dt_str = s["created_at"][:10] if s["created_at"] else f"Round {idx+1}"
        progress_history.append({
            "interview_id": s["id"],
            "title": f"Interview {idx + 1}: {s['role']}",
            "role": s["role"],
            "score": round(s["overall_score"], 1),
            "date": dt_str
        })

    strengths_pool = []
    improvements_pool = []
    for s in sessions[-3:]:
        if s["strengths"]:
            try:
                items = json.loads(s["strengths"]) if s["strengths"].startswith("[") else [s["strengths"]]
                strengths_pool.extend(items)
            except Exception:
                pass
        if s["weak_areas"]:
            try:
                items = json.loads(s["weak_areas"]) if s["weak_areas"].startswith("[") else [s["weak_areas"]]
                improvements_pool.extend(items)
            except Exception:
                pass

    return jsonify({
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
    })

@app.route("/api/history/<int:session_id>", methods=["DELETE"])
def delete_interview(session_id):
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM interview_sessions WHERE id = ? AND user_id = ?", (session_id, user["id"]))
    conn.commit()
    return jsonify({"message": "Session deleted successfully"})

# ----------------- UPLOAD & ANALYSIS ----------------- #

@app.route("/api/upload/resume", methods=["POST"])
def upload_resume_file():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"detail": "No file uploaded"}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"detail": "No file selected"}), 400

    content = file.read()
    if file.filename.lower().endswith('.pdf'):
        extracted_text = resume_parser.extract_text_from_pdf(content)
    else:
        try:
            extracted_text = content.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = str(content)

    if not extracted_text.strip():
        return jsonify({"detail": "Could not extract readable text from the file"}), 400

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
    elif "docker" in skills_str or "kubernetes" in skills_str or "aws" in skills_str:
        inferred_role = "DevOps / Cloud Engineer"
    elif "react" in skills_str and "node" in skills_str:
        inferred_role = "Full Stack Developer"

    return jsonify({
        "filename": file.filename,
        "candidate_name": analysis["candidate_name"],
        "detected_skills": analysis["detected_skills"],
        "estimated_experience": analysis["estimated_experience"],
        "inferred_role": inferred_role,
        "resume_text_preview": extracted_text[:1500] + ("..." if len(extracted_text) > 1500 else ""),
        "full_text": extracted_text
    })

@app.route("/api/upload/analyze-jd", methods=["POST"])
def analyze_job_description():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"detail": "Unauthorized"}), 401

    data = request.get_json() or {}
    text = data.get("jd_text", "").strip()
    target_company = data.get("target_company", "Target Company")

    if len(text) < 15:
        return jsonify({"detail": "Job description text is too short"}), 400

    text_lower = text.lower()
    
    from services.resume_parser import COMMON_SKILLS
    skills_found = [s for s in COMMON_SKILLS if re.search(r'\b' + re.escape(s.lower()) + r'\b', text_lower)]

    inferred_role = "Software Developer"
    for r in ["Cybersecurity Analyst", "Data Analyst", "Data Scientist", "Full Stack Developer", "Cloud Architect", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Product Manager"]:
        if r.lower() in text_lower:
            inferred_role = r
            break

    difficulty = "Medium"
    if any(k in text_lower for k in ["senior", "lead", "architect", "staff", "principal", "5+ years"]):
        difficulty = "Hard"
    elif any(k in text_lower for k in ["junior", "entry", "intern", "graduate"]):
        difficulty = "Easy"

    return jsonify({
        "target_company": target_company,
        "inferred_role": inferred_role,
        "difficulty": difficulty,
        "key_requirements": skills_found[:8],
        "word_count": len(text.split()),
        "full_text": text
    })

@app.route("/favicon.ico", methods=["GET"])
def favicon():
    return "", 204

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "database": "sqlite_ready",
        "app": "AI Interview Coach API",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

# Unified Single-Service Deployment: Serve React SPA frontend from dist if present
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path.startswith("api/"):
        return jsonify({"detail": "API endpoint not found"}), 404
    
    if FRONTEND_DIST_DIR and os.path.exists(FRONTEND_DIST_DIR):
        file_path = os.path.join(FRONTEND_DIST_DIR, path)
        if path and os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIST_DIR, path)
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")

    return jsonify({
        "app": "AI Interview Coach API",
        "version": "1.0.0",
        "status": "online",
        "health_check": "/api/health"
    })

# Initialize Database on import/startup
init_db()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)


