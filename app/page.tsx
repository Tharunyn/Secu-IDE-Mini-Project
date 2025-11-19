'use client';
import React, { useRef, useState } from 'react';
import CodeEditor, { CodeEditorHandle } from '@/components/CodeEditor';
import OutputPanel from '@/components/OutputPanel';
import SlitherOutput from '@/components/SlitherOutput';
import AnalysisModal from '@/components/AnalysisModal';
import { MessageSquare, X } from 'lucide-react';

const HomePage: React.FC = () => {
  const [output, setOutput] = useState('');
  const [aiSidebarOpen, setAISidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'assistant'|'system', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDebug, setAiDebug] = useState<any>(null);
  const [slitherLoading, setSlitherLoading] = useState(false);
  const [slitherOutput, setSlitherOutput] = useState('');
  const [slitherErrors, setSlitherErrors] = useState('');
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const editorRef = useRef<CodeEditorHandle>(null);

  const handleCompile = async (code: string) => {
    const res = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setOutput(data.output);
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;
    setAiError(null);
    setAiDebug(null);
    setAiLoading(true);
    const instruction = chatInput;
    setChatMessages(messages => [
      ...messages,
      { role: 'user', content: instruction }
    ]);
    setChatInput('');
    try {
      const code = editorRef.current?.getCode() || '';
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, instruction }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) {
        setAiDebug(data.debug || null);
        throw new Error(data.error || 'AI did not return modified code.');
      }
      setChatMessages(messages => [
        ...messages,
        { role: 'assistant', content: data.code }
      ]);
      editorRef.current?.setCode(data.code);
    } catch (error: any) {
      setAiError(error.message || 'Failed to contact the AI service.');
      setChatMessages(messages => [
        ...messages,
        { role: 'system', content: 'Error: ' + (error.message || 'Unknown') }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSlitherTest = async (code: string) => {
    setSlitherLoading(true);
    setSlitherOutput('');
    setSlitherErrors('');
    setAnalysisSummary('');
    setAnalysisModalOpen(false);
    try {
      const response = await fetch('/api/slither', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSlitherErrors(data.error || 'Slither analysis failed');
        if (data.hint) {
          setSlitherErrors(`${data.error}\n\nHint: ${data.hint}`);
        }
      } else {
        setSlitherOutput(data.slither_output || '');
        setSlitherErrors(data.slither_errors || '');
      }
    } catch (error: any) {
      setSlitherErrors(`Failed to contact Slither backend: ${error.message}`);
    } finally {
      setSlitherLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!slitherOutput && !slitherErrors) return;
    
    setAnalysisModalOpen(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisSummary('');
    
    try {
      const code = editorRef.current?.getCode() || '';
      const response = await fetch('/api/analyze-slither', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          slitherOutput,
          slitherErrors 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.summary) {
        throw new Error(data.error || 'AI analysis failed');
      }
      
      setAnalysisSummary(data.summary);
    } catch (error: any) {
      setAnalysisError(error.message || 'Failed to analyze with AI');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <main className="h-screen w-full p-4 bg-gray-900 text-white relative">
      <h1 className="text-2xl font-bold mb-4">Secu-IDE</h1>
      <CodeEditor onCompile={handleCompile} ref={editorRef} onTest={handleSlitherTest} />
      <OutputPanel output={output} />
      <SlitherOutput 
        output={slitherOutput} 
        errors={slitherErrors} 
        loading={slitherLoading}
        onAnalyzeWithAI={handleAnalyzeWithAI}
        aiAnalyzing={analysisLoading}
      />
      <AnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        summary={analysisSummary}
        loading={analysisLoading}
        error={analysisError}
      />
      {/* AI Chat Button */}
      {!aiSidebarOpen && (
        <button
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-40 transition"
          onClick={() => setAISidebarOpen(true)}
          aria-label="Open AI Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}
      {/* AI Sidebar Chat */}
      {aiSidebarOpen && (
        <aside className="fixed top-0 right-0 w-96 h-full bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="font-bold text-lg">AI Chat Assistant</span>
            <button onClick={() => setAISidebarOpen(false)} aria-label="Close AI Chat">
              <X size={28} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && !aiLoading && (
              <div className="text-gray-400 text-sm text-center mt-12">No conversation yet. Ask AI to modify your code.</div>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded px-3 py-2 mb-1 whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-blue-700 text-white self-end ml-12' :
                  msg.role === 'assistant' ? 'bg-gray-700 text-green-200 self-start mr-12' :
                  'bg-red-900 text-red-200 self-start mr-12'
                }`}>{msg.content}</div>
            ))}
            {aiLoading && (
              <div className="text-blue-400 text-sm px-3 py-2">AI is generating code...</div>
            )}
            {aiError && (
              <div className="text-red-400 text-xs px-3 py-2">{aiError}
                {aiDebug && (
                  <pre className="bg-gray-900 text-gray-300 text-xs p-2 mt-2 rounded max-h-48 overflow-auto border border-red-700">{JSON.stringify(aiDebug, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
          <form
            className="p-3 border-t border-gray-700 flex gap-2"
            onSubmit={handleAISubmit}
            autoComplete="off"
          >
            <input
              type="text"
              className="flex-1 rounded px-3 py-2 bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring"
              placeholder="Describe what you want to do with your code..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={aiLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition"
              disabled={!chatInput.trim() || aiLoading}
            >
              {aiLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </aside>
      )}
    </main>
  );
};

export default HomePage;
