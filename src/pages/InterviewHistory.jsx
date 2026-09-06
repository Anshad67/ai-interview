import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/api';
import { 
  History, Search, Filter, Trash2, ArrowRight, PlayCircle, 
  Clock, Award, Bot, FileText, CheckCircle2, ChevronRight 
} from 'lucide-react';

const InterviewHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.getAll();
      setSessions(res.data);
      setFilteredSessions(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = sessions;
    if (searchTerm.trim()) {
      result = result.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedDifficulty !== 'All') {
      result = result.filter(s => s.difficulty === selectedDifficulty);
    }
    setFilteredSessions(result);
  }, [searchTerm, selectedDifficulty, sessions]);

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this interview record?')) {
      try {
        await historyAPI.deleteSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (err) {
        alert('Failed to delete interview record.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            Interview Archive & Performance Log
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mock Interview History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past mock simulations, track score progressions, and re-read AI coach model answers.
          </p>
        </div>

        <Link to="/setup" className="btn-primary text-xs py-2.5 px-4 self-start sm:self-auto">
          <PlayCircle className="w-4 h-4" />
          Start New Mock
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by role or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <span className="text-xs text-slate-400 hidden sm:inline">Difficulty:</span>
          <div className="flex rounded-lg bg-slate-900 p-0.5 w-full sm:w-auto">
            {["All", "Easy", "Medium", "Hard"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedDifficulty(lvl)}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedDifficulty === lvl
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading interview history...</div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions.map((session, idx) => (
            <div
              key={session.id}
              onClick={() => navigate(`/report/${session.id}`)}
              className="glass-card-interactive p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                    {session.title}
                  </span>
                  <span className={`badge-grade ${
                    session.difficulty === 'Easy' ? 'badge-easy' : session.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
                  }`}>
                    {session.difficulty}
                  </span>
                  <span className="badge-grade badge-blue text-[10px]">{session.interview_type}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {session.summary_feedback || 'Completed full AI mock simulation.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>Role: {session.role}</span>
                  <span>•</span>
                  <span>{session.total_questions} Questions</span>
                  <span>•</span>
                  <span>Mode: {session.source_type}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.created_at?.slice(0, 10)}
                  </span>
                </div>
              </div>

              {/* Score & Action Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {Math.round(session.overall_score)}%
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Overall Score</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 glass-panel text-center space-y-4 max-w-md mx-auto">
          <Bot className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Interviews Found</h3>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'No results matched your search query.' : 'You haven’t completed any mock interviews yet.'}
          </p>
          <Link to="/setup" className="btn-primary text-xs inline-flex">Start Your First Mock</Link>
        </div>
      )}

    </div>
  );
};

export default InterviewHistory;
