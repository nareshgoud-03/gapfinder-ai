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

  // Build sorted priority queue of topics
  // 1. Weak + High Weight
  // 2. Weak + Medium Weight
  // 3. Medium + High Weight
  // 4. Medium + Medium Weight
  // 5. Strong (refreshers)
  const sortedReports = [...gapReports].sort((a, b) => {
    const statusScore = { weak: 3, medium: 2, strong: 1 };
    const weightScore = { High: 3, Medium: 2, Low: 1 };

    const scoreA = statusScore[a.status] * 10 + weightScore[a.examWeight];
    const scoreB = statusScore[b.status] * 10 + weightScore[b.examWeight];

    return scoreB - scoreA;
  });

  const tasks: RevisionTask[] = [];
  let currentDay = 1;
  let dayMinutesAllocated = 0;

  for (let i = 0; i < sortedReports.length; i++) {
    const rep = sortedReports[i];
    const fullTopic = topics.find((t) => t.id === rep.topicId);

    // Duration based on severity
    let duration = 60;
    if (rep.status === 'weak') {
      duration = Math.min(120, minutesPerDay);
    } else if (rep.status === 'medium') {
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
      id: `task-${rep.topicId}-${Date.now()}-${i}`,
      dayNumber: currentDay,
      topicId: rep.topicId,
      topicName: rep.topicName,
      chapter: rep.chapter,
      status: rep.status,
      priority: rep.status === 'weak' ? 'High' : rep.status === 'medium' ? 'Medium' : 'Low',
      durationMinutes: duration,
      learningObjective:
        rep.status === 'weak'
          ? `Overcome critical conceptual gaps: ${rep.diagnosisReason}`
          : rep.status === 'medium'
          ? `Consolidate exam speed and precision on: ${rep.topicName}`
          : `Quick refresher on proven strong topic: ${rep.topicName}`,
      sourceSections: [
        rep.citationRef,
        fullTopic ? `Syllabus Key Subtopics: ${fullTopic.subtopics.join(', ')}` : 'Textbook Core Formulas',
      ],
      practiceItems: [
        rep.recommendedAction,
        `Complete 3-5 focused questions from past papers (${rep.examWeight} Exam Frequency)`,
        `Run targeted diagnostic quiz on ${rep.topicName}`,
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
