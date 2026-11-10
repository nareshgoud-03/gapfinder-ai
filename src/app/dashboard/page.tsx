'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { formatPercent } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const {
    profile,
    gapReport,
    revisionPlan,
    toggleRevisionTask,
    quizAttempts,
    topics,
  } = useAppState();

  const weakCount = gapReport.filter((g) => g.status === 'weak').length;
  const mediumCount = gapReport.filter((g) => g.status === 'medium').length;
  const strongCount = gapReport.filter((g) => g.status === 'strong').length;

  const totalAttemptedQuestions = quizAttempts.reduce(
    (acc, att) => acc + att.totalQuestions,
    0
  );
  const totalCorrectQuestions = quizAttempts.reduce(
    (acc, att) => acc + att.score,
    0
  );
  const overallMastery =
    totalAttemptedQuestions > 0
      ? Math.round((totalCorrectQuestions / totalAttemptedQuestions) * 100)
      : 0;

  // Data for Recharts
  const chartData = gapReport.map((item) => ({
    name: item.topicName.length > 18 ? item.topicName.slice(0, 18) + '...' : item.topicName,
    fullName: item.topicName,
    accuracy: item.accuracy,
    status: item.status,
  }));

  const pieData = [
    { name: 'Weak (Action Needed)', value: weakCount || 1, color: '#ef4444' },
    { name: 'Medium (Consolidate)', value: mediumCount || 1, color: '#f59e0b' },
    { name: 'Strong (Mastered)', value: strongCount || 1, color: '#10b981' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Welcome back, ${profile.name.split(' ')[0]} 👋`}
        subtitle={`Target: ${profile.targetExam} • Exam Date: ${profile.examDate}`}
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Core Diagnosis Banner */}
        <div className="bg-gradient-to-r from-navy-900 to-brand-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Core Output: Knowledge Gap Diagnosis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              We found {weakCount} critical knowledge gaps in your syllabus.
            </h2>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              GapFinder AI analyzed your past quiz responses and grounded textbook chapters. Rather than revising everything equally, focus first on your high-exam-weight weak topics.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/gap-analysis"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-navy-900 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                <span>View Full Gap Report</span>
                <ArrowRight className="w-4 h-4 text-brand-600" />
              </Link>
              <Link
                href="/dashboard/quiz"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600/60 hover:bg-brand-600 text-white font-medium text-sm transition-colors border border-white/10"
              >
                <span>Take Diagnostic Retest</span>
              </Link>
            </div>
          </div>
          <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none hidden lg:block">
            <Flame className="w-72 h-72 text-white" />
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Overall Mastery */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Mastery
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{formatPercent(overallMastery)}</span>
              <span className="text-xs font-medium text-slate-400">across {totalAttemptedQuestions} questions</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallMastery}%` }}
              />
            </div>
          </div>

          {/* Weak Topics */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm bg-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Weak Topics
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-600">{weakCount}</span>
              <span className="text-xs font-medium text-slate-500">needs treatment</span>
            </div>
            <p className="mt-2 text-xs text-rose-600 font-medium">
              High exam priority &bull; &lt;50% accuracy
            </p>
          </div>

          {/* Medium Topics */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm bg-amber-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Medium Topics
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{mediumCount}</span>
              <span className="text-xs font-medium text-slate-500">partially understood</span>
            </div>
            <p className="mt-2 text-xs text-amber-600 font-medium">
              50% - 75% accuracy
            </p>
          </div>

          {/* Strong Topics */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm bg-emerald-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Strong Topics
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">{strongCount}</span>
              <span className="text-xs font-medium text-slate-500">exam-ready</span>
            </div>
            <p className="mt-2 text-xs text-emerald-600 font-medium">
              &gt;75% accuracy mastery
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topic Performance Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Topic-Level Diagnostic Accuracy</h3>
                <p className="text-xs text-slate-500">Performance diagnosed from grounded quiz attempts</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Weak
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Strong
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg border border-slate-700">
                            <p className="font-semibold">{data.fullName}</p>
                            <p className="mt-1">Accuracy: <span className="font-bold">{data.accuracy}%</span></p>
                            <p className="capitalize">Status: <span className="font-bold">{data.status}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const color =
                        entry.status === 'weak'
                          ? '#ef4444'
                          : entry.status === 'medium'
                          ? '#f59e0b'
                          : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnosis Distribution Pie */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Knowledge Distribution</h3>
              <p className="text-xs text-slate-500">Categorization across analyzed curriculum</p>
            </div>

            <div className="h-48 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Weak Topics
                </span>
                <span className="font-bold text-slate-900">{weakCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Medium Topics
                </span>
                <span className="font-bold text-slate-900">{mediumCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Strong Topics
                </span>
                <span className="font-bold text-slate-900">{strongCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Revision Tasks List (Checklist) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Targeted Revision Checklist (Day-by-Day Treatment Plan)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized automatically: Weak + High exam weight topics are scheduled first.
              </p>
            </div>
            <Link
              href="/dashboard/planner"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Customize Hours / Days</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {revisionPlan.tasks.map((task) => (
              <div
                key={task.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleRevisionTask(task.id)}
                    className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-brand-500 bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Day {task.dayNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          task.status === 'weak'
                            ? 'bg-rose-100 text-rose-700'
                            : task.status === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {task.status.toUpperCase()} GAP
                      </span>
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {task.topicName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {task.learningObjective}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>⏱ {task.durationMinutes} minutes</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-sm text-slate-500">
                        📖 {task.sourceSections[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/dashboard/ai-tutor?topic=${encodeURIComponent(task.topicName)}`}
                    className="px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                  >
                    Ask AI Tutor
                  </Link>
                  <Link
                    href={`/dashboard/quiz?topicId=${task.topicId}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Retest
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
