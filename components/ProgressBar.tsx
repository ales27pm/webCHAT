import React from 'react';
import { Download } from 'lucide-react';

interface ProgressBarProps {
  progress: string; // The text description
  value: number; // 0 to 1
  isVisible: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, value, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-zinc-800 border border-zinc-700 shadow-2xl rounded-xl p-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Download size={16} className="text-blue-500 animate-bounce" />
                Initializing Model
            </h3>
            <span className="text-xs font-mono text-zinc-400">{(value * 100).toFixed(0)}%</span>
        </div>
        
        <div className="w-full bg-zinc-900 rounded-full h-2 mb-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${Math.max(5, value * 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        <p className="text-xs text-zinc-400 truncate font-mono">
            {progress || "Preparing..."}
        </p>
      </div>
    </div>
  );
};