'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UploadCloud,
  Network,
  HelpCircle,
  AlertTriangle,
  CalendarCheck2,
  BotMessageSquare,
  TrendingUp,
  Settings,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Materials', href: '/dashboard/materials', icon: UploadCloud },
  { name: 'Topic Map', href: '/dashboard/topic-map', icon: Network },
  { name: 'Diagnostic Quiz', href: '/dashboard/quiz', icon: HelpCircle },
  { name: 'Gap Analysis', href: '/dashboard/gap-analysis', icon: AlertTriangle, highlight: true },
  { name: 'Revision Planner', href: '/dashboard/planner', icon: CalendarCheck2 },
  { name: 'AI Tutor', href: '/dashboard/ai-tutor', icon: BotMessageSquare },
  { name: 'Progress Reports', href: '/dashboard/progress', icon: TrendingUp },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">GapFinder</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Find What You Don&apos;t Know</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Diagnostic Suite
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-brand-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.highlight && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                  Core
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Demo Student Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center text-xs">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">Aarav Sharma</p>
            <p className="text-[10px] text-slate-500 truncate">Class 12 CBSE &bull; Demo</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RAG Active
          </span>
          <span className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700 font-medium">
            Seed Mode
          </span>
        </div>
      </div>
    </aside>
  );
}
