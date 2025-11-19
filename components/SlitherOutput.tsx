'use client';
import React from 'react';
import { Sparkles } from 'lucide-react';

interface SlitherOutputProps {
  output: string;
  errors: string;
  loading: boolean;
  onAnalyzeWithAI?: () => void;
  aiAnalyzing?: boolean;
}

const SlitherOutput: React.FC<SlitherOutputProps> = ({ 
  output, 
  errors, 
  loading, 
  onAnalyzeWithAI,
  aiAnalyzing = false 
}) => (
  <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-auto max-h-64 text-xs border border-gray-700 shadow-lg">
    <div className="flex items-center justify-between mb-3">
      <strong className="block text-yellow-300 font-semibold text-sm">Slither Security Analysis</strong>
      {!loading && !errors && output && onAnalyzeWithAI && (
        <button
          onClick={onAnalyzeWithAI}
          disabled={aiAnalyzing}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} className={aiAnalyzing ? 'animate-pulse' : ''} />
          {aiAnalyzing ? 'Analyzing...' : 'AI Analyze'}
        </button>
      )}
    </div>
    {loading && <div className="text-yellow-300">Running Slither analysis...</div>}
    {errors && <pre className="text-red-400 whitespace-pre-wrap">{errors}</pre>}
    {!loading && !errors && output && <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>}
    {!loading && !errors && !output && <div className="text-gray-500">No results yet. Click 'Run Test'!</div>}
  </div>
);

export default SlitherOutput;




