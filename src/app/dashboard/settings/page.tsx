'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  User,
  Key,
  Database,
  Check,
  LoaderCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { profile, setProfile, resetToDemo } = useAppState();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [targetExam, setTargetExam] = useState(profile.targetExam);
  const [examDate, setExamDate] = useState(profile.examDate);
  const [saved, setSaved] = useState(false);
  const [llmStatus, setLlmStatus] = useState<{
    state: 'idle' | 'checking' | 'connected' | 'not-configured' | 'error';
    message?: string;
    model?: string;
  }>({ state: 'idle' });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name,
      email,
      targetExam,
      examDate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testLlmConnection = async () => {
    setLlmStatus({ state: 'checking' });
    try {
      const response = await fetch('/api/llm/status', { method: 'POST' });
      const result = await response.json();

      if (result.connected) {
        setLlmStatus({
          state: 'connected',
          model: result.model,
          message: result.usedFallback
            ? `Configured model unavailable; using ${result.model} instead.`
            : undefined,
        });
      } else {
        setLlmStatus({
          state: result.configured ? 'error' : 'not-configured',
          message: result.message,
        });
      }
    } catch (error: unknown) {
      console.error('LLM connection check failed:', error);
      setLlmStatus({
        state: 'error',
        message: 'Could not reach the connection check. Verify the app server is running.',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Settings & System Configuration"
        subtitle="Manage student preferences and verify AI RAG pipeline connections"
      />

      <main className="p-8 space-y-8 max-w-4xl">
        {/* Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Student Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Curriculum / Examination
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Save Preferences
              </button>

              {saved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved successfully
                </span>
              )}
            </div>
          </form>
        </div>

        {/* AI & RAG Engine Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">AI & Grounding Pipeline Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">Groq LLM Engine</div>
              <p className="text-slate-500 text-[11px] mb-2">
                Fast context-grounded reasoning with your configured Groq model.
              </p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                llmStatus.state === 'connected'
                  ? 'text-emerald-600'
                  : llmStatus.state === 'checking'
                  ? 'text-brand-600'
                  : llmStatus.state === 'idle'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  llmStatus.state === 'connected'
                    ? 'bg-emerald-500'
                    : llmStatus.state === 'checking'
                    ? 'bg-brand-500'
                    : llmStatus.state === 'idle'
                    ? 'bg-slate-400'
                    : 'bg-amber-500'
                }`} />
                {llmStatus.state === 'connected'
                  ? `Connected (${llmStatus.model})`
                  : llmStatus.state === 'checking'
                  ? 'Checking connection...'
                  : llmStatus.state === 'not-configured'
                  ? 'API key not configured'
                  : llmStatus.state === 'error'
                  ? 'Connection failed'
                  : 'Connection not tested'}
              </span>
              {llmStatus.message && (
                <p role="status" className="text-amber-700 text-[11px] mt-1">
                  {llmStatus.message}
                </p>
              )}
              <button
                type="button"
                onClick={testLlmConnection}
                disabled={llmStatus.state === 'checking'}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
              >
                {llmStatus.state === 'checking' && <LoaderCircle className="h-3 w-3 animate-spin" />}
                {llmStatus.state === 'checking' ? 'Testing...' : 'Test connection'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">Dense Embeddings</div>
              <p className="text-slate-500 text-[11px] mb-2">
                384-dimensional cosine vector space for semantic search.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active (all-MiniLM-L6-v2)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">Supabase pgvector & SQL</div>
              <p className="text-slate-500 text-[11px] mb-2">
                Cloud PostgreSQL with vector similarity RPC and RLS policies.
              </p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isSupabaseConfigured ? 'Connected to Cloud Supabase' : 'Offline / Memory Sync Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Free SQL Setup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Supabase Free Database & SQL Setup (Free Tier)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Supabase provides 100% free PostgreSQL databases with pgvector and user authentication. If you want to connect your live Supabase cloud database:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700 font-mono">
            <p>1. Create a free project at: <strong>https://supabase.com</strong></p>
            <p>2. In your Supabase dashboard, click <strong>SQL Editor</strong> ➔ paste the contents of <strong>schema.sql</strong> (located in project root) ➔ Click <strong>Run</strong>.</p>
            <p>3. In <strong>Project Settings ➔ API</strong>, copy your <strong>URL</strong> and <strong>anon public key</strong> into your <strong>.env.local</strong> file:</p>
            <pre className="p-2.5 rounded bg-slate-900 text-emerald-400 overflow-x-auto text-[11px]">
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
            </pre>
          </div>
        </div>

        {/* Demo Data Reset Card */}
        <div className="bg-rose-50/40 rounded-2xl border border-rose-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Evaluators Demo Reset</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Restores the default Class 12 Calculus syllabus, mock textbook, past papers, and diagnostic history.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset all local data back to the clean hackathon demo baseline?')) {
                resetToDemo();
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </main>
    </div>
  );
}
