import sqlite3
import os
import json
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "interview_coach.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        target_role TEXT DEFAULT 'Software Developer',
        experience_years TEXT DEFAULT '1-3 years',
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Interview Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        role TEXT NOT NULL,
        interview_type TEXT DEFAULT 'Technical',
        difficulty TEXT DEFAULT 'Medium',
        source_type TEXT DEFAULT 'Standard',
        resume_text TEXT,
        jd_text TEXT,
        total_questions INTEGER DEFAULT 5,
        current_question_index INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        overall_score REAL DEFAULT 0.0,
        technical_score REAL DEFAULT 0.0,
        communication_score REAL DEFAULT 0.0,
        relevance_score REAL DEFAULT 0.0,
        confidence_score REAL DEFAULT 0.0,
        grammar_score REAL DEFAULT 0.0,
        summary_feedback TEXT,
        strengths TEXT,
        weak_areas TEXT,
        improvement_tips TEXT,
        preparation_topics TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Interview Questions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        category TEXT DEFAULT 'Technical',
        difficulty TEXT DEFAULT 'Medium',
        expected_topics TEXT,
        user_answer_text TEXT,
        user_audio_duration REAL DEFAULT 0.0,
        is_answered INTEGER DEFAULT 0,
        overall_score REAL DEFAULT 0.0,
        technical_score REAL DEFAULT 0.0,
        communication_score REAL DEFAULT 0.0,
        relevance_score REAL DEFAULT 0.0,
        confidence_score REAL DEFAULT 0.0,
        grammar_score REAL DEFAULT 0.0,
        strengths TEXT,
        weaknesses TEXT,
        feedback_summary TEXT,
        ideal_answer TEXT,
        follow_up_hint TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
    )
    """)

    conn.commit()

    # Seed demo user if not exists
    cursor.execute("SELECT id FROM users WHERE email = 'demo.candidate@aiinterview.com'")
    user = cursor.fetchone()
    if not user:
        cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, target_role, experience_years, bio)
        VALUES ('demo.candidate@aiinterview.com', 'demo_hash_123', 'Alex Morgan', 'Full Stack Developer', '2-4 years', 'Software engineer preparing for Senior Developer and Full-Stack roles.')
        """)
        user_id = cursor.lastrowid

        # Seed sample mock interview rounds for vivid progress tracking
        cursor.execute("""
        INSERT INTO interview_sessions (
            user_id, title, role, interview_type, difficulty, source_type, total_questions, current_question_index,
            status, overall_score, technical_score, communication_score, relevance_score, confidence_score, grammar_score,
            summary_feedback, strengths, weak_areas, improvement_tips, preparation_topics, completed_at
        ) VALUES (
            ?, 'Junior Frontend Developer Mock', 'Frontend Developer', 'Technical', 'Easy', 'Standard', 3, 3,
            'completed', 65.0, 68.0, 70.0, 62.0, 60.0, 78.0,
            'Good fundamental knowledge of HTML, CSS, and basic JavaScript. Stated concepts clearly but could give more concrete project examples.',
            '["Clean explanation of DOM manipulation", "Good grasp of CSS flexbox and grid layout"]',
            '["Hesitation on asynchronous JavaScript promises", "Lack of deep component lifecycle discussion"]',
            '["Practice explaining React state management trade-offs", "Use the STAR method for behavioral queries"]',
            '["React Hooks & Context API", "Asynchronous JavaScript & Event Loop", "CSS Performance & Responsive Design"]',
            CURRENT_TIMESTAMP
        )
        """, (user_id,))
        s1_id = cursor.lastrowid

        cursor.execute("""
        INSERT INTO interview_questions (session_id, question_number, question_text, category, difficulty, expected_topics, user_answer_text, is_answered, overall_score, technical_score, communication_score, relevance_score, confidence_score, grammar_score, feedback_summary, ideal_answer)
        VALUES (?, 1, 'Explain the difference between synchronous and asynchronous JavaScript.', 'Core Programming', 'Easy', 'Event Loop, Promises, Callbacks', 'Synchronous executes line by line blocking execution. Asynchronous runs tasks in the background with promises.', 1, 68.0, 70.0, 68.0, 72.0, 60.0, 80.0, 'Clear definition of non-blocking I/O and callbacks.', 'Synchronous code executes sequentially blocking the thread, while asynchronous operations utilize the JavaScript event loop and callback queue to execute non-blocking operations without stalling the UI thread.')
        """, (s1_id,))

        cursor.execute("""
        INSERT INTO interview_sessions (
            user_id, title, role, interview_type, difficulty, source_type, total_questions, current_question_index,
            status, overall_score, technical_score, communication_score, relevance_score, confidence_score, grammar_score,
            summary_feedback, strengths, weak_areas, improvement_tips, preparation_topics, completed_at
        ) VALUES (
            ?, 'Full Stack Software Engineer Mock', 'Full Stack Developer', 'Technical', 'Medium', 'Standard', 3, 3,
            'completed', 74.0, 76.0, 78.0, 75.0, 70.0, 82.0,
            'Notable improvement in technical articulation and database indexing explanations. Handled REST API principles very well.',
            '["Strong explanation of SQL vs NoSQL trade-offs", "Confident delivery with minimal filler words"]',
            '["Could elaborate on caching strategies using Redis", "Missed discussing concurrency control"]',
            '["Include trade-off analysis in all architecture questions", "Elaborate on production incident debugging"]',
            '["Distributed Caching & Redis", "Database Indexing & Query Tuning", "Microservices Architecture"]',
            CURRENT_TIMESTAMP
        )
        """, (user_id,))

        cursor.execute("""
        INSERT INTO interview_sessions (
            user_id, title, role, interview_type, difficulty, source_type, total_questions, current_question_index,
            status, overall_score, technical_score, communication_score, relevance_score, confidence_score, grammar_score,
            summary_feedback, strengths, weak_areas, improvement_tips, preparation_topics, completed_at
        ) VALUES (
            ?, 'Senior Full Stack Engineer - Technical & System Design', 'Full Stack Developer', 'Mixed', 'Hard', 'Standard', 3, 3,
            'completed', 82.0, 84.0, 85.0, 88.0, 79.0, 86.0,
            'Excellent interview performance! Demonstrated deep understanding of system scalability, distributed architectures, and strong leadership communication.',
            '["Outstanding system design breakdown for distributed services", "Authoritative communication tone", "Clear explanation of ACID properties and MVCC"]',
            '["Could discuss cost optimization alongside performance", "Deepen understanding of Raft consensus edge cases"]',
            '["Highlight business impact and cost metrics during system design", "Keep sharpening distributed systems concepts"]',
            '["Advanced Distributed Systems & Consensus Protocols", "Observability (OpenTelemetry / Prometheus)", "Executive Behavioral Storytelling"]',
            CURRENT_TIMESTAMP
        )
        """, (user_id,))

        conn.commit()

    conn.close()
