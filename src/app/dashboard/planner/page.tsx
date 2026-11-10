'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';

export default function RevisionPlannerPage() {
  const { revisionPlan, toggleRevisionTask, reconfigureRevisionPlan, gapReport } = useAppState();

  const [days, setDays] = useState(revisionPlan.availableDays || 5);
  const [hours, setHours] = useState(revisionPlan.hoursPerDay || 2);
  const [examDate, setExamDate] = useState(revisionPlan.targetExamDate || '2026-03-15');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Auto-generate roadmap if tasks are empty
  useEffect(() => {
    if (!revisionPlan.tasks || revisionPlan.tasks.length === 0) {
      reconfigureRevisionPlan(days, hours, examDate);
    }
  }, [revisionPlan.tasks, days, hours, examDate, reconfigureRevisionPlan]);

  const handleApplyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    reconfigureRevisionPlan(days, hours, examDate);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const completedCount = revisionPlan.tasks.filter((t) => t.completed).length;
  const progressPercent =
    revisionPlan.tasks.length > 0
      ? Math.round((completedCount / revisionPlan.tasks.length) * 100)
      : 0;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Personalized Revision Planner"
        subtitle="Adaptive Treatment Schedule: Weakest and most exam-important topics come first"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Planner Configuration Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Study Time Constraints & Exam Target</h3>
          </div>

          <form onSubmit={handleApplyConfig} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Available Days:
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Hours Per Day:
              </label>
              <input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Exam Date:
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recalculate Schedule</span>
              </button>
            </div>
          </form>

          {isSavedNotice && (
            <p className="mt-3 text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Schedule re-optimized for {days} days ({days * hours} total study hours).
            </p>
          )}
        </div>

        {/* Schedule Progress Overview */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand-300 font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Total Plan Budget: {revisionPlan.totalStudyHours} Study Hours</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              {completedCount} of {revisionPlan.tasks.length} Revision Modules Finished
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Tasks are prioritized strictly by weakness and board exam frequency. Once you finish a module, take another diagnostic quiz to verify your score improvement.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-8">
            <div className="text-3xl font-black text-brand-400">{progressPercent}%</div>
            <p className="text-xs text-slate-400">Plan Completion</p>
          </div>
        </div>

        {/* Daily Modules Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Ordered Revision Schedule</h3>
            <span className="text-xs text-slate-500">
              Adapts dynamically when new quiz answers are recorded
            </span>
          </div>

          <div className="space-y-4">
            {revisionPlan.tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
                <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Revision Schedule Available</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Take a diagnostic quiz so GapFinder AI can identify your weak areas, or click &ldquo;Recalculate Schedule&rdquo; above to generate a roadmap across your curriculum topics.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/dashboard/quiz"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    Take Diagnostic Quiz
                  </Link>
                </div>
              </div>
            ) : (
              revisionPlan.tasks.map((task) => {
                const isWeak = task.status === 'weak';
                const isMedium = task.status === 'medium';

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                      task.completed
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                        : isWeak
                        ? 'border-rose-200 bg-rose-50/10'
                        : isMedium
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleRevisionTask(task.id)}
                          className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center border transition-all ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-brand-500 bg-white'
                          }`}
                          title="Toggle task completion"
                        >
                          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                              Day {task.dayNumber}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                isWeak
                                  ? 'bg-rose-100 text-rose-700'
                                  : isMedium
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {task.status.toUpperCase()} GAP &bull; {task.priority} Priority
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              ⏱ {task.durationMinutes} min allocation
                            </span>
                          </div>

                          <h4
                            className={`text-base font-bold ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.topicName}
                          </h4>
                          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                            🎯 <span className="font-semibold text-slate-800">Learning Goal:</span> {task.learningObjective}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <Link
                          href={`/dashboard/ai-tutor?topic=${encodeURIComponent(task.topicName)}`}
                          className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                        >
                          Ask AI Tutor
                        </Link>
                        <Link
                          href={`/dashboard/quiz?topicId=${task.topicId}`}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Retest Topic
                        </Link>
                      </div>
                    </div>

                    {/* Grounded Source Sections & Practice Steps */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 text-[11px] block mb-1">
                          📖 Targeted Source Sections to Review:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {task.sourceSections.map((sec, i) => (
                            <li key={i} className="truncate">
                              {sec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 text-[11px] block mb-1">
                          ✏️ Prescribed Practice Tasks:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {task.practiceItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
