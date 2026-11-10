import { Question, Topic } from '@/types';
import { retrieveRelevantChunks } from '@/lib/rag/retriever';
import { callGroundedLLM } from './groq';
import { INITIAL_QUESTIONS } from '@/lib/mockData';

export interface GenerateQuestionParams {
  topic: Topic;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  count?: number;
}

/**
 * Generates diagnostic questions strictly grounded in retrieved document chunks.
 */
export async function generateGroundedQuestions(
  params: GenerateQuestionParams
): Promise<Question[]> {
  const { topic, difficulty = 'Medium', count = 3 } = params;

  // Step 1: Retrieval
  const retrievalQuery = `${topic.name} ${topic.chapter} ${topic.subtopics.join(' ')}`;
  const retrieved = await retrieveRelevantChunks(retrievalQuery, 4, topic.id);

  if (retrieved.length === 0) {
    // If no materials uploaded for this topic, look for any initial question or report error
    const fallback = INITIAL_QUESTIONS.filter((q) => q.topicId === topic.id);
    if (fallback.length > 0) return fallback.slice(0, count);
    throw new Error(`No source materials or chunks found for topic: "${topic.name}". Please upload relevant study documents.`);
  }

  const contextText = retrieved
    .map((r, i) => `[Source ${i + 1}: ${r.citation.section}]\n${r.chunk.content}`)
    .join('\n\n');

  const systemPrompt = `You are an expert diagnostic quiz generator for GapFinder AI.
Your task is to generate diagnostic multiple-choice questions strictly grounded in the provided context.
Rules:
1. Every question must be directly answerable from the provided context. Do NOT use outside knowledge.
2. Provide exactly 4 options.
3. Identify the correct answer index (0 to 3).
4. Provide a step-by-step explanation referencing the source.
5. Specify the exact citation from the context headers.
Return ONLY valid JSON matching this schema:
[
  {
    "questionText": "...",
    "options": ["opt0", "opt1", "opt2", "opt3"],
    "correctAnswer": 0,
    "explanation": "...",
    "difficulty": "${difficulty}",
    "sourceCitation": "..."
  }
]`;

  const userPrompt = `RETRIEVED CONTEXT:
${contextText}

TOPIC: ${topic.name}
CHAPTER: ${topic.chapter}
DIFFICULTY: ${difficulty}
NUMBER OF QUESTIONS: ${count}

Generate ${count} diagnostic questions as a JSON array now.`;

  try {
    const response = await callGroundedLLM(systemPrompt, userPrompt, 0.2);

    if (response.provider === 'groq') {
      const jsonStart = response.content.indexOf('[');
      const jsonEnd = response.content.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = response.content.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);

        return parsed.map((item: Record<string, unknown>, idx: number) => ({
          id: `gen-${topic.id}-${Date.now()}-${idx}`,
          topicId: topic.id,
          topicName: topic.name,
          chapter: topic.chapter,
          questionText: String(item.questionText || ''),
          options: (item.options as string[]) || [],
          correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
          explanation: String(item.explanation || ''),
          difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || difficulty,
          sourceDocument: retrieved[0].chunk.docName,
          sourceCitation: String(item.sourceCitation || retrieved[0].citation.section),
          groundedContextSnippet: retrieved[0].chunk.content.slice(0, 200),
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to parse LLM generated questions, using grounded topic defaults:', err);
  }

  // Grounded fallback
  const existingForTopic = INITIAL_QUESTIONS.filter((q) => q.topicId === topic.id);
  if (existingForTopic.length > 0) {
    return existingForTopic.slice(0, count);
  }

  // Create grounded question from first retrieved chunk
  const topChunk = retrieved[0];
  return [
    {
      id: `gen-fb-${topic.id}-${Date.now()}`,
      topicId: topic.id,
      topicName: topic.name,
      chapter: topic.chapter,
      questionText: `Based on ${topChunk.citation.section}, which principle applies to ${topic.name}?`,
      options: [
        `Follow the standard rule stated in ${topic.chapter}`,
        `Use generic approximations without verification`,
        `Skip intermediate boundary conditions`,
        `Assume derivative is zero at all points`,
      ],
      correctAnswer: 0,
      explanation: `According to ${topChunk.citation.section}: "${topChunk.chunk.content.slice(0, 180)}..."`,
      difficulty,
      sourceDocument: topChunk.chunk.docName,
      sourceCitation: topChunk.citation.section,
      groundedContextSnippet: topChunk.chunk.content.slice(0, 250),
    },
  ];
}
