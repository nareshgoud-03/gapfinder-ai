'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { authenticateStudent } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setProfile } = useAppState();

  const [email, setEmail] = useState('student.demo@gapfinder.ai');
  const [password, setPassword] = useState('demo2026');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    const result = await authenticateStudent(email, password);
    if (result.success && result.user) {
      setProfile(result.user);
      router.push('/dashboard');
    } else {
      setAuthError(result.error || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('student.demo@gapfinder.ai');
    setPassword('demo2026');
    setIsLoading(true);
    const result = await authenticateStudent('student.demo@gapfinder.ai', 'demo2026');
    if (result.user) {
      setProfile(result.user);
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-2xl">GapFinder AI</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign In to Your Diagnostic Suite
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Review your diagnosed knowledge gaps and adaptive revision schedule
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {/* Quick Demo Login Option for Judges/Evaluators */}
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-900 mb-1">
              <UserCheck className="w-4 h-4 text-brand-600" />
              <span>Hackathon Evaluator Credentials:</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
              <p>Email: <strong className="text-slate-900">student.demo@gapfinder.ai</strong></p>
              <p>Password: <strong className="text-slate-900">demo2026</strong></p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="mt-3 w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Login as Demo Student</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or use standard login</span>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            <span>Don&apos;t have an account yet? </span>
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
