'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck2,
  BotMessageSquare,
  Network,
  UploadCloud,
  FileCheck,
  HelpCircle,
  TrendingUp,
  Flame,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-xl">GapFinder</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
            >
              Explore Live Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>iGebra.ai AI Intern Hackathon 2026 Solution</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] text-balance">
            Discover What You Don&apos;t Know. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Master What Matters.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed text-balance">
            Most study apps wait for the student to ask a question. But a student can&apos;t ask about a gap they don&apos;t know they have. GapFinder AI works like a doctor: tests you on your syllabus, isolates your exact weak topics, and builds a prioritized revision plan.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Launch Demo Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm shadow-sm transition-all"
            >
              Demo Credentials & Login
            </Link>
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Grounded in Student Materials
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Strict Source Citations
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Dynamic Self-Updating Plans
            </span>
          </div>
        </div>
      </section>

      {/* The Core Loop Section (Upload -> Test -> Find weak spots -> Plan -> Re-test) */}
      <section className="bg-white py-20 border-y border-slate-200/80 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              The Diagnostic Loop
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              A Diagnosis, Not Just Answers
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              A chatbot alone isn&apos;t enough. GapFinder AI runs a closed-loop diagnostic workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: '01',
                title: 'Upload Materials',
                desc: 'Upload syllabus, textbook chapters, notes & past board exam papers.',
                icon: UploadCloud,
              },
              {
                step: '02',
                title: 'Diagnostic Quiz',
                desc: 'Take questions generated strictly from your uploaded textbook sections.',
                icon: HelpCircle,
              },
              {
                step: '03',
                title: 'Find Weak Spots',
                desc: 'Sorts topics into Weak (🔴), Medium (🟡), and Strong (🟢) with specific reasons.',
                icon: AlertTriangle,
                highlight: true,
              },
              {
                step: '04',
                title: 'Personalized Plan',
                desc: 'Weak + high exam weight topics scheduled first to fit your study hours.',
                icon: CalendarCheck2,
              },
              {
                step: '05',
                title: 'Re-test & Update',
                desc: 'Retake tests as you improve; the revision plan automatically updates itself.',
                icon: TrendingUp,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    item.highlight
                      ? 'bg-brand-50/50 border-brand-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-slate-400">{item.step}</span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        item.highlight
                          ? 'bg-brand-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RAG Explainer: Separation of Retrieval & Generation */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mandatory AI Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Strict RAG Pipeline: No Hallucinations
            </h2>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Before the AI answers or generates a question, it retrieves the relevant chunk from the student&apos;s uploaded documents. LLM generation is strictly grounded in retrieved passages, preserving citations to chapter, section, and page.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-brand-400 block mb-1">1. Semantic Retrieval</span>
              <p className="text-slate-300 leading-relaxed">
                Documents are chunked into 600-char passages with sliding overlaps. 384-dimensional dense embeddings index concepts for cosine similarity matching.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-brand-400 block mb-1">2. Grounded Generation</span>
              <p className="text-slate-300 leading-relaxed">
                Groq Llama 3.3 70B receives only the top retrieved passages as context. It generates diagnostic questions and explanations exclusively from this text.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-brand-400 block mb-1">3. Verifiable Citations</span>
              <p className="text-slate-300 leading-relaxed">
                Every quiz question, diagnostic explanation, and AI Tutor answer includes clickable citations (e.g., &ldquo;NCERT Vol 2, Sec 7.6, p. 320&rdquo;).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          GapFinder AI &bull; Built for the iGebra.ai AI Intern Hackathon 2026
        </p>
        <p className="mt-1 text-slate-400">
          &ldquo;Find What the Student Doesn&apos;t Know&rdquo; &bull; Powered by Next.js, TypeScript, Tailwind CSS, Groq & RAG
        </p>
      </footer>
    </div>
  );
}
