'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { Question, QuizAttempt, StudentAnswerRecord } from '@/types';

function DiagnosticQuizContent() {
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get('topicId');

  const { questions, topics, recordQuizAttempt, quizAttempts } = useAppState();

  const [quizLength, setQuizLength] = useState<number>(5);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || 'all');
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<number, boolean>>({});
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Initialize questions pool
  const startQuiz = useCallback((length: number = quizLength, topicId: string = selectedTopicId) => {
    let pool = [...questions];
    if (topicId && topicId !== 'all') {
      pool = pool.filter((q) => q.topicId === topicId);
    }
    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, length);

    setActiveQuizQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealedExplanations({});
    setIsQuizStarted(true);
    setIsQuizCompleted(false);
    setCompletedAttempt(null);
  }, [quizLength, selectedTopicId, questions]);

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
      startQuiz(5, initialTopicId);
    }
  }, [initialTopicId, startQuiz]);

  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
    setRevealedExplanations((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const currentQuestion = activeQuizQuestions[currentIndex];

  const handleFinishQuiz = () => {
    // Tally results
    const answersRecord: StudentAnswerRecord[] = activeQuizQuestions.map((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      const isCorrect = selected === q.correctAnswer;
      return {
        questionId: q.id,
        questionText: q.questionText,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        topicId: q.topicId,
        topicName: q.topicName,
        explanation: q.explanation,
        sourceCitation: q.sourceCitation,
      };
    });

    const correctCount = answersRecord.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / activeQuizQuestions.length) * 100);

    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      userId: 'student-demo-2026',
      attemptNumber: quizAttempts.length + 1,
      quizMode: quizLength === 5 ? 'quick_5' : quizLength === 10 ? 'standard_10' : 'deep_20',
      topicId: selectedTopicId !== 'all' ? selectedTopicId : undefined,
      score: correctCount,
      totalQuestions: activeQuizQuestions.length,
      accuracy,
      startedAt: new Date(Date.now() - 300000).toISOString(),
      completedAt: new Date().toISOString(),
      answers: answersRecord,
    };

    // Save and auto-trigger Gap Analysis update!
    recordQuizAttempt(newAttempt);
    setCompletedAttempt(newAttempt);
    setIsQuizCompleted(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Diagnostic Quiz"
        subtitle="Context-Grounded Testing: Every question references an exact textbook section"
      />

      <main className="p-8 max-w-4xl mx-auto w-full">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Diagnostic Questions Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All previous study files have been removed or no documents have been uploaded yet. Upload your syllabus or notes to generate fresh, grounded questions for your new curriculum.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/materials"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
              >
                Upload Study Materials
              </Link>
            </div>
          </div>
        ) : !isQuizStarted ? (
          /* Quiz Setup Screen */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Start a Diagnostic Evaluation</h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Questions are generated directly from your uploaded syllabus and textbooks. Results immediately recalculate your knowledge gaps and update your personalized revision plan.
              </p>
            </div>

            {/* Config: Topic Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Scope:
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">Comprehensive Syllabus (All Topics)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.examWeight} Exam Weight)
                  </option>
                ))}
              </select>
            </div>

            {/* Config: Number of questions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Number of Questions:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuizLength(num)}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                      quizLength === num
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => startQuiz(quizLength, selectedTopicId)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Generate Diagnostic Questions</span>
            </button>
          </div>
        ) : isQuizCompleted && completedAttempt ? (
          /* Completion Modal / Screen */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quiz Completed!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your performance has been analyzed and logged to your profile.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-sm mx-auto">
              <div className="text-4xl font-black text-slate-900">
                {completedAttempt.accuracy}%
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {completedAttempt.score} of {completedAttempt.totalQuestions} questions correct
              </p>
            </div>

            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-900 text-left">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Knowledge Gaps & Revision Plan Updated!</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                The GapFinder diagnosis engine has reclassified your topic masteries and reprioritized your daily revision checklist based on what you got right and wrong.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/gap-analysis"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                View Updated Gap Report
              </Link>
              <Link
                href="/dashboard/planner"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Inspect Revision Schedule
              </Link>
              <button
                onClick={() => {
                  setIsQuizStarted(false);
                  setIsQuizCompleted(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Retake Another Quiz
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Screen */
          currentQuestion && (
            <div className="space-y-6">
              {/* Progress & Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-900">
                  Question {currentIndex + 1} of {activeQuizQuestions.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700">
                  {currentQuestion.topicName}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Citation: {currentQuestion.sourceCitation}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === optIdx;
                    const isRevealed = revealedExplanations[currentIndex];
                    const isCorrect = currentQuestion.correctAnswer === optIdx;

                    let optionStyle =
                      'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100';

                    if (isRevealed) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-semibold';
                      } else {
                        optionStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isRevealed}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3.5 ${optionStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {isRevealed && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Real-Time Grounded Explanation */}
                {revealedExplanations[currentIndex] && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      <span>Diagnostic Explanation:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Retrieved from: {currentQuestion.sourceCitation}</span>
                    </div>
                  </div>
                )}

                {/* Navigation actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                  >
                    Previous Question
                  </button>

                  {currentIndex < activeQuizQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishQuiz}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span>Finish & Recalculate Gaps</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function DiagnosticQuizPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading diagnostic quiz...</div>}>
      <DiagnosticQuizContent />
    </Suspense>
  );
}
