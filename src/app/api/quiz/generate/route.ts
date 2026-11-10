import { NextRequest, NextResponse } from 'next/server';
import { generateGroundedQuestions } from '@/lib/ai/questionGenerator';
import { INITIAL_TOPICS } from '@/lib/mockData';

export async function POST(req: NextRequest) {
  try {
    const { topicId, difficulty, count } = await req.json();

    const topic = INITIAL_TOPICS.find((t) => t.id === topicId) || INITIAL_TOPICS[0];

    const questions = await generateGroundedQuestions({
      topic,
      difficulty: difficulty || 'Medium',
      count: count || 3,
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate diagnostic questions';
    console.error('Error generating grounded questions:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
