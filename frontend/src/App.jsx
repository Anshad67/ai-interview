import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import InterviewReport from './pages/InterviewReport';
import InterviewHistory from './pages/InterviewHistory';
import ResumeInterview from './pages/ResumeInterview';
import JDInterview from './pages/JDInterview';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
          <Navbar />
          
          <main className="flex-1 pb-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/setup" element={<InterviewSetup />} />
              <Route path="/interview/:id" element={<InterviewRoom />} />
              <Route path="/report/:id" element={<InterviewReport />} />
              <Route path="/history" element={<InterviewHistory />} />
              <Route path="/resume-interview" element={<ResumeInterview />} />
              <Route path="/jd-interview" element={<JDInterview />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 AI Interview Coach. An Intelligent Mock Interview and Performance Evaluation System.</p>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Multi-Metric AI Scoring</span>
                <span>•</span>
                <span>Speech-to-Text & TTS Voice</span>
                <span>•</span>
                <span>Adaptive Questions</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
