import { NextRequest, NextResponse } from 'next/server';
import { generateGroundedQuestions } from '@/lib/ai/questionGenerator';
import { INITIAL_TOPICS, INITIAL_QUESTIONS } from '@/lib/mockData';
import { Topic, Question } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { topicId, difficulty, count = 10, topics: customTopics } = await req.json();

    const targetCount = Number(count) || 10;
    const availableTopics: Topic[] =
      Array.isArray(customTopics) && customTopics.length > 0
        ? customTopics
        : INITIAL_TOPICS;

    if (availableTopics.length === 0) {
      return NextResponse.json(
        { error: 'No topics available. Please upload study materials first.' },
        { status: 400 }
      );
    }

    const generatedQuestions: Question[] = [];

    if (topicId && topicId !== 'all') {
      // Single specific topic requested
      const topic = availableTopics.find((t) => t.id === topicId) || availableTopics[0];
      const questions = await generateGroundedQuestions({
        topic,
        difficulty: difficulty || 'Medium',
        count: targetCount,
      });
      generatedQuestions.push(...questions);
    } else {
      // Comprehensive syllabus: distribute targetCount questions across all available topics
      const numTopics = availableTopics.length;
      const basePerTopic = Math.max(1, Math.floor(targetCount / numTopics));
      let remainingCount = targetCount;

      for (let i = 0; i < numTopics && remainingCount > 0; i++) {
        const topic = availableTopics[i];
        // Always ask for at least what we still need so we don't under-generate
        const countForThisTopic = i === numTopics - 1 ? remainingCount : Math.min(basePerTopic, remainingCount);

        try {
          const topicQuestions = await generateGroundedQuestions({
            topic,
            difficulty: difficulty || 'Medium',
            count: countForThisTopic,
          });
          generatedQuestions.push(...topicQuestions);
          // Only subtract what we actually got (not what we asked for)
          remainingCount -= topicQuestions.length;
        } catch (topicErr) {
          console.warn(`Failed questions for topic ${topic.name}:`, topicErr);
        }
      }

      // If still need more to reach targetCount, loop through topics again
      if (generatedQuestions.length < targetCount) {
        for (let i = 0; i < numTopics && generatedQuestions.length < targetCount; i++) {
          const topic = availableTopics[i];
          const stillNeed = targetCount - generatedQuestions.length;
          try {
            const extra = await generateGroundedQuestions({
              topic,
              difficulty: difficulty || 'Medium',
              count: stillNeed,
            });
            // Avoid exact duplicate ids from first pass
            const existingIds = new Set(generatedQuestions.map((q) => q.id));
            const fresh = extra
              .filter((q) => !existingIds.has(q.id))
              .map((q) => ({ ...q, id: `${q.id}-r2` }));
            generatedQuestions.push(...fresh);
          } catch {
            // ignore
          }
        }
      }

      // Final supplement from INITIAL_QUESTIONS if still short
      if (generatedQuestions.length < targetCount) {
        const existingIds = new Set(generatedQuestions.map((q) => q.id));
        const extras = INITIAL_QUESTIONS.filter((q) => !existingIds.has(q.id));
        for (const ext of extras) {
          if (generatedQuestions.length >= targetCount) break;
          generatedQuestions.push(ext);
        }
      }
    }

    // Ensure we return exactly up to targetCount
    return NextResponse.json({
      success: true,
      count: generatedQuestions.length,
      questions: generatedQuestions.slice(0, targetCount),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate diagnostic questions';
    console.error('Error generating grounded questions:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
