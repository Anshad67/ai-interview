import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Trash2, Edit3, Sparkles, Volume2 } from 'lucide-react';

const VoiceRecorder = ({ answerText, setAnswerText, isListening, setIsListening, duration, setDuration }) => {
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setAnswerText(currentTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If still flagged as listening, restart (for continuous capture)
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your answer in Text Mode.');
      setMode('text');
      return;
    }

    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const handleClear = () => {
    setAnswerText('');
    setDuration(0);
    if (isListening) {
      toggleListening();
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl p-5">
      
      {/* Header bar with Mode switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response Mode:</span>
          <div className="flex rounded-lg bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'voice' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Voice Answer
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('text');
                if (isListening) toggleListening();
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'text' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Type Text
            </button>
          </div>
        </div>

        {/* Word Count and Duration indicator */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>{wordCount} words</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className={duration > 180 ? 'text-amber-400 font-bold' : ''}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Voice Control Action Banner (When Voice Mode is active) */}
      {mode === 'voice' && (
        <div className="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-600/30 hover:scale-105'
              }`}
            >
              {isListening ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span className="text-xs">Stop Speaking</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="text-xs">Start Speaking</span>
                </>
              )}
            </button>

            <div>
              <p className="text-xs font-medium text-white">
                {isListening ? 'Recording voice response...' : 'Click to answer with voice'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isListening ? 'AI speech recognition is transcribing in real time' : 'Speaks into microphone naturally'}
              </p>
            </div>
          </div>

          {isListening && (
            <div className="hidden sm:flex items-center gap-1">
              <div className="wave-bar bg-rose-500" />
              <div className="wave-bar bg-rose-500" />
              <div className="wave-bar bg-rose-500" />
              <div className="wave-bar bg-rose-500" />
            </div>
          )}
        </div>
      )}

      {/* Live Transcript / Editable Text Area */}
      <div className="flex-1 relative flex flex-col">
        <label className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
          <span>{mode === 'voice' ? 'Live Speech Transcript (Editable)' : 'Your Written Answer'}</span>
          {answerText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </label>

        <textarea
          rows={6}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder={
            mode === 'voice'
              ? 'Click "Start Speaking" and answer the question. Your voice will be transcribed here automatically, and you can edit any words before submitting...'
              : 'Type your comprehensive response here. Include key concepts, architectural trade-offs, and examples...'
          }
          className="flex-1 w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Footer tips */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          Pro-tip: Explain technical reasoning and practical use cases for top scores.
        </span>
        <span className="hidden sm:inline">Press Submit when ready</span>
      </div>

    </div>
  );
};

export default VoiceRecorder;
