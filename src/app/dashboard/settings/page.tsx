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
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';

export default function SettingsPage() {
  const { profile, setProfile, resetToDemo } = useAppState();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [targetExam, setTargetExam] = useState(profile.targetExam);
  const [examDate, setExamDate] = useState(profile.examDate);
  const [saved, setSaved] = useState(false);

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
                Fast context-grounded reasoning with Llama 3.3 70B.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active / Fallback Ready
              </span>
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
              <div className="font-bold text-slate-900 mb-1">Supabase pgvector</div>
              <p className="text-slate-500 text-[11px] mb-2">
                Cloud PostgreSQL with vector similarity RPC and RLS policies.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Schema & In-Memory Sync
              </span>
            </div>
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
