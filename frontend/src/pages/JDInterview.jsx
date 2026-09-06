import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, interviewAPI } from '../services/api';
import { 
  Briefcase, Sparkles, Building2, Layers, CheckCircle2, 
  ArrowRight, Bot, Cpu, Target, AlertCircle 
} from 'lucide-react';

const JDInterview = () => {
  const navigate = useNavigate();
  const [jdText, setJdText] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const sampleJD = `We are looking for a Senior Full Stack Software Engineer at Google / Stripe.
Key Responsibilities:
- Design, build, and maintain high-performance microservices and RESTful / GraphQL APIs.
- Work closely with React frontend and Python / Node.js distributed backends.
- Optimize PostgreSQL and Redis caching for ultra-low latency query throughput.
- Lead architectural reviews, Docker / Kubernetes containerization, and CI/CD pipelines.
Requirements:
- 4+ years of professional software engineering experience.
- Strong proficiency in JavaScript/TypeScript, Python, and SQL databases.
- Deep understanding of distributed system architecture, caching, and database transactions.`;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const res = await uploadAPI.analyzeJD({
        jd_text: jdText,
        target_company: targetCompany,
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error('Error analyzing JD:', err);
      setError('Failed to analyze job description.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartJDMock = async () => {
    if (!analysis) return;
    setIsStarting(true);
    setError('');

    try {
      const res = await interviewAPI.create({
        role: analysis.inferred_role,
        interview_type: 'Mixed',
        difficulty: analysis.difficulty,
        source_type: 'Job Description',
        jd_text: jdText,
        total_questions: 5,
        title: `${analysis.target_company || 'Target Company'} — ${analysis.inferred_role} Mock`,
      });

      navigate(`/interview/${res.data.id}`);
    } catch (err) {
      console.error('Error starting JD mock:', err);
      setError('Failed to initialize JD interview.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
          <Target className="w-3.5 h-3.5" />
          Job Description Alignment
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Job Description-Targeted Mock Interview
        </h1>
        <p className="text-slate-400 text-sm">
          Paste the job posting you are preparing for. The AI will synthesize questions aligned directly with the company's exact requirements and expectations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="glass-panel p-6 sm:p-8 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Company (Optional)</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Microsoft, Stripe..."
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setJdText(sampleJD)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 self-end"
          >
            + Load Sample Senior Full-Stack JD
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Paste Job Description Text</label>
          <textarea
            rows={8}
            required
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste complete job description requirements, responsibilities, and qualifications..."
            className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none font-sans"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAnalyzing || !jdText.trim()}
            className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
          >
            {isAnalyzing ? 'Analyzing Job Description...' : 'Analyze Requirements & Match Questions'}
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* Analysis Result Card */}
      {analysis && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {analysis.inferred_role}
                  <span className={`badge-grade ${
                    analysis.difficulty === 'Easy' ? 'badge-easy' : analysis.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
                  }`}>
                    {analysis.difficulty} Level
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted for: <b className="text-slate-200">{analysis.target_company || 'Target Employer'}</b>
                </p>
              </div>
            </div>

            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Requirements Mapped
            </span>
          </div>

          {/* Key Extracted Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Matched High-Priority Competencies
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.key_requirements?.map((req, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStartJDMock}
              disabled={isStarting}
              className="btn-primary py-3 px-8 text-sm font-bold shadow-xl flex items-center gap-2"
            >
              {isStarting ? 'Launching Simulation...' : 'Start Targeted Mock Interview'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default JDInterview;
