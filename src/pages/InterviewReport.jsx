import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { 
  Bot, Award, Download, RotateCcw, ArrowLeft, CheckCircle2, 
  AlertCircle, Sparkles, Clock, FileText, Share2, Layers, BookOpen
} from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import CategoryBar from '../components/CategoryBar';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await interviewAPI.getReport(id);
      setSession(res.data);
      if (res.data.overall_score >= 75) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Could not locate the interview evaluation report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Open printable report view in new window for direct Save as PDF / Print
    const downloadUrl = interviewAPI.downloadPDFUrl(id);
    window.open(downloadUrl, '_blank');
  };


  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500 flex items-center justify-center animate-spin">
          <Bot className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Generating Comprehensive Evaluation Report...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-panel text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Report Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Unable to load report.'}</p>
        <button onClick={() => navigate('/history')} className="btn-primary text-xs">Return to History</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/history" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            {downloading ? 'Exporting PDF...' : 'Download PDF Report'}
          </button>
          
          <Link
            to="/setup"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake / New Mock
          </Link>
        </div>
      </div>

      {/* Printable Report Container */}
      <div ref={reportRef} className="space-y-8">
        
        {/* Header Hero Card */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className={`badge-grade ${
                  session.difficulty === 'Easy' ? 'badge-easy' : session.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
                }`}>
                  {session.difficulty} Level
                </span>
                <span className="badge-grade badge-blue">{session.interview_type} Focus</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {session.created_at?.slice(0, 10)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {session.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed">
                {session.summary_feedback || `Comprehensive AI assessment covering ${session.total_questions} questions across technical accuracy, communication, and confidence.`}
              </p>
            </div>

            {/* Score Radial Gauge */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800 shrink-0">
              <ScoreGauge score={session.overall_score} size={130} label="Final Score" />
            </div>

          </div>
        </div>

        {/* Competency Breakdown & Strengths Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Scores */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Category Performance Breakdown
              </h3>
              <span className="text-xs text-slate-400">0–100 Scale</span>
            </div>

            <div className="space-y-4">
              <CategoryBar label="Technical Knowledge" score={session.technical_score} />
              <CategoryBar label="Communication" score={session.communication_score} />
              <CategoryBar label="Relevance" score={session.relevance_score} />
              <CategoryBar label="Confidence" score={session.confidence_score} />
              <CategoryBar label="Grammar" score={session.grammar_score} />
            </div>
          </div>

          {/* Strengths & Weak Areas */}
          <div className="glass-panel p-6 space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
                <CheckCircle2 className="w-4 h-4" />
                Core Strengths Identified
              </h4>
              <div className="space-y-2">
                {session.strengths?.map((str, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200">
                    • {str}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2.5">
                <AlertCircle className="w-4 h-4" />
                Priority Weak Areas to Refine
              </h4>
              <div className="space-y-2">
                {session.weak_areas?.map((wk, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200">
                    • {wk}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Actionable Improvement Tips & Next Preparation Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="glass-panel p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Actionable Improvement Tips
            </h3>
            <div className="space-y-2">
              {session.improvement_tips?.map((tip, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Targeted Preparation Topics for Next Round
            </h3>
            <div className="space-y-2">
              {session.preparation_topics?.map((topic, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Detailed Question-by-Question Review */}
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Question-by-Question Detailed Review</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare your exact response against AI evaluation notes and top candidate model answers.
            </p>
          </div>

          <div className="space-y-6">
            {session.questions?.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                      #{q.question_number}
                    </span>
                    <span className="font-bold text-sm text-white">{q.category}</span>
                    <span className="badge-grade badge-blue text-[10px]">{q.difficulty}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white font-mono">
                      {Math.round(q.scores?.overall || q.overall_score || 0)}%
                    </span>
                    <span className="text-xs text-slate-400">Score</span>
                  </div>
                </div>

                {/* Question Prompt */}
                <p className="text-sm font-semibold text-white bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  "{q.question_text}"
                </p>

                {/* Candidate Response */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Answer:</span>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    {q.user_answer_text || <span className="italic text-slate-500">No answer recorded.</span>}
                  </div>
                </div>

                {/* AI Assessment & Model Answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {q.feedback_summary && (
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                      <span className="font-semibold text-blue-400 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" /> AI Feedback:
                      </span>
                      <p className="text-slate-300">{q.feedback_summary}</p>
                    </div>
                  )}

                  {q.ideal_answer && (
                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs space-y-1">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Top Candidate Model Answer:
                      </span>
                      <p className="text-slate-300 italic">"{q.ideal_answer}"</p>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default InterviewReport;
