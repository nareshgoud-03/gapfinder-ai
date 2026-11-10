'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, RotateCcw, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAppState } from '@/lib/store';

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { resetToDemo } = useAppState();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Transparent RAG badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Grounded Retrieval</span>
        </div>

        {/* Reset Demo State Button */}
        <button
          onClick={() => {
            if (confirm('Reset state to clean evaluators demo data?')) {
              resetToDemo();
              window.location.reload();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
          title="Reset to sample demo data"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Demo Data</span>
        </button>

        {/* Quick Quiz action */}
        <Link
          href="/dashboard/quiz"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Take Quiz</span>
        </Link>
      </div>
    </header>
  );
}
