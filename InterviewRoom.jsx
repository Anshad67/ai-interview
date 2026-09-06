import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Sparkles, Send, ArrowRight, CheckCircle2, AlertCircle, 
  HelpCircle, Clock, Award, Shield, Lightbulb, ChevronRight, Check
} from 'lucide-react';
import AvatarVisualizer from '../components/AvatarVisualizer';
import WebcamView from '../components/WebcamView';
import VoiceRecorder from '../components/VoiceRecorder';
import CategoryBar from '../components/CategoryBar';
import confetti from 'canvas-confetti';

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [duration, setDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationModal, setEvaluationModal] = useState(null); // stores instant feedback result
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await interviewAPI.getCurrent(id);
      const s = res.data;
      setSession(s);

      // Find the first unanswered question
      const unanswered = s.questions.find((q) => !q.is_answered) || s.questions[0];
      setCurrentQuestion(unanswered);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Could not load interview session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      alert('Please provide an answer by speaking or typing before submitting.');
      return;
    }

    setIsSubmitting(true);
    setIsListening(false);

    try {
      const res = await interviewAPI.submitAnswer({
        question_id: currentQuestion.id,
        answer_text: answerText,
        audio_duration: duration,
      });

      const result = res.data;
      setEvaluationModal(result);

      if (result.scores.overall >= 80) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to evaluate answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!evaluationModal) return;

    if (evaluationModal.is_session_completed) {
      // Finished all questions! Go to final comprehensive report
      navigate(`/report/${session.id}`);
    } else {
      // Advance to next question
      setCurrentQuestion(evaluationModal.next_question);
      setAnswerText('');
      setDuration(0);
      setEvaluationModal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500 flex items-center justify-center animate-bounce">
          <Bot className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Initializing AI Interview Simulation Room...</p>
      </div>
    );
  }

  if (error || !session || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-panel text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Interview Not Available</h3>
        <p className="text-xs text-slate-400">{error || 'Session could not be located.'}</p>
        <button onClick={() => navigate('/setup')} className="btn-primary text-xs">Start New Session</button>
      </div>
    );
  }

  const questionProgress = `${currentQuestion.question_number} of ${session.total_questions}`;
  const progressPercent = (currentQuestion.question_number / session.total_questions) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">{session.title}</h1>
            <span className={`badge-grade ${
              session.difficulty === 'Easy' ? 'badge-easy' : session.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
            }`}>
              {session.difficulty}
            </span>
            <span className="badge-grade badge-blue">{session.interview_type}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Role: {session.role} • Simulated Interview</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-300">Question {questionProgress}</span>
            <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Interviewer on Left, Candidate Answering on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: AI Interviewer Avatar & Question Box (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          
          {/* Virtual AI Avatar with TTS audio speaking */}
          <AvatarVisualizer
            questionText={currentQuestion.question_text}
            autoPlay={true}
          />

          {/* Active Question Card */}
          <div className="glass-panel p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {currentQuestion.category} Question
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Q#{currentQuestion.question_number}</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                "{currentQuestion.question_text}"
              </h3>
            </div>

            {currentQuestion.expected_topics && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Key Topics to Address:
                </p>
                <p className="text-slate-400">{currentQuestion.expected_topics}</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Candidate Webcam & Response Engine (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 flex flex-col">
          
          {/* Webcam Candidate Preview */}
          <div className="w-full">
            <WebcamView
              candidateName={user?.full_name || 'Candidate'}
              isListening={isListening}
            />
          </div>

          {/* Voice & Text Response Box */}
          <div className="flex-1">
            <VoiceRecorder
              answerText={answerText}
              setAnswerText={setAnswerText}
              isListening={isListening}
              setIsListening={setIsListening}
              duration={duration}
              setDuration={setDuration}
            />
          </div>

          {/* Action Submission Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Recommended answer time: 1–3 minutes</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !answerText.trim()}
              onClick={handleSubmitAnswer}
              className="btn-primary py-3 px-7 text-sm font-bold shadow-xl flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>AI is Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Answer for Evaluation</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Instant Per-Question AI Evaluation Modal */}
      {evaluationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Evaluation & Feedback</h3>
                  <p className="text-xs text-slate-400">Question #{currentQuestion.question_number} Scoring Breakdown</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-white font-mono">{Math.round(evaluationModal.scores.overall)}%</span>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Question Score</p>
              </div>
            </div>

            {/* Category Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <CategoryBar label="Technical Knowledge" score={evaluationModal.scores.technical_knowledge} />
              <CategoryBar label="Communication" score={evaluationModal.scores.communication} />
              <CategoryBar label="Relevance" score={evaluationModal.scores.relevance} />
              <CategoryBar label="Confidence" score={evaluationModal.scores.confidence} />
            </div>

            {/* Feedback Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Coach Assessment</h4>
              <p className="text-sm text-slate-200 leading-relaxed p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                {evaluationModal.feedback_summary}
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  What You Did Well
                </h4>
                <div className="space-y-1.5">
                  {evaluationModal.strengths.map((st, i) => (
                    <div key={i} className="text-xs text-slate-300 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      • {st}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Areas to Refine
                </h4>
                <div className="space-y-1.5">
                  {evaluationModal.weaknesses.map((wk, i) => (
                    <div key={i} className="text-xs text-slate-300 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      • {wk}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ideal Model Answer */}
            {evaluationModal.ideal_answer && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Top Candidate Ideal Model Answer
                </h4>
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 leading-relaxed italic">
                  "{evaluationModal.ideal_answer}"
                </div>
              </div>
            )}

            {/* Action Proceed Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="btn-primary py-3 px-8 text-sm font-bold shadow-xl flex items-center gap-2"
              >
                {evaluationModal.is_session_completed ? (
                  <>
                    <span>View Comprehensive Interview Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next Adaptive Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewRoom;
