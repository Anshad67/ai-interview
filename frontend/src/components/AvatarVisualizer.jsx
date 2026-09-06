import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';

const AvatarVisualizer = ({ questionText, autoPlay = true, onSpeechEnd }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (questionText && autoPlay && !isMuted) {
      speakQuestion(questionText);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [questionText, isMuted]);

  const speakQuestion = (text) => {
    if (!('speechSynthesis' in window) || isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Prefer high quality English voice (Google US English, Samantha, Microsoft David/Zira)
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleRepeat = () => {
    speakQuestion(questionText);
  };

  const toggleMute = () => {
    if (!isMuted) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakQuestion(questionText);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Background radial aura */}
      <div className={`absolute w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
        isSpeaking ? 'bg-blue-500/20 scale-125' : 'bg-blue-600/10 scale-100'
      }`} />

      {/* Outer Pulse Rings when speaking */}
      <div className="relative mb-5">
        {isSpeaking && (
          <>
            <div className="absolute -inset-4 rounded-full border border-blue-500/30 animate-ping" />
            <div className="absolute -inset-2 rounded-full border border-cyan-400/40 animate-pulse" />
          </>
        )}

        {/* AI Avatar Face Frame */}
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr transition-all duration-500 ${
          isSpeaking 
            ? 'from-blue-500 via-cyan-400 to-indigo-500 shadow-xl shadow-blue-500/30' 
            : 'from-slate-700 to-slate-800'
        }`}>
          <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-slate-950">
            {/* SVG AI Humanoid Portrait */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200">
              <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {/* Head Silhouette */}
              <circle cx="50" cy="45" r="24" fill="url(#avatarGrad)" opacity="0.9" />
              {/* Eyes */}
              <circle cx="42" cy="42" r="3" fill="#ffffff" />
              <circle cx="58" cy="42" r="3" fill="#ffffff" />
              {/* Dynamic Animated Mouth */}
              {isSpeaking ? (
                <ellipse cx="50" cy="54" rx="6" ry="4" fill="#0f172a">
                  <animate attributeName="ry" values="2;5;3;6;2" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="rx" values="5;7;6;8;5" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <path d="M 44 54 Q 50 58 56 54" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              )}
              {/* Shoulders */}
              <path d="M 20 88 Q 50 68 80 88" fill="#1e293b" />
            </svg>
          </div>

          {/* AI Badge on avatar */}
          <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 border-2 border-slate-950 text-white shadow">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Speaker Name & Dynamic Status */}
      <div className="text-center mb-4">
        <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
          Dr. Samantha AI
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            AI Interviewer
          </span>
        </h4>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {isSpeaking ? 'Speaking Question...' : 'Listening to your response'}
        </p>
      </div>

      {/* Audio Waveform Equalizer when speaking */}
      <div className="h-7 flex items-center justify-center gap-1 mb-4">
        {isSpeaking ? (
          <>
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
          </>
        ) : (
          <div className="h-0.5 w-32 bg-slate-800 rounded" />
        )}
      </div>

      {/* Sound Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRepeat}
          disabled={isSpeaking}
          title="Repeat Question Audio"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Repeat Question
        </button>
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${
            isMuted 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {isMuted ? 'Muted' : 'Sound On'}
        </button>
      </div>

    </div>
  );
};

export default AvatarVisualizer;
