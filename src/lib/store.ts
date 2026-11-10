'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocumentMeta,
  Topic,
  Question,
  QuizAttempt,
  TopicGapReport,
  RevisionPlan,
  StudentProfile,
  ChatMessage,
} from '@/types';
import {
  DEMO_STUDENT,
  INITIAL_DOCUMENTS,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
  INITIAL_QUIZ_ATTEMPTS,
  INITIAL_GAP_REPORT,
  INITIAL_REVISION_PLAN,
} from './mockData';
import { analyzeKnowledgeGaps } from './ai/gapAnalyzer';
import { generateAdaptiveRevisionPlan } from './ai/planner';

const STORAGE_KEY_PREFIX = 'gapfinder_ai_state_v1';

export interface AppState {
  profile: StudentProfile;
  documents: DocumentMeta[];
  topics: Topic[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  gapReport: TopicGapReport[];
  revisionPlan: RevisionPlan;
  chatHistory: ChatMessage[];
}

export function useAppState() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(DEMO_STUDENT);
  const [documents, setDocuments] = useState<DocumentMeta[]>(INITIAL_DOCUMENTS);
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(INITIAL_QUIZ_ATTEMPTS);
  const [gapReport, setGapReport] = useState<TopicGapReport[]>(INITIAL_GAP_REPORT);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlan>(INITIAL_REVISION_PLAN);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      content:
        'Hello Aarav! I am your GapFinder AI Tutor. I answer questions and explain concepts using only your uploaded syllabus, textbooks, and past exam papers with precise citations. Which topic or chapter would you like to review?',
      timestamp: '2026-11-09T18:46:00Z',
      isGroundingSufficient: true,
      citations: [
        {
          docName: 'NCERT-Calculus-Comprehensive-Textbook.pdf',
          section: 'Chapter 7: Integrals & Chapter 9: Differential Equations',
          snippet: 'Official curriculum definitions, proofs, and solved board examples.',
        },
      ],
    },
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (saved) {
        const parsed: Partial<AppState> = JSON.parse(saved);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.documents) setDocuments(parsed.documents);
        if (parsed.topics) setTopics(parsed.topics);
        if (parsed.questions) setQuestions(parsed.questions);
        if (parsed.quizAttempts) setQuizAttempts(parsed.quizAttempts);
        if (parsed.gapReport) setGapReport(parsed.gapReport);
        if (parsed.revisionPlan) setRevisionPlan(parsed.revisionPlan);
        if (parsed.chatHistory) setChatHistory(parsed.chatHistory);
      }
    } catch {
      // localStorage fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave: AppState = {
        profile,
        documents,
        topics,
        questions,
        quizAttempts,
        gapReport,
        revisionPlan,
        chatHistory,
      };
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(stateToSave));
    } catch {
      // localStorage error fallback
    }
  }, [
    isLoaded,
    profile,
    documents,
    topics,
    questions,
    quizAttempts,
    gapReport,
    revisionPlan,
    chatHistory,
  ]);

  // Record a completed quiz attempt and auto-regenerate Gap Report & Revision Plan!
  const recordQuizAttempt = useCallback(
    (newAttempt: QuizAttempt) => {
      setQuizAttempts((prevAttempts) => {
        const updatedAttempts = [...prevAttempts, newAttempt];
        
        // Auto-recalculate knowledge gap report
        const updatedGaps = analyzeKnowledgeGaps(updatedAttempts, topics);
        setGapReport(updatedGaps);

        // Auto-regenerate revision plan based on updated gaps!
        const updatedPlan = generateAdaptiveRevisionPlan(
          updatedGaps,
          {
            availableDays: revisionPlan.availableDays,
            hoursPerDay: revisionPlan.hoursPerDay,
            targetExamDate: revisionPlan.targetExamDate,
            userId: profile.id,
          },
          topics
        );
        setRevisionPlan(updatedPlan);

        return updatedAttempts;
      });
    },
    [topics, revisionPlan.availableDays, revisionPlan.hoursPerDay, revisionPlan.targetExamDate, profile.id]
  );

  // Toggle revision task completion
  const toggleRevisionTask = useCallback((taskId: string) => {
    setRevisionPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, []);

  // Reconfigure Revision Plan (days / hours)
  const reconfigureRevisionPlan = useCallback(
    (availableDays: number, hoursPerDay: number, targetExamDate: string) => {
      const updatedPlan = generateAdaptiveRevisionPlan(
        gapReport,
        {
          availableDays,
          hoursPerDay,
          targetExamDate,
          userId: profile.id,
        },
        topics
      );
      setRevisionPlan(updatedPlan);
    },
    [gapReport, profile.id, topics]
  );

  // Add document
  const addDocument = useCallback((doc: DocumentMeta) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  // Remove document
  const removeDocument = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  // Add chat message
  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatHistory((prev) => [...prev, msg]);
  }, []);

  // Reset to sample demo data
  const resetToDemo = useCallback(() => {
    setProfile(DEMO_STUDENT);
    setDocuments(INITIAL_DOCUMENTS);
    setTopics(INITIAL_TOPICS);
    setQuestions(INITIAL_QUESTIONS);
    setQuizAttempts(INITIAL_QUIZ_ATTEMPTS);
    setGapReport(INITIAL_GAP_REPORT);
    setRevisionPlan(INITIAL_REVISION_PLAN);
    localStorage.removeItem(STORAGE_KEY_PREFIX);
  }, []);

  return {
    isLoaded,
    profile,
    setProfile,
    documents,
    addDocument,
    removeDocument,
    topics,
    questions,
    quizAttempts,
    recordQuizAttempt,
    gapReport,
    revisionPlan,
    toggleRevisionTask,
    reconfigureRevisionPlan,
    chatHistory,
    addChatMessage,
    resetToDemo,
  };
}
