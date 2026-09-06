import React from 'react';
import { Code, MessageSquare, Target, Zap, CheckCircle2 } from 'lucide-react';

const CategoryBar = ({ label, score = 0, iconName = "Code" }) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  let colorClass = "bg-blue-500";
  let textClass = "text-blue-400";
  let bgBadge = "bg-blue-500/10 border-blue-500/20 text-blue-300";

  if (normalizedScore >= 85) {
    colorClass = "bg-emerald-500";
    textClass = "text-emerald-400";
    bgBadge = "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
  } else if (normalizedScore >= 75) {
    colorClass = "bg-cyan-500";
    textClass = "text-cyan-400";
    bgBadge = "bg-cyan-500/10 border-cyan-500/20 text-cyan-300";
  } else if (normalizedScore >= 65) {
    colorClass = "bg-amber-500";
    textClass = "text-amber-400";
    bgBadge = "bg-amber-500/10 border-amber-500/20 text-amber-300";
  } else {
    colorClass = "bg-rose-500";
    textClass = "text-rose-400";
    bgBadge = "bg-rose-500/10 border-rose-500/20 text-rose-300";
  }

  const renderIcon = () => {
    switch (label.toLowerCase()) {
      case 'technical knowledge':
      case 'technical':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'relevance':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'confidence':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          {renderIcon()}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${bgBadge}`}>
            {normalizedScore >= 80 ? 'Mastered' : normalizedScore >= 70 ? 'Proficient' : 'Developing'}
          </span>
          <span className="font-bold text-white font-mono">{normalizedScore}%</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
};

export default CategoryBar;
