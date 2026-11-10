import {
  RevisionPlan,
  RevisionTask,
  TopicGapReport,
  Topic,
} from '@/types';
import { INITIAL_TOPICS } from '@/lib/mockData';

export interface PlanConfig {
  availableDays: number;
  hoursPerDay: number;
  targetExamDate?: string;
  userId?: string;
}

/**
 * Generates an adaptive revision plan prioritized by knowledge gaps and exam weight.
 * If no gap reports exist yet (e.g. before taking a quiz), it builds a foundational
 * schedule across all curriculum topics so the student has an actionable roadmap from day 1!
 */
export function generateAdaptiveRevisionPlan(
  gapReports: TopicGapReport[],
  config: PlanConfig,
  topics: Topic[] = INITIAL_TOPICS
): RevisionPlan {
  const {
    availableDays = 5,
    hoursPerDay = 2,
    targetExamDate = '2026-03-15',
    userId = 'student-demo-2026',
  } = config;

  const totalStudyMinutes = availableDays * hoursPerDay * 60;
  const minutesPerDay = hoursPerDay * 60;

  // Build topics list to schedule
  type SchedulableItem = {
    topicId: string;
    topicName: string;
    chapter: string;
    status: 'weak' | 'medium' | 'strong';
    examWeight: 'High' | 'Medium' | 'Low';
    diagnosisReason: string;
    recommendedAction: string;
    citationRef: string;
  };

  let itemsToSchedule: SchedulableItem[] = [];

  if (gapReports && gapReports.length > 0) {
    // We have diagnosed gaps from quiz results
    itemsToSchedule = gapReports.map((g) => ({
      topicId: g.topicId,
      topicName: g.topicName,
      chapter: g.chapter,
      status: g.status,
      examWeight: g.examWeight,
      diagnosisReason: g.diagnosisReason,
      recommendedAction: g.recommendedAction,
      citationRef: g.citationRef,
    }));
  } else if (topics && topics.length > 0) {
    // No quiz attempts yet: create an initial roadmap from available curriculum topics!
    itemsToSchedule = topics.map((t) => ({
      topicId: t.id,
      topicName: t.name,
      chapter: t.chapter,
      status: 'medium' as const,
      examWeight: t.examWeight,
      diagnosisReason: 'Curriculum topic pending diagnostic quiz evaluation.',
      recommendedAction: `Read ${t.sourceCitation} and take a diagnostic quiz to identify specific gaps.`,
      citationRef: t.sourceCitation,
    }));
  }

  // Sort by priority: Weak + High Exam Weight -> Medium -> Strong
  itemsToSchedule.sort((a, b) => {
    const statusScore = { weak: 3, medium: 2, strong: 1 };
    const weightScore = { High: 3, Medium: 2, Low: 1 };

    const scoreA = statusScore[a.status] * 10 + weightScore[a.examWeight];
    const scoreB = statusScore[b.status] * 10 + weightScore[b.examWeight];

    return scoreB - scoreA;
  });

  const tasks: RevisionTask[] = [];
  let currentDay = 1;
  let dayMinutesAllocated = 0;

  for (let i = 0; i < itemsToSchedule.length; i++) {
    const item = itemsToSchedule[i];
    const fullTopic = topics.find((t) => t.id === item.topicId);

    // Duration based on severity
    let duration = 60;
    if (item.status === 'weak') {
      duration = Math.min(120, minutesPerDay);
    } else if (item.status === 'medium') {
      duration = Math.min(90, minutesPerDay);
    } else {
      duration = Math.min(45, minutesPerDay);
    }

    // Check if we need to advance to next day
    if (dayMinutesAllocated + duration > minutesPerDay && dayMinutesAllocated > 0) {
      if (currentDay < availableDays) {
        currentDay++;
        dayMinutesAllocated = 0;
      }
    }

    if (currentDay > availableDays) break;

    const task: RevisionTask = {
      id: `task-${item.topicId}-${Date.now()}-${i}`,
      dayNumber: currentDay,
      topicId: item.topicId,
      topicName: item.topicName,
      chapter: item.chapter,
      status: item.status,
      priority: item.status === 'weak' ? 'High' : item.status === 'medium' ? 'Medium' : 'Low',
      durationMinutes: duration,
      learningObjective:
        item.status === 'weak'
          ? `Overcome critical conceptual gaps: ${item.diagnosisReason}`
          : item.status === 'medium'
          ? `Consolidate exam speed and precision on: ${item.topicName}`
          : `Quick refresher on proven strong topic: ${item.topicName}`,
      sourceSections: [
        item.citationRef,
        fullTopic && fullTopic.subtopics.length > 0
          ? `Key Subtopics: ${fullTopic.subtopics.join(', ')}`
          : 'Core Curriculum Reference',
      ],
      practiceItems: [
        item.recommendedAction,
        `Complete 3-5 focused questions from past papers (${item.examWeight} Exam Frequency)`,
        `Take a diagnostic quiz on ${item.topicName}`,
      ],
      completed: false,
    };

    tasks.push(task);
    dayMinutesAllocated += duration;
  }

  return {
    id: `plan-${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    availableDays,
    hoursPerDay,
    targetExamDate,
    totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
    tasks,
  };
}
