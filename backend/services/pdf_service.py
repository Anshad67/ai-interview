import json

def _get_val(obj, key, default=""):
    if isinstance(obj, dict):
        return obj.get(key, default)
    elif hasattr(obj, key):
        return getattr(obj, key, default)
    try:
        return obj[key]
    except Exception:
        return default

def generate_interview_html_report(session, questions) -> str:
    role = _get_val(session, "role", "Software Engineer")
    difficulty = _get_val(session, "difficulty", "Medium")
    interview_type = _get_val(session, "interview_type", "Technical")
    overall_score = int(float(_get_val(session, "overall_score", 0)))
    tech_score = int(float(_get_val(session, "technical_score", 0)))
    comm_score = int(float(_get_val(session, "communication_score", 0)))
    rel_score = int(float(_get_val(session, "relevance_score", 0)))
    conf_score = int(float(_get_val(session, "confidence_score", 0)))
    gram_score = int(float(_get_val(session, "grammar_score", 0)))
    summary_feedback = _get_val(session, "summary_feedback", "Full mock interview completed.")
    created_at = str(_get_val(session, "created_at", ""))[:10]

    raw_strengths = _get_val(session, "strengths", "")
    strengths = []
    if raw_strengths:
        try:
            strengths = json.loads(raw_strengths) if isinstance(raw_strengths, str) and raw_strengths.startswith("[") else [raw_strengths]
        except Exception:
            strengths = [raw_strengths]
            
    raw_weaknesses = _get_val(session, "weak_areas", "")
    weak_areas = []
    if raw_weaknesses:
        try:
            weak_areas = json.loads(raw_weaknesses) if isinstance(raw_weaknesses, str) and raw_weaknesses.startswith("[") else [raw_weaknesses]
        except Exception:
            weak_areas = [raw_weaknesses]

    raw_tips = _get_val(session, "improvement_tips", "")
    tips = []
    if raw_tips:
        try:
            tips = json.loads(raw_tips) if isinstance(raw_tips, str) and raw_tips.startswith("[") else [raw_tips]
        except Exception:
            tips = [raw_tips]

    raw_topics = _get_val(session, "preparation_topics", "")
    topics = []
    if raw_topics:
        try:
            topics = json.loads(raw_topics) if isinstance(raw_topics, str) and raw_topics.startswith("[") else [raw_topics]
        except Exception:
            topics = [raw_topics]

    strengths_html = "".join([f"<li style='margin-bottom:6px;'>{s}</li>" for s in strengths]) if strengths else "<li>Consistent structured responses.</li>"
    weaknesses_html = "".join([f"<li style='margin-bottom:6px;'>{w}</li>" for w in weak_areas]) if weak_areas else "<li>Provide deeper edge case examples.</li>"
    tips_html = "".join([f"<li style='margin-bottom:6px;'>{t}</li>" for t in tips]) if tips else "<li>Review system design concepts.</li>"
    topics_html = "".join([f"<li style='margin-bottom:6px;'>{tp}</li>" for tp in topics]) if topics else "<li>Advanced architecture and scalability.</li>"

    questions_html = ""
    for q in questions:
        q_num = _get_val(q, "question_number", 1)
        q_cat = _get_val(q, "category", "Technical")
        q_diff = _get_val(q, "difficulty", "Medium")
        q_score = int(float(_get_val(q, "overall_score", 0)))
        q_text = _get_val(q, "question_text", "")
        q_ans = _get_val(q, "user_answer_text", "No answer recorded.")
        q_feedback = _get_val(q, "feedback_summary", "")
        q_ideal = _get_val(q, "ideal_answer", "")

        questions_html += f"""
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:16px; page-break-inside:avoid;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; color:#1e40af; font-size:14px;">Question #{q_num} ({q_cat} &bull; {q_diff})</span>
                <span style="font-weight:800; color:#0f172a; font-size:16px; background:#e0f2fe; padding:2px 8px; border-radius:6px;">{q_score}%</span>
            </div>
            <p style="font-weight:600; color:#0f172a; margin-bottom:10px; font-size:13px;">"{q_text}"</p>
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:10px;">
                <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Candidate Answer:</span>
                <p style="font-size:12px; color:#334155; margin-top:4px; line-height:1.5;">{q_ans}</p>
            </div>
            {f'<p style="font-size:12px; color:#047857; margin-bottom:6px;"><b>AI Feedback:</b> {q_feedback}</p>' if q_feedback else ''}
            {f'<p style="font-size:12px; color:#475569; font-style:italic;"><b>Top Candidate Model Answer:</b> "{q_ideal}"</p>' if q_ideal else ''}
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Interview Coach — Performance Report ({role})</title>
    <style>
        @media print {{
            body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            .no-print {{ display: none !important; }}
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            line-height: 1.5;
            padding: 30px;
            max-width: 850px;
            margin: 0 auto;
        }}
        h1, h2, h3, h4 {{ color: #0f172a; margin-top: 0; }}
        .header-box {{
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .score-box {{
            background: #f0fdf4;
            border: 2px solid #86efac;
            border-radius: 12px;
            padding: 16px 24px;
            text-align: center;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }}
        .card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
        }}
        .metric-row {{
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }}
        .btn {{
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:12px 18px; border-radius:10px;">
        <span style="font-size:13px; font-weight:600; color:#334155;">📄 AI Interview Coach Evaluation Report</span>
        <div>
            <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <a href="/history" style="margin-left:10px; font-size:13px; color:#2563eb; text-decoration:none; font-weight:600;">Back to Dashboard</a>
        </div>

    </div>

    <div class="header-box">
        <div>
            <h1 style="font-size:24px; margin-bottom:4px;">AI Interview Coach — Performance Report</h1>
            <p style="font-size:13px; color:#64748b; margin:0;">
                Target Role: <b>{role}</b> &bull; Level: <b>{difficulty}</b> &bull; Mode: <b>{interview_type}</b> &bull; Date: {created_at}
            </p>
        </div>
        <div class="score-box">
            <div style="font-size:32px; font-weight:800; color:#15803d; line-height:1;">{overall_score}%</div>
            <div style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase; margin-top:4px;">Overall Score</div>
        </div>
    </div>

    <div class="card" style="margin-bottom:20px;">
        <h3 style="font-size:15px; margin-bottom:8px;">Executive Summary & Assessment</h3>
        <p style="font-size:13px; color:#334155; margin:0;">{summary_feedback}</p>
    </div>

    <div class="grid-2">
        <div class="card">
            <h3 style="font-size:14px; margin-bottom:10px; color:#0f172a;">Competency Breakdown</h3>
            <div class="metric-row"><span>Technical Knowledge:</span><b>{tech_score}%</b></div>
            <div class="metric-row"><span>Communication & Clarity:</span><b>{comm_score}%</b></div>
            <div class="metric-row"><span>Relevance & Completeness:</span><b>{rel_score}%</b></div>
            <div class="metric-row"><span>Confidence & Delivery:</span><b>{conf_score}%</b></div>
            <div class="metric-row" style="border:none;"><span>Grammar & Vocabulary:</span><b>{gram_score}%</b></div>
        </div>

        <div class="card">
            <h3 style="font-size:14px; margin-bottom:8px; color:#047857;">Key Strengths</h3>
            <ul style="font-size:12px; color:#334155; padding-left:18px; margin:0 0 14px 0;">
                {strengths_html}
            </ul>

            <h3 style="font-size:14px; margin-bottom:8px; color:#b45309;">Priority Areas to Refine</h3>
            <ul style="font-size:12px; color:#334155; padding-left:18px; margin:0;">
                {weaknesses_html}
            </ul>
        </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px;">
        <div class="card">
            <h3 style="font-size:14px; margin-bottom:8px; color:#1e40af;">Actionable Improvement Tips</h3>
            <ol style="font-size:12px; color:#334155; padding-left:18px; margin:0;">
                {tips_html}
            </ol>
        </div>

        <div class="card">
            <h3 style="font-size:14px; margin-bottom:8px; color:#6b21a8;">Recommended Next Study Topics</h3>
            <ol style="font-size:12px; color:#334155; padding-left:18px; margin:0;">
                {topics_html}
            </ol>
        </div>
    </div>

    <h2 style="font-size:18px; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
        Question-by-Question Detailed Review
    </h2>

    {questions_html}

</body>
</html>
"""
    return html
