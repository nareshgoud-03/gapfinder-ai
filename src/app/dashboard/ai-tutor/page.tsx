'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  RotateCcw,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { ChatMessage, Citation } from '@/types';

function AITutorContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic');

  const { chatHistory, addChatMessage, topics, documents } = useAppState();

  const [inputQuery, setInputQuery] = useState(
    initialTopic ? `Explain ${initialTopic} with formulas and citations` : ''
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic || 'all');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputQuery.trim(),
      timestamp: new Date().toISOString(),
      isGroundingSufficient: true,
    };

    addChatMessage(userMsg);
    const queryToSend = inputQuery.trim();
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          topicFilter:
            selectedTopic === 'all'
              ? undefined
              : topics.find((topic) => topic.id === selectedTopic || topic.name === selectedTopic)?.id,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: data.answer || "I couldn't find sufficient information about this topic in your uploaded materials.",
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
        isGroundingSufficient: data.isGroundingSufficient !== false,
        provider: typeof data.provider === 'string' ? data.provider : undefined,
      };

      addChatMessage(assistantMsg);
    } catch (err) {
      console.error('Tutor fetch error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: "Network error — please check your connection and try again.",
        timestamp: new Date().toISOString(),
        isGroundingSufficient: false,
      };
      addChatMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <Header
        title="AI Tutor – Explain This Topic"
        subtitle="Strict RAG: Answers generated exclusively from your uploaded study materials"
      />

      <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-5xl mx-auto w-full">
        {/* Topic filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 text-xs">
          <span className="font-bold text-slate-500 whitespace-nowrap">Filter Focus:</span>
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedTopic === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Materials
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedTopic === t.id || selectedTopic === t.name
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {chatHistory.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm space-y-3 ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {!isUser && msg.provider && (
                    <p className="text-[10px] text-slate-400">
                      Response source: {msg.provider}
                    </p>
                  )}

                  {/* Citations container */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Source Citations (Grounded Context):</span>
                      </div>
                      <div className="space-y-1">
                        {msg.citations.map((cite, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                          >
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>{cite.docName}</span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-brand-600">{cite.section}</span>
                            </p>
                            <p className="text-slate-500 text-[11px] mt-0.5 italic">
                              &ldquo;{cite.snippet}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!msg.isGroundingSufficient && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>RAG Guardrail: No speculative answers are provided when context is absent.</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 mt-1 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce [animation-delay:0.4s]" />
                <span>Retrieving context and formulating grounded explanation...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your uploaded syllabus, chapters, or past papers..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            🔒 Grounding Guardrail: Answers only from uploaded materials. Never hallucinated.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AITutorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading AI Tutor...</div>}>
      <AITutorContent />
    </Suspense>
  );
}
