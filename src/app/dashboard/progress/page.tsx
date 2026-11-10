'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function ProgressDashboardPage() {
  const { quizAttempts, gapReport } = useAppState();

  const weakCount = gapReport.filter((g) => g.status === 'weak').length;
  const mediumCount = gapReport.filter((g) => g.status === 'medium').length;
  const strongCount = gapReport.filter((g) => g.status === 'strong').length;

  // History timeline data
  const historyData = quizAttempts.map((att, idx) => ({
    name: `Attempt ${idx + 1}`,
    accuracy: att.accuracy,
    score: att.score,
    total: att.totalQuestions,
    date: formatDate(att.completedAt),
  }));

  const pieData = [
    { name: 'Weak', value: weakCount || 1, color: '#ef4444' },
    { name: 'Medium', value: mediumCount || 1, color: '#f59e0b' },
    { name: 'Strong', value: strongCount || 1, color: '#10b981' },
  ];

  const topicAccuracyData = gapReport.map((t) => ({
    topic: t.topicName.length > 20 ? t.topicName.slice(0, 20) + '...' : t.topicName,
    accuracy: t.accuracy,
    status: t.status,
  }));

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Student Learning Progression"
        subtitle="Attempt-over-attempt score evolution and verified knowledge gap remediation"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Progression Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Accuracy Improvement Trend</h3>
              <p className="text-xs text-slate-500">Measurable score growth across sequential quiz attempts</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Positive Progression Tracked</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p>Score: {data.score} / {data.total}</p>
                          <p>Accuracy: <span className="font-bold text-brand-400">{data.accuracy}%</span></p>
                          <p className="text-slate-400 text-[10px]">{data.date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Column charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic-wise comparison */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Topic-Wise Accuracy</h3>
            <p className="text-xs text-slate-500 mb-4">Current mastery level across syllabus modules</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicAccuracyData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="topic" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                    {topicAccuracyData.map((entry, index) => {
                      const color =
                        entry.status === 'weak'
                          ? '#ef4444'
                          : entry.status === 'medium'
                          ? '#f59e0b'
                          : '#10b981';
                      return <Cell key={`bar-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attempts Log Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Diagnostic Attempt History</h3>
              <p className="text-xs text-slate-500 mb-4">Complete log of student evaluations</p>

              <div className="divide-y divide-slate-100 text-xs">
                {quizAttempts.map((att, idx) => (
                  <div key={att.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        Attempt #{idx + 1} &bull; {att.quizMode.replace('_', ' ')}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {formatDate(att.completedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        {att.accuracy}%
                      </span>
                      <p className="text-slate-400 text-[10px]">
                        {att.score}/{att.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/dashboard/quiz"
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Take Another Diagnostic Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
