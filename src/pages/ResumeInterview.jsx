import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, interviewAPI } from '../services/api';
import { 
  FileText, UploadCloud, Sparkles, CheckCircle2, ArrowRight, 
  Cpu, Layers, AlertCircle, Bot, FileCheck, X 
} from 'lucide-react';

const ResumeInterview = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewType, setInterviewType] = useState('Technical');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.endsWith('.pdf') && !selected.name.endsWith('.txt')) {
      setError('Please upload a PDF or TXT resume document.');
      return;
    }

    setFile(selected);
    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await uploadAPI.uploadResume(formData);
      setResumeData(res.data);
      if (res.data.inferred_role) {
        setTargetRole(res.data.inferred_role);
      }
    } catch (err) {
      console.error('Error parsing resume:', err);
      setError(err.response?.data?.detail || 'Failed to extract text from resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartResumeMock = async () => {
    if (!resumeData) {
      setError('Please upload your resume first.');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      const res = await interviewAPI.create({
        role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        source_type: 'Resume',
        resume_text: resumeData.full_text,
        total_questions: 5,
        title: `Resume-Based Mock: ${targetRole} (${resumeData.candidate_name || 'Candidate'})`,
      });

      navigate(`/interview/${res.data.id}`);
    } catch (err) {
      console.error('Error creating resume interview:', err);
      setError('Failed to initialize resume mock session.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI Resume Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Resume-Tailored Mock Interview
        </h1>
        <p className="text-slate-400 text-sm">
          Upload your resume. The AI will extract your projects, skills, and technical stack to conduct an authentic personalized interview.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      {!resumeData ? (
        <div className="glass-panel p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Upload Your Resume Document</h3>
              <p className="text-xs text-slate-400">Supports PDF and TXT files up to 10MB</p>
            </div>

            <label className="btn-primary py-3 px-6 text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {isUploading ? 'Extracting Resume Text...' : 'Select Resume File'}
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      ) : (
        /* Parsed Resume Details Card */
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {resumeData.filename}
                  <span className="text-xs text-emerald-400 font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Extracted Successfully
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Candidate: <b className="text-slate-200">{resumeData.candidate_name}</b> • Experience: <b className="text-slate-200">{resumeData.estimated_experience}</b>
                </p>
              </div>
            </div>

            <button
              onClick={() => { setResumeData(null); setFile(null); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Extracted Skills Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              AI-Detected Technical Competencies
            </h4>
            <div className="flex flex-wrap gap-2">
              {resumeData.detected_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
              {(!resumeData.detected_skills || resumeData.detected_skills.length === 0) && (
                <span className="text-xs text-slate-500 italic">General software development competencies extracted</span>
              )}
            </div>
          </div>

          {/* Interview Customization for this Resume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Interview Focus</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Technical">Technical Deep-Dive</option>
                <option value="HR">Behavioral / Leadership</option>
                <option value="Mixed">Mixed (Technical + Projects)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Junior (Easy)</option>
                <option value="Medium">Mid-Level (Medium)</option>
                <option value="Hard">Senior / Staff (Hard)</option>
              </select>
            </div>

          </div>

          {/* Resume Text Snippet Peek */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              Resume Extracted Highlights Preview:
            </span>
            <p className="text-slate-400 line-clamp-3 italic">
              "{resumeData.resume_text_preview}"
            </p>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStartResumeMock}
              disabled={isStarting}
              className="btn-primary py-3 px-8 text-sm font-bold shadow-xl flex items-center gap-2"
            >
              {isStarting ? 'Synthesizing Resume Questions...' : 'Start Resume Mock Interview'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default ResumeInterview;
