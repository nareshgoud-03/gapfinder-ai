import { NextRequest, NextResponse } from 'next/server';
import { askGroundedTutor } from '@/lib/ai/tutor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, topicFilter, topicName, syllabusTopics } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await askGroundedTutor(
      query.trim(),
      topicFilter,
      topicName,
      syllabusTopics
    );

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      isGroundingSufficient: result.isGroundingSufficient,
      provider: result.provider,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate tutor explanation';
    console.error('Error in AI Tutor route:', error);
    return NextResponse.json(
      {
        answer: "Sorry, I encountered an error processing your question. Please try again.",
        citations: [],
        isGroundingSufficient: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
