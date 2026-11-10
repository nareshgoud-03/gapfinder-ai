import {
  QuizAttempt,
  Topic,
  TopicGapReport,
  TopicGapStatus,
} from '@/types';
import { INITIAL_TOPICS } from '@/lib/mockData';

/**
 * Computes deep diagnostic gap analysis across all completed quiz attempts.
 */
export function analyzeKnowledgeGaps(
  attempts: QuizAttempt[],
  topics: Topic[] = INITIAL_TOPICS
): TopicGapReport[] {
  if (attempts.length === 0) {
    return [];
  }

  // Aggregate student answers by topic
  const topicStats: Record<
    string,
    {
      topicId: string;
      topicName: string;
      chapter: string;
      correctCount: number;
      incorrectCount: number;
      wrongAnswers: { questionText: string; explanation: string; sourceCitation: string }[];
    }
  > = {};

  for (const attempt of attempts) {
    for (const ans of attempt.answers) {
      if (!topicStats[ans.topicId]) {
        topicStats[ans.topicId] = {
          topicId: ans.topicId,
          topicName: ans.topicName,
          chapter: '',
          correctCount: 0,
          incorrectCount: 0,
          wrongAnswers: [],
        };
      }

      if (ans.isCorrect) {
        topicStats[ans.topicId].correctCount++;
      } else {
        topicStats[ans.topicId].incorrectCount++;
        topicStats[ans.topicId].wrongAnswers.push({
          questionText: ans.questionText,
          explanation: ans.explanation,
          sourceCitation: ans.sourceCitation,
        });
      }
    }
  }

  const reports: TopicGapReport[] = [];

  for (const topic of topics) {
    const stat = topicStats[topic.id];

    if (!stat || stat.correctCount + stat.incorrectCount === 0) {
      // Unattempted topic
      continue;
    }

    const total = stat.correctCount + stat.incorrectCount;
    const accuracy = Math.round((stat.correctCount / total) * 100);

    let status: TopicGapStatus = 'medium';
    if (accuracy < 50) {
      status = 'weak';
    } else if (accuracy >= 75) {
      status = 'strong';
    }

    // Synthesize transparent diagnostic reason
    let diagnosisReason = '';
    let recommendedAction = '';

    if (status === 'weak') {
      const issues = stat.wrongAnswers.map(w => w.explanation).join('; ');
      diagnosisReason = `Missed ${stat.incorrectCount} of ${total} questions. Conceptual breakdown observed: ${issues || 'Struggling with fundamental definitions and application formulas.'}`;
      recommendedAction = `Prioritize immediate revision of ${topic.sourceCitation}. Complete 5 foundational practice problems before taking another diagnostic quiz.`;
    } else if (status === 'medium') {
      diagnosisReason = `Partially understood (${accuracy}% accuracy, ${stat.incorrectCount} missed). Basic concepts are in place, but multi-step applications and boundary conditions caused errors.`;
      recommendedAction = `Review past exam questions for ${topic.name}. Focus on edge cases and standard formula shortcuts.`;
    } else {
      diagnosisReason = `Strong mastery demonstrated (${accuracy}% accuracy over ${total} questions). Core principles and algebraic manipulations are executed accurately.`;
      recommendedAction = `Exam-ready. Retain sharpness with weekly spaced repetition.`;
    }

    reports.push({
      topicId: topic.id,
      topicName: topic.name,
      chapter: topic.chapter,
      accuracy,
      questionsAttempted: total,
      correctCount: stat.correctCount,
      incorrectCount: stat.incorrectCount,
      status,
      examWeight: topic.examWeight,
      diagnosisReason,
      recommendedAction,
      citationRef: topic.sourceCitation,
    });
  }

  // Sort by priority: Weak first (High exam weight first), then Medium, then Strong
  const statusRank: Record<TopicGapStatus, number> = { weak: 0, medium: 1, strong: 2 };
  const weightRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

  reports.sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    if (weightRank[a.examWeight] !== weightRank[b.examWeight]) {
      return weightRank[a.examWeight] - weightRank[b.examWeight];
    }
    return a.accuracy - b.accuracy;
  });

  return reports;
}
