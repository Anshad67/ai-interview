import json
import re
import httpx
from typing import List, Dict, Any, Optional
from config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL

    async def generate_questions(
        self,
        role: str,
        interview_type: str = "Technical",
        difficulty: str = "Medium",
        source_type: str = "Standard",
        resume_text: Optional[str] = None,
        jd_text: Optional[str] = None,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate tailored interview questions based on role, type, difficulty, resume, or JD.
        """
        if self.api_key:
            try:
                return await self._generate_questions_openai(
                    role, interview_type, difficulty, source_type, resume_text, jd_text, count
                )
            except Exception as e:
                print(f"[AIService] OpenAI generation error: {e}. Falling back to smart generator.")
                
        return self._generate_questions_fallback(
            role, interview_type, difficulty, source_type, resume_text, jd_text, count
        )

    async def _generate_questions_openai(
        self, role: str, interview_type: str, difficulty: str, source_type: str,
        resume_text: Optional[str], jd_text: Optional[str], count: int
    ) -> List[Dict[str, Any]]:
        prompt = f"""
You are an expert technical and executive hiring manager conducting a mock interview for the role: "{role}".
Interview Type: {interview_type} (Technical / HR / Mixed)
Difficulty Level: {difficulty} (Easy / Medium / Hard)
Source Mode: {source_type}

Context:
"""
        if resume_text:
            prompt += f"\nCandidate's Resume Highlights:\n{resume_text[:2000]}\n"
        if jd_text:
            prompt += f"\nTarget Job Description:\n{jd_text[:2000]}\n"

        prompt += f"""
Please generate exactly {count} realistic, challenging, and highly relevant interview questions.
Return ONLY valid JSON matching this exact schema:
[
  {{
    "question_number": 1,
    "question_text": "...",
    "category": "Technical" | "Problem Solving" | "System Architecture" | "Behavioral" | "Communication",
    "difficulty": "{difficulty}",
    "expected_topics": "Key concepts or keywords the candidate should touch upon"
  }}
]
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a professional AI Interviewer and technical interviewer."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"} if "gpt-4" in self.model or "gpt-3.5" in self.model else None
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            
            # Parse JSON
            parsed = json.loads(raw_text)
            if isinstance(parsed, dict):
                # Sometimes OpenAI nests list in a key like "questions"
                for k in ["questions", "interview_questions", "data", "list"]:
                    if k in parsed and isinstance(parsed[k], list):
                        return parsed[k]
                if len(parsed) == 1 and isinstance(list(parsed.values())[0], list):
                    return list(parsed.values())[0]
            elif isinstance(parsed, list):
                return parsed

        return self._generate_questions_fallback(role, interview_type, difficulty, source_type, resume_text, jd_text, count)

    def _generate_questions_fallback(
        self, role: str, interview_type: str, difficulty: str, source_type: str,
        resume_text: Optional[str], jd_text: Optional[str], count: int
    ) -> List[Dict[str, Any]]:
        """
        Smart curated question repository customized per role and difficulty.
        """
        role_lower = role.lower()
        questions = []

        if "data" in role_lower and "analyst" in role_lower:
            pool = [
                ("Can you explain the difference between WHERE and HAVING clauses in SQL, and provide a scenario where you would use each?", "Technical", "SQL Aggregation, Grouping, Filtering"),
                ("How do you handle missing or anomalous data in a dataset before presenting insights to business stakeholders?", "Problem Solving", "Data Cleaning, Imputation, Outlier Detection"),
                ("Walk me through a data visualization project you worked on. How did you choose the chart types and color palettes for your audience?", "Behavioral / Technical", "Data Storytelling, Dashboard Design, BI Tools"),
                ("What is the difference between supervised and unsupervised learning, and when might a data analyst use clustering?", "Technical", "Machine Learning Basics, K-Means, Customer Segmentation"),
                ("If a critical business KPI drops by 15% week-over-week, what structured approach would you take to diagnose the root cause?", "Analytical Thinking", "Root Cause Analysis, Drill Down, Cohort Analysis")
            ]
        elif "cyber" in role_lower or "security" in role_lower:
            pool = [
                ("How would you respond to an alert indicating potential ransomware execution on an internal server?", "Incident Response", "Isolation, Containment, Eradication, Forensics"),
                ("Explain the principle of Defense in Depth and how you would implement it in a modern cloud architecture.", "Security Architecture", "Layered Security, IAM, Network Segmentation, Encryption"),
                ("What is the difference between symmetric and asymmetric encryption, and where is each typically applied in web protocols?", "Cryptography", "TLS/SSL, Public Key Infrastructure, Performance"),
                ("Can you walk me through the OWASP Top 10 vulnerabilities, specifically how you prevent SQL Injection and Cross-Site Scripting (XSS)?", "Application Security", "Input Validation, Parameterized Queries, CSP"),
                ("How do you conduct a threat modeling exercise for a newly designed financial microservice API?", "Threat Modeling", "STRIDE, Data Flow Diagrams, Trust Boundaries")
            ]
        elif "cloud" in role_lower or "devops" in role_lower:
            pool = [
                ("Explain the core differences between containerization with Docker and traditional Virtual Machines (VMs).", "DevOps Fundamentals", "OS Virtualization, Resource Overhead, Portability"),
                ("How would you design a zero-downtime CI/CD deployment strategy for a high-traffic microservices application?", "CI/CD & Architecture", "Blue-Green Deployment, Canary Releases, Rolling Updates"),
                ("What strategies and tools do you use to implement Infrastructure as Code (IaC) with automated rollback capability?", "Infrastructure as Code", "Terraform, State Management, Idempotency"),
                ("How do you monitor and handle sudden traffic spikes in Kubernetes to ensure high availability and auto-scaling?", "Kubernetes & Scaling", "HPA, Cluster Autoscaler, Metrics Server, Circuit Breakers"),
                ("Describe your approach to implementing least-privilege IAM policies and secrets management across multi-cloud environments.", "Cloud Security", "IAM Roles, HashiCorp Vault, Cloud KMS, Audit Logging")
            ]
        elif "ai" in role_lower or "machine learning" in role_lower or "ml" in role_lower:
            pool = [
                ("Explain the bias-variance tradeoff and how you diagnose and mitigate overfitting in deep neural networks.", "ML Fundamentals", "Regularization, Dropout, Cross-Validation, L1/L2"),
                ("How do Transformers and Self-Attention mechanisms differ from traditional Recurrent Neural Networks (RNNs)?", "Deep Learning", "Attention Matrix, Positional Encoding, Parallel Processing"),
                ("What techniques would you use to fine-tune a Large Language Model (LLM) efficiently on domain-specific data with limited GPU compute?", "LLM & GenAI", "LoRA, QLoRA, PEFT, Quantization"),
                ("How do you design a Retrieval-Augmented Generation (RAG) pipeline to reduce hallucinations in production AI applications?", "RAG & System Design", "Vector Databases, Embeddings, Re-ranking, Chunking"),
                ("Describe the metrics and evaluation framework you would use to monitor model drift and data distribution shifts in production.", "MLOps", "KS Test, Population Stability Index, Evident Drift, Feature Stores")
            ]
        elif "hr" in role_lower or interview_type == "HR":
            pool = [
                ("Tell me about a time you faced a significant conflict or disagreement with a teammate or stakeholder. How did you resolve it?", "Behavioral", "STAR Method, Empathy, Active Listening, Resolution"),
                ("Why are you interested in this specific role and what sets your experience apart from other qualified candidates?", "Motivation & Alignment", "Company Mission, Relevant Skills, Career Goals"),
                ("Describe a high-pressure situation where a project deadline was at risk. How did you prioritize tasks and communicate updates?", "Time Management", "Prioritization, Stress Management, Stakeholder Communication"),
                ("Tell me about a failure or mistake you made in a past project. What did you learn and how did you adapt moving forward?", "Growth Mindset", "Accountability, Reflection, Resilience"),
                ("Where do you see yourself professionally in the next 3 to 5 years, and how does this role fit into that vision?", "Career Aspirations", "Professional Development, Leadership, Impact")
            ]
        else: # Software Developer / Full Stack / Backend / Frontend (Default)
            if difficulty == "Easy":
                pool = [
                    ("Can you explain the difference between synchronous and asynchronous programming, and when you would use each?", "Core Programming", "Event Loop, Promises, Callbacks, Threading"),
                    ("What are the key differences between SQL (relational) and NoSQL (non-relational) databases?", "Databases", "Schema Design, ACID, Horizontal vs Vertical Scaling"),
                    ("Explain the concept of RESTful APIs and what standard HTTP methods and status codes are used for CRUD operations.", "Web Architecture", "GET/POST/PUT/DELETE, Status Codes (200, 201, 400, 500)"),
                    ("What is version control with Git, and how do you resolve merge conflicts when working in a collaborative team?", "Developer Tools", "Branching, Merging, Rebase, Conflict Markers"),
                    ("Tell me about a recent coding project you built. What technologies did you choose and what was the main challenge?", "Project Experience", "Architecture Decisions, Technical Tradeoffs, Outcomes")
                ]
            elif difficulty == "Hard":
                pool = [
                    ("How would you design a distributed, highly available URL shortening service (like Bitly) handling 100M daily writes with sub-10ms read latency?", "System Design", "Sharding, Consistent Hashing, Redis Caching, Base62 Encoding"),
                    ("Explain database concurrency control mechanisms: Pessimistic vs Optimistic locking, MVCC, and isolation levels (Read Committed vs Serializable).", "Database Internals", "Race Conditions, Deadlocks, MVCC, Dirty Reads"),
                    ("How do you detect, profile, and fix memory leaks and CPU bottlenecks in high-throughput backend services?", "Performance Engineering", "Profiling Tools, Heap Dumps, Garbage Collection Tuning, Event Loop Lag"),
                    ("Explain how Distributed Consensus algorithms (e.g. Raft or Paxos) maintain state consistency across partitioned clusters.", "Distributed Systems", "Leader Election, Log Replication, Split-Brain Protection"),
                    ("Describe an architectural refactor you led where you had to migrate a monolithic system to event-driven microservices with zero downtime.", "Engineering Leadership", "Strangler Fig Pattern, Kafka/Event Bus, Dual Writing, Schema Evolution")
                ]
            else: # Medium
                pool = [
                    ("Can you explain the principles of Object-Oriented Programming (OOP) and SOLID design with practical real-world examples?", "Software Design", "Encapsulation, Polymorphism, Single Responsibility, Dependency Inversion"),
                    ("How does indexing work in relational databases (e.g., B-Trees), and how do you diagnose a slow-running SQL query?", "Database Performance", "B-Tree Indices, EXPLAIN Query Plan, Table Scans, Composite Indices"),
                    ("Walk me through how the browser renders a webpage from the initial HTTP request to painting pixels on screen.", "Web Architecture", "DNS, TCP/TLS Handshake, DOM/CSSOM, Render Tree, Layout & Paint"),
                    ("What strategies do you use for caching data in distributed web applications to balance freshness with performance?", "System Architecture", "Redis, Cache Invalidation, Cache-Aside, Write-Through, TTL"),
                    ("Tell me about a challenging bug you encountered in production. How did you isolate, debug, and prevent recurrence?", "Problem Solving", "Log Analysis, Observability, Root Cause Analysis, Regression Testing")
                ]

        # Incase Resume or JD text is provided in fallback mode, synthesize tailored questions
        if resume_text:
            pool.insert(1, (
                f"Based on your resume, could you walk me through the key architectural decisions and metrics from your most impactful project?",
                "Project & Resume",
                "Technical Ownership, System Impact, Lessons Learned"
            ))
        if jd_text:
            pool.insert(2, (
                f"For this position's requirements, how would you approach building scalable, resilient features aligned with the tech stack?",
                "Role Alignment",
                "Technology Alignment, Scalability, Best Practices"
            ))

        for idx, (text, cat, exp) in enumerate(pool[:count]):
            questions.append({
                "question_number": idx + 1,
                "question_text": text,
                "category": cat,
                "difficulty": difficulty,
                "expected_topics": exp
            })

        return questions

    async def evaluate_answer(
        self,
        role: str,
        question_text: str,
        expected_topics: str,
        user_answer: str,
        difficulty: str = "Medium"
    ) -> Dict[str, Any]:
        """
        Evaluate candidate's answer across 5 categories:
        - Technical Knowledge (0-100)
        - Communication (0-100)
        - Relevance (0-100)
        - Confidence & Tone (0-100)
        - Grammar & Vocabulary (0-100)
        """
        if self.api_key and len(user_answer.strip()) > 5:
            try:
                return await self._evaluate_answer_openai(
                    role, question_text, expected_topics, user_answer, difficulty
                )
            except Exception as e:
                print(f"[AIService] OpenAI evaluation error: {e}. Using intelligent heuristic evaluator.")

        return self._evaluate_answer_heuristic(role, question_text, expected_topics, user_answer, difficulty)

    async def _evaluate_answer_openai(
        self, role: str, question_text: str, expected_topics: str, user_answer: str, difficulty: str
    ) -> Dict[str, Any]:
        prompt = f"""
You are an expert AI Interview Coach evaluating a candidate's answer for the role: "{role}".

Question: "{question_text}"
Expected Topics/Keywords: "{expected_topics}"
Candidate Answer: "{user_answer}"
Difficulty: "{difficulty}"

Please evaluate the answer rigorously and objectively across these specific metrics (each from 0 to 100):
1. technical_knowledge: Technical accuracy, depth, industry concepts, proper terminology.
2. communication: Structure, clarity, conciseness, articulation (e.g. STAR method if behavioral).
3. relevance: Direct responsiveness to the prompt without rambling or off-topic filler.
4. confidence: Professional tone, assertiveness, conviction, avoidance of excessive hedge words.
5. grammar: Sentence structure, syntax, vocabulary, linguistic flow.
6. overall: Weighted average reflecting overall interview readiness.

Also provide:
- strengths: List of 2-3 specific things the candidate explained well.
- weaknesses: List of 1-3 specific gaps, inaccuracies, or missed topics.
- feedback_summary: 2-3 sentences of direct constructive feedback.
- ideal_answer: A concise, stellar model answer illustrating how a top 1% candidate answers this question.
- follow_up_hint: A quick 1-sentence adaptive hint for the next round.

Return ONLY valid JSON matching this exact structure:
{{
  "technical_knowledge": 85.0,
  "communication": 80.0,
  "relevance": 90.0,
  "confidence": 75.0,
  "grammar": 88.0,
  "overall": 83.6,
  "strengths": ["Clear explanation of...", "Used appropriate terminology like..."],
  "weaknesses": ["Missed discussing edge case X", "Could provide a concrete metrics example"],
  "feedback_summary": "Strong structured response that addressed the core question...",
  "ideal_answer": "In a production environment, I would...",
  "follow_up_hint": "Focus on explaining the trade-offs between speed and consistency."
}}
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a world-class AI Interview Coach and scoring evaluator."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"} if "gpt-4" in self.model or "gpt-3.5" in self.model else None
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            result = json.loads(raw_text)

            # Ensure all keys exist
            return self._normalize_evaluation_dict(result)

    def _normalize_evaluation_dict(self, res: Dict[str, Any]) -> Dict[str, Any]:
        tech = float(res.get("technical_knowledge", res.get("technical", 75.0)))
        comm = float(res.get("communication", 75.0))
        rel = float(res.get("relevance", 75.0))
        conf = float(res.get("confidence", 70.0))
        gram = float(res.get("grammar", 80.0))
        overall = float(res.get("overall", (tech * 0.35 + comm * 0.20 + rel * 0.20 + conf * 0.15 + gram * 0.10)))

        return {
            "technical_knowledge": round(min(100.0, max(0.0, tech)), 1),
            "communication": round(min(100.0, max(0.0, comm)), 1),
            "relevance": round(min(100.0, max(0.0, rel)), 1),
            "confidence": round(min(100.0, max(0.0, conf)), 1),
            "grammar": round(min(100.0, max(0.0, gram)), 1),
            "overall": round(min(100.0, max(0.0, overall)), 1),
            "strengths": res.get("strengths", ["Addressed the question directly", "Demonstrated familiarity with key terminology"]),
            "weaknesses": res.get("weaknesses", ["Could provide deeper architectural nuances", "Could elaborate with real-world examples"]),
            "feedback_summary": res.get("feedback_summary", "Good fundamental response with clear articulation."),
            "ideal_answer": res.get("ideal_answer", "A comprehensive answer should define the core concept, explain trade-offs, and illustrate with a production scenario."),
            "follow_up_hint": res.get("follow_up_hint", "Be prepared to discuss edge-case handling in the next question.")
        }

    def _evaluate_answer_heuristic(
        self, role: str, question_text: str, expected_topics: str, user_answer: str, difficulty: str
    ) -> Dict[str, Any]:
        """
        Sophisticated rule-based semantic heuristic evaluator when offline or without API key.
        Analyzes word count, expected keyword matches, sentence structure, filler words, and depth.
        """
        text = user_answer.strip()
        word_count = len(text.split())

        if word_count < 5:
            return {
                "technical_knowledge": 25.0,
                "communication": 30.0,
                "relevance": 20.0,
                "confidence": 30.0,
                "grammar": 50.0,
                "overall": 28.0,
                "strengths": ["Attempted to answer the question"],
                "weaknesses": ["Answer was extremely brief and lacked technical substance", "Did not cover expected topics"],
                "feedback_summary": "Your answer was too concise. In an interview, aim to explain your reasoning with definitions, examples, and trade-offs.",
                "ideal_answer": f"To answer '{question_text}' effectively, structure your thoughts: define the concept, mention key components ({expected_topics}), and share a practical use-case.",
                "follow_up_hint": "Try to elaborate more and use the STAR method (Situation, Task, Action, Result)."
            }

        # Expected keyword matching
        expected_keywords = [w.strip().lower() for w in re.split(r'[,/ ]+', expected_topics or "") if len(w.strip()) > 3]
        matches = sum(1 for kw in expected_keywords if kw in text.lower())
        keyword_ratio = (matches / max(1, len(expected_keywords))) if expected_keywords else 0.7

        # Filler words and confidence deduction
        fillers = ["maybe", "i think", "sort of", "kind of", "not sure", "probably", "um", "uh", "i guess"]
        filler_count = sum(text.lower().count(f) for f in fillers)
        
        # Base scoring calculation
        # Length factor (optimal between 60 - 200 words)
        length_score = min(95.0, max(40.0, 50.0 + (word_count * 0.35)))
        if word_count > 250:
            length_score -= 10 # Overly long / rambling

        tech_score = round(min(98.0, max(45.0, (keyword_ratio * 40.0) + (length_score * 0.55))), 1)
        rel_score = round(min(98.0, max(50.0, (keyword_ratio * 50.0) + 45.0)), 1)
        comm_score = round(min(98.0, max(45.0, length_score + 5.0 - (filler_count * 3.0))), 1)
        conf_score = round(min(98.0, max(40.0, 85.0 - (filler_count * 7.0) + (10.0 if word_count > 50 else -10.0))), 1)
        gram_score = round(min(98.0, max(60.0, 88.0 + (5.0 if text[0].isupper() and text.endswith('.') else -5.0))), 1)

        overall_score = round(
            tech_score * 0.35 + comm_score * 0.20 + rel_score * 0.20 + conf_score * 0.15 + gram_score * 0.10,
            1
        )

        strengths = []
        if keyword_ratio > 0.4:
            strengths.append(f"Successfully integrated key terminology relating to {expected_topics.split(',')[0] if expected_topics else 'the topic'}")
        if word_count >= 50:
            strengths.append("Provided a well-developed, structured explanation with sufficient detail")
        if filler_count == 0:
            strengths.append("Spoke assertively with strong, professional confidence")
        if not strengths:
            strengths.append("Clearly stated core perspective on the subject")

        weaknesses = []
        if keyword_ratio < 0.5 and expected_topics:
            weaknesses.append(f"Could touch more upon essential concepts: {expected_topics}")
        if filler_count > 1:
            weaknesses.append("Reduce hesitation phrases ('I think', 'maybe') to project greater authority")
        if word_count < 35:
            weaknesses.append("Expand on trade-offs and edge cases rather than a single high-level point")
        if not weaknesses:
            weaknesses.append("Could include measurable metrics or past impact to stand out even further")

        feedback_summary = (
            f"Solid response demonstrating good clarity. You scored {overall_score}% overall. "
            f"Focus on deepening the technical specifics while keeping your delivery crisp and confident."
        )

        ideal_answer = (
            f"When asked '{question_text}', start with a direct definition: "
            f"Highlighting {expected_topics if expected_topics else 'the fundamental principles'}. "
            f"Next, contrast with alternatives or edge cases, and conclude with a concrete production example showing your technical decision-making."
        )

        return {
            "technical_knowledge": tech_score,
            "communication": comm_score,
            "relevance": rel_score,
            "confidence": conf_score,
            "grammar": gram_score,
            "overall": overall_score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "feedback_summary": feedback_summary,
            "ideal_answer": ideal_answer,
            "follow_up_hint": "Prepare to explain architectural decisions and handling scale in the next question."
        }

    async def generate_session_summary(
        self,
        role: str,
        difficulty: str,
        question_evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate overall session summary, category rollups, weak areas, and preparation roadmap.
        """
        if not question_evaluations:
            return {
                "overall_score": 0.0,
                "technical_score": 0.0,
                "communication_score": 0.0,
                "relevance_score": 0.0,
                "confidence_score": 0.0,
                "grammar_score": 0.0,
                "summary_feedback": "No questions answered.",
                "strengths": [],
                "weak_areas": [],
                "improvement_tips": [],
                "preparation_topics": []
            }

        # Calculate averages
        avg_tech = round(sum(q.get("technical_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)
        avg_comm = round(sum(q.get("communication_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)
        avg_rel = round(sum(q.get("relevance_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)
        avg_conf = round(sum(q.get("confidence_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)
        avg_gram = round(sum(q.get("grammar_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)
        avg_overall = round(sum(q.get("overall_score", 0.0) for q in question_evaluations) / len(question_evaluations), 1)

        # Aggregate strengths & weaknesses
        all_strengths = []
        all_weaknesses = []
        for q in question_evaluations:
            s = q.get("strengths", [])
            w = q.get("weaknesses", [])
            if isinstance(s, list):
                all_strengths.extend(s)
            if isinstance(w, list):
                all_weaknesses.extend(w)

        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        unique_weak_areas = list(dict.fromkeys(all_weaknesses))[:4]

        # Actionable improvement tips
        improvement_tips = [
            f"Focus on deep-dive explanations in {role} fundamentals to elevate Technical Knowledge score above 85%.",
            "Structure complex answers using the STAR format (Situation, Task, Action, Result) for behavioral & architectural queries.",
            "Minimize hesitation words and maintain an authoritative, consultative speaking cadence.",
            "Always state trade-offs (e.g. latency vs consistency, cost vs performance) before concluding an answer."
        ]

        # Prioritized preparation topics
        preparation_topics = [
            f"Advanced System Design & Scalability patterns for {role}",
            "Production Debugging, Error Handling & Observability best practices",
            "SQL & Database Query Optimization, Indexing and Locking",
            "Behavioral Interview Frameworks & Conflict Resolution leadership stories"
        ]

        summary_feedback = (
            f"You completed the {difficulty}-level mock interview for {role} with an overall score of {avg_overall}%. "
            f"Your strongest area was {'Communication' if avg_comm >= avg_tech else 'Technical Knowledge'} ({max(avg_comm, avg_tech)}%), "
            f"while focusing on {'Confidence and Delivery' if avg_conf < avg_tech else 'Technical depth and trade-offs'} will yield the fastest score improvements in your next round."
        )

        return {
            "overall_score": avg_overall,
            "technical_score": avg_tech,
            "communication_score": avg_comm,
            "relevance_score": avg_rel,
            "confidence_score": avg_conf,
            "grammar_score": avg_gram,
            "summary_feedback": summary_feedback,
            "strengths": unique_strengths if unique_strengths else ["Good engagement and willingness to tackle technical questions"],
            "weak_areas": unique_weak_areas if unique_weak_areas else ["Could provide deeper implementation details and edge case analysis"],
            "improvement_tips": improvement_tips,
            "preparation_topics": preparation_topics
        }

ai_service = AIService()
