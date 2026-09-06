import React from 'react';

const ScoreGauge = ({ score = 0, size = 140, strokeWidth = 10, label = "Overall Score" }) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = "#3b82f6"; // Blue
  let grade = "B";
  let gradeColor = "text-blue-400 bg-blue-500/10 border-blue-500/30";

  if (normalizedScore >= 85) {
    color = "#10b981"; // Emerald
    grade = "A+";
    gradeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  } else if (normalizedScore >= 75) {
    color = "#06b6d4"; // Cyan
    grade = "A";
    gradeColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  } else if (normalizedScore >= 65) {
    color = "#f59e0b"; // Amber
    grade = "B";
    gradeColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else {
    color = "#f43f5e"; // Rose
    grade = "C";
    gradeColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active Animated Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease" }}
          />
        </svg>

        {/* Center Score & Grade */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {normalizedScore}%
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${gradeColor}`}>
            Grade {grade}
          </span>
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-slate-400 mt-2">{label}</p>}
    </div>
  );
};

export default ScoreGauge;
