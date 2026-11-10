'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  TrendingDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { TopicGapStatus } from '@/types';

export default function GapAnalysisPage() {
  const { gapReport, quizAttempts } = useAppState();
  const [filter, setFilter] = useState<'all' | TopicGapStatus>('all');

  const weakList = gapReport.filter((g) => g.status === 'weak');
  const mediumList = gapReport.filter((g) => g.status === 'medium');
  const strongList = gapReport.filter((g) => g.status === 'strong');

  const filteredItems =
    filter === 'all'
      ? gapReport
      : gapReport.filter((g) => g.status === filter);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Knowledge Gap Diagnosis"
        subtitle="The Core Output: Find what you don't know before the exam does"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Core RAG Diagnostic Methodology Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Transparent Gap Analysis Methodology
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-4xl">
                Unlike general chat assistants that wait for student questions, GapFinder AI uses an objective diagnostic rubric. Questions are generated directly from your uploaded textbook and syllabus chunks. Every answer choice is recorded and evaluated against ground truth citations.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-800">Weak Gap (&lt; 50% accuracy):</span>
                    <p className="text-rose-700 text-[11px] mt-0.5">
                      Fundamental conceptual breakdown. High exam impact. Scheduled as Priority 1 in your revision plan.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-800">Medium Gap (50% - 75%):</span>
                    <p className="text-amber-700 text-[11px] mt-0.5">
                      Understands definitions, but struggles with multi-nested steps or boundary conditions.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-800">Strong Mastery (&gt; 75%):</span>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      Exam-ready. Core principles validated by grounded citation benchmarks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Topics ({gapReport.length})
            </button>
            <button
              onClick={() => setFilter('weak')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filter === 'weak'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Weak Gaps ({weakList.length})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filter === 'medium'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium Gaps ({mediumList.length})
            </button>
            <button
              onClick={() => setFilter('strong')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filter === 'strong'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Strong ({strongList.length})
            </button>
          </div>

          <Link
            href="/dashboard/quiz"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Take Diagnostic Quiz to Update Gaps</span>
          </Link>
        </div>

        {/* Diagnosis Cards */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isWeak = item.status === 'weak';
            const isMedium = item.status === 'medium';

            return (
              <div
                key={item.topicId}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${
                  isWeak
                    ? 'border-rose-200 bg-rose-50/10'
                    : isMedium
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white ${
                        isWeak
                          ? 'bg-rose-600'
                          : isMedium
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {isWeak ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isMedium ? (
                        <HelpCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isWeak
                              ? 'bg-rose-100 text-rose-700'
                              : isMedium
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status.toUpperCase()} DIAGNOSIS
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.examWeight} Exam Weight
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.chapter}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {item.topicName}
                      </h3>
                    </div>
                  </div>

                  {/* Accuracy Badge */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span
                          className={`text-2xl font-black ${
                            isWeak
                              ? 'text-rose-600'
                              : isMedium
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.accuracy}%
                        </span>
                        <span className="text-xs text-slate-400 font-medium">accuracy</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.correctCount} correct / {item.questionsAttempted} attempted
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/ai-tutor?topic=${encodeURIComponent(item.topicName)}`}
                        className="px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Explain with RAG</span>
                      </Link>
                      <Link
                        href={`/dashboard/quiz?topicId=${item.topicId}`}
                        className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        Retest Topic
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Reason & Prescription */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                      🔍 Diagnostic Reason (What the student missed):
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {item.diagnosisReason}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-bold text-brand-700 uppercase tracking-wider text-[10px] block mb-1">
                      💊 Recommended Treatment (Revision Prescription):
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {item.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Grounded Citation Footer */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-500">
                    <span>📖 Grounded Citation:</span>
                    <span className="text-brand-700">{item.citationRef}</span>
                  </span>
                  <span className="hidden sm:inline text-slate-400">
                    Auto-updates upon each quiz completion
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
