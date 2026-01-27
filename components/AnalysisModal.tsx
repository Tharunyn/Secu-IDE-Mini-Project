'use client';
import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  loading: boolean;
  error: string | null;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, summary, loading, error }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">AI Security Analysis Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Analyzing security findings...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && summary && (
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                {summary.split('\n').map((line, idx) => {
                  // Format headings
                  if (line.match(/^#+\s/)) {
                    const level = line.match(/^#+/)?.[0].length || 0;
                    const text = line.replace(/^#+\s/, '');
                    const HeadingComponents = {
                      1: 'h1',
                      2: 'h2',
                      3: 'h3',
                      4: 'h4',
                      5: 'h5',
                      6: 'h6',
                    } as const;

                    const headingLevel = Math.min(Math.max(level, 1), 6) as keyof typeof HeadingComponents;
                    const TagName = HeadingComponents[headingLevel];
                    
                    return React.createElement(
                      TagName,
                      {
                        key: idx,
                        className: `font-bold text-white mt-4 mb-2 ${level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'}`
                      },
                      text
                    );
                  }
                  // Format numbered/bulleted lists
                  if (line.match(/^[\d\-•]\s/)) {
                    return (
                      <div key={idx} className="ml-4 mb-1 text-gray-300">
                        {line}
                      </div>
                    );
                  }
                  // Regular paragraphs
                  if (line.trim()) {
                    return (
                      <p key={idx} className="mb-3 text-gray-300">
                        {line}
                      </p>
                    );
                  }
                  return <br key={idx} />;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;

