import { NextRequest, NextResponse } from 'next/server';
import { askGroundedTutor } from '@/lib/ai/tutor';

export async function POST(req: NextRequest) {
  try {
    const { query, topicFilter } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await askGroundedTutor(query, topicFilter);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate tutor explanation';
    console.error('Error in AI Tutor route:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
