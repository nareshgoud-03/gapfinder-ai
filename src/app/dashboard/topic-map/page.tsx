'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Network,
  BookOpen,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  Award,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';

export default function TopicMapPage() {
  const { topics, gapReport } = useAppState();

  // Group topics by chapter
  const chapters = topics.reduce((acc, topic) => {
    if (!acc[topic.chapter]) {
      acc[topic.chapter] = [];
    }
    acc[topic.chapter].push(topic);
    return acc;
  }, {} as Record<string, typeof topics>);

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(
    Object.keys(chapters).reduce((acc, ch) => ({ ...acc, [ch]: true }), {})
  );

  const toggleChapter = (ch: string) => {
    setExpandedChapters((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Curriculum Topic Map"
        subtitle="Hierarchical structure extracted from syllabus linked with past examination frequency"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Topic Map Insights Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mathematics Syllabus & Past Paper Alignment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {topics.length} topics mapped across {Object.keys(chapters).length} main curriculum chapters with cross-referenced board questions.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/quiz"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Across All Topics</span>
          </Link>
        </div>

        {/* Chapters and Topics Tree */}
        {topics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <Network className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No Curriculum Topics Available</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t uploaded any syllabus or textbook files yet. Upload materials to automatically construct your topic hierarchy.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/materials"
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
              >
                Upload Syllabus or Notes
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(chapters).map(([chapterTitle, chapterTopics]) => {
            const isExpanded = expandedChapters[chapterTitle] !== false;

            return (
              <div
                key={chapterTitle}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapterTitle)}
                  className="w-full px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-slate-900 text-sm">{chapterTitle}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {chapterTopics.length} Topics
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Topics in Chapter */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 p-2">
                    {chapterTopics.map((topic) => {
                      const topicDiagnosis = gapReport.find((g) => g.topicId === topic.id);

                      return (
                        <div
                          key={topic.id}
                          className="p-5 rounded-xl hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {topic.name}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  topic.examWeight === 'High'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {topic.examWeight} Exam Weight
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                <Award className="w-3 h-3 text-amber-500" />
                                <span>{topic.pastExamFrequency} past paper appearances</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                              {topic.description}
                            </p>

                            {/* Subtopics pills */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[11px] font-semibold text-slate-400">
                                Subtopics:
                              </span>
                              {topic.subtopics.map((sub, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>

                            <div className="text-[11px] text-brand-700 flex items-center gap-1 pt-0.5">
                              <BookOpen className="w-3 h-3" />
                              <span>Citation: {topic.sourceCitation}</span>
                            </div>
                          </div>

                          {/* Action & Status */}
                          <div className="flex items-center gap-4 shrink-0 lg:border-l lg:border-slate-100 lg:pl-6">
                            {topicDiagnosis && (
                              <div className="text-right">
                                <div className="text-xs font-semibold text-slate-400">Diagnosis</div>
                                <div
                                  className={`text-sm font-bold capitalize ${
                                    topicDiagnosis.status === 'weak'
                                      ? 'text-rose-600'
                                      : topicDiagnosis.status === 'medium'
                                      ? 'text-amber-600'
                                      : 'text-emerald-600'
                                  }`}
                                >
                                  {topicDiagnosis.status} ({topicDiagnosis.accuracy}%)
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/ai-tutor?topic=${encodeURIComponent(topic.name)}`}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Explain
                              </Link>
                              <Link
                                href={`/dashboard/quiz?topicId=${topic.id}`}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                              >
                                Test
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}
