import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyAPI } from '../services/api';
import { 
  Bot, PlayCircle, FileText, Briefcase, TrendingUp, Award, 
  Target, Sparkles, Clock, ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, ChevronRight, BarChart3
} from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import CategoryBar from '../components/CategoryBar';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, historyRes] = await Promise.all([
        historyAPI.getAnalytics(),
        historyAPI.getAll()
      ]);
      setAnalytics(analyticsRes.data);
      setRecentInterviews(historyRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = analytics?.progress_history?.map(p => ({
    name: p.title.replace('Interview ', 'Mock #'),
    score: p.score,
    role: p.role,
  })) || [];

  const radarData = analytics?.category_averages ? [
    { subject: 'Technical', score: analytics.category_averages.technical_knowledge || 75 },
    { subject: 'Communication', score: analytics.category_averages.communication || 80 },
    { subject: 'Relevance', score: analytics.category_averages.relevance || 78 },
    { subject: 'Confidence', score: analytics.category_averages.confidence || 72 },
    { subject: 'Grammar', score: analytics.category_averages.grammar || 85 },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-slate-950/80 border border-blue-800/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Performance Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{user?.full_name || 'Candidate'}</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sharpen your responses for <span className="font-semibold text-white">{user?.target_role || 'Software Developer'}</span> with real-time AI speech-to-text feedback, realistic virtual interviewer questioning, and detailed metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/setup"
              className="btn-primary py-3 px-5 text-sm shadow-xl"
            >
              <PlayCircle className="w-4 h-4" />
              Start Mock Interview
            </Link>
            <Link
              to="/resume-interview"
              className="btn-secondary py-3 px-4 text-sm"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Resume Mock
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat 1: Total Completed */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Interviews</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{analytics?.total_interviews || 0}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +100% completed
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Simulated full rounds</p>
        </div>

        {/* Stat 2: Average Score */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{analytics?.avg_overall_score || 0}%</span>
            <span className="text-xs text-cyan-400 font-semibold">Across all categories</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Benchmarked against industry standards</p>
        </div>

        {/* Stat 3: Best Score */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Performance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{analytics?.best_score || 0}%</span>
            <span className="text-xs text-emerald-400 font-semibold">Best round</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Latest: {analytics?.latest_score || 0}%</p>
        </div>

        {/* Stat 4: Readiness Level */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Job Readiness</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {(analytics?.avg_overall_score || 0) >= 80 ? 'Interview Ready' : 'In Training'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Based on multi-metric AI scoring</p>
        </div>

      </div>

      {/* Progress Chart & Skill Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Progress History Graph */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Interview Score Progression (Over Time)
              </h3>
              <p className="text-xs text-slate-400">Track your score improvement across successive mock sessions</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              Progress Graph
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#38bdf8', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#60a5fa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <Bot className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No mock interview history yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Complete your first mock interview to generate your dynamic progress graph.</p>
              <Link to="/setup" className="btn-primary mt-4 text-xs">Start 1st Interview</Link>
            </div>
          )}
        </div>

        {/* Right 1 Col: Category Radar / Breakdown */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Competency Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Average scores across key evaluation categories</p>
            
            <div className="space-y-3.5">
              <CategoryBar label="Technical Knowledge" score={analytics?.category_averages?.technical_knowledge || 82} />
              <CategoryBar label="Communication" score={analytics?.category_averages?.communication || 78} />
              <CategoryBar label="Relevance" score={analytics?.category_averages?.relevance || 85} />
              <CategoryBar label="Confidence" score={analytics?.category_averages?.confidence || 72} />
              <CategoryBar label="Grammar" score={analytics?.category_averages?.grammar || 84} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Evaluated by AI Engine</span>
            <Link to="/history" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              View History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 3 Quick Action Modes */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Choose Your Interview Simulation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Mode 1: Role Based */}
          <Link
            to="/setup"
            className="glass-card-interactive p-6 flex flex-col justify-between text-decoration-none group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Standard Role Mock</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select from Software Engineer, Data Analyst, Cyber Analyst, Cloud Architect, AI/ML, or HR rounds with customizable difficulty.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
              Configure & Start <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 2: Resume Based */}
          <Link
            to="/resume-interview"
            className="glass-card-interactive p-6 flex flex-col justify-between text-decoration-none group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Resume-Based Mock</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">AI EXTRACT</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your PDF/TXT resume. AI extracts your exact projects, tech stack, and asks tailored deep-dive interview questions.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              Upload Resume <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 3: Job Description Based */}
          <Link
            to="/jd-interview"
            className="glass-card-interactive p-6 flex flex-col justify-between text-decoration-none group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Job Description Mock</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">TARGETED</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste the specific job description for your dream company. AI synthesizes company-aligned technical & behavioral questions.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300">
              Match Job Description <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

      {/* Recent Interviews & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Interviews Table/Cards (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Interview Sessions</h3>
            <Link to="/history" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentInterviews.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/report/${item.id}`)}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{item.title}</span>
                    <span className={`badge-grade ${
                      item.difficulty === 'Easy' ? 'badge-easy' : item.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{item.role}</span>
                    <span>•</span>
                    <span>{item.source_type} Mode</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.created_at?.slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-white font-mono">{Math.round(item.overall_score)}%</span>
                    <p className="text-[10px] text-slate-400">Overall Score</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Growth Roadmap (1 Col) */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            AI Preparation Roadmap
          </div>
          <h3 className="text-base font-bold text-white">Recommended Next Focus Areas</h3>
          
          <div className="space-y-2.5">
            {(analytics?.improvements_pool && analytics.improvements_pool.length > 0
              ? analytics.improvements_pool
              : [
                  "Practice explaining trade-offs between speed and consistency",
                  "Structure complex architectural questions using STAR methodology",
                  "Deepen knowledge in database query optimization and indexing"
                ]
            ).slice(0, 3).map((tip, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <Link to="/setup" className="w-full btn-primary text-xs py-2">
              Practice These Topics in Mock
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
