import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI, uploadAPI } from '../services/api';
import { 
  Bot, PlayCircle, Sparkles, Check, FileUp, Briefcase, 
  Code, Shield, Database, Cpu, Users, Layers, Video, Mic, ArrowRight 
} from 'lucide-react';
import WebcamView from '../components/WebcamView';

const PREDEFINED_ROLES = [
  { title: "Software Developer", icon: Code, desc: "Data structures, algorithms, clean code, OOP principles & web architecture" },
  { title: "Full Stack Developer", icon: Layers, desc: "React, Node.js, databases, REST APIs, deployment & full lifecycle" },
  { title: "Data Analyst", icon: Database, desc: "SQL, data cleansing, aggregations, KPIs, visualization & reporting" },
  { title: "Cybersecurity Analyst", icon: Shield, desc: "Incident response, network security, threat modeling, OWASP & encryption" },
  { title: "AI / Machine Learning Engineer", icon: Cpu, desc: "Model architecture, deep learning, LLMs, fine-tuning, RAG & MLOps" },
  { title: "HR & Behavioral Interview", icon: Users, desc: "STAR method, conflict resolution, leadership stories & workplace ethics" },
];

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("Software Developer");
  const [customRole, setCustomRole] = useState("");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalRole = selectedRole === "Custom" ? customRole.trim() : selectedRole;
    if (!finalRole) {
      setError("Please specify or select a job role.");
      setLoading(false);
      return;
    }

    try {
      const res = await interviewAPI.create({
        role: finalRole,
        interview_type: interviewType,
        difficulty: difficulty,
        source_type: "Standard",
        total_questions: questionCount,
        title: `${finalRole} — ${difficulty} ${interviewType} Mock`,
      });

      const session = res.data;
      navigate(`/interview/${session.id}`);
    } catch (err) {
      console.error("Error creating interview:", err);
      setError(err.response?.data?.detail || "Failed to start interview session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          Interactive AI Simulation Room
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Configure Your Mock Interview
        </h1>
        <p className="text-slate-400 text-sm">
          Customize target job role, interview type, and difficulty level. The AI interviewer will generate questions and evaluate your responses in real time.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleStart} className="space-y-8">
        
        {/* Step 1: Choose Target Job Role */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">1</span>
              Select Target Role
            </h2>
            <span className="text-xs text-slate-400">Questions are synthesized for your exact domain</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREDEFINED_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.title;
              return (
                <div
                  key={role.title}
                  onClick={() => setSelectedRole(role.title)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </div>
                    <h3 className="font-semibold text-sm text-white">{role.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{role.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Role Input option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSelectedRole("Custom")}
              className={`text-xs font-semibold text-blue-400 hover:underline ${selectedRole === "Custom" ? "underline" : ""}`}
            >
              + Need a custom role? (e.g., iOS Engineer, DevOps, Product Manager)
            </button>
            {selectedRole === "Custom" && (
              <div className="mt-3">
                <input
                  type="text"
                  required
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter custom role title, e.g. Cloud Solutions Architect..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Mode & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Interview Type */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">2</span>
              Interview Focus
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {["Technical", "HR / Behavioral", "Mixed"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setInterviewType(type.includes("HR") ? "HR" : type)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    (type === "Technical" && interviewType === "Technical") ||
                    (type.includes("HR") && interviewType === "HR") ||
                    (type === "Mixed" && interviewType === "Mixed")
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {interviewType === "Technical" && "Focuses on deep coding concepts, architecture, SQL, and practical problem solving."}
              {interviewType === "HR" && "Evaluates situational judgment, communication clarity, leadership, and culture fit."}
              {interviewType === "Mixed" && "Combines both core technical questions and behavioral scenarios."}
            </p>
          </div>

          {/* Difficulty Level */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">3</span>
              Experience & Difficulty
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {[
                { level: "Easy", desc: "Junior (0-2 yrs)" },
                { level: "Medium", desc: "Mid-Level (2-5 yrs)" },
                { level: "Hard", desc: "Senior / Lead (5+ yrs)" }
              ].map((diff) => (
                <button
                  type="button"
                  key={diff.level}
                  onClick={() => setDifficulty(diff.level)}
                  className={`p-3 rounded-xl border text-xs transition-all flex flex-col items-center text-center ${
                    difficulty === diff.level
                      ? diff.level === "Easy" ? 'bg-emerald-600 text-white border-emerald-500' :
                        diff.level === "Medium" ? 'bg-amber-600 text-white border-amber-500' : 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold">{diff.level}</span>
                  <span className="text-[10px] opacity-80">{diff.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Adaptive engine adjusts follow-up depth based on how well you respond.
            </p>
          </div>

        </div>

        {/* Step 3: Question Count & Device Check Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel p-6 space-y-4 md:col-span-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">4</span>
              Round Length
            </h2>
            <div className="flex gap-2">
              {[3, 5, 8].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    questionCount === count
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Estimated duration: ~{questionCount * 2} minutes.
            </p>
          </div>

          <div className="glass-panel p-6 space-y-3 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  Hardware & Audio Readiness
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Mic & Webcam Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                You can answer either via voice (speech-to-text) or text typing. Audio playback with Text-to-Speech will read out each question.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3 px-8 text-sm font-bold shadow-xl flex items-center gap-2"
              >
                {loading ? 'Initializing Simulation...' : 'Launch Live Mock Interview'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
};

export default InterviewSetup;
