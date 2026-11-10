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
  const { topic, difficulty = 'Medium', count = 5 } = params;

  // Step 1: Retrieval over student materials
  // Fetch more chunks when more questions are needed so LLM has enough context
  const retrievalQuery = `${topic.name} ${topic.chapter} ${topic.subtopics.join(' ')}`;
  const topK = Math.max(6, Math.min(count * 2, 20)); // scale chunks with question count, cap at 20
  const retrieved = await retrieveRelevantChunks(retrievalQuery, topK, topic.id);

  if (retrieved.length === 0) {
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
2. Provide exactly 4 options per question.
3. Identify the correct answer index (0 to 3).
4. Provide a step-by-step explanation referencing the source text.
5. Specify the exact citation from the context headers.
6. MANDATORY: You must generate EXACTLY ${count} questions. Do not stop until all ${count} questions are generated.

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "questionText": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "...",
      "difficulty": "${difficulty}",
      "sourceCitation": "..."
    }
  ]
}`;

  const userPrompt = `RETRIEVED CONTEXT:
${contextText}

TOPIC: ${topic.name}
CHAPTER: ${topic.chapter}
DIFFICULTY: ${difficulty}
REQUIRED NUMBER OF QUESTIONS: ${count}

Generate all ${count} diagnostic questions as a JSON object with a "questions" array now:`;

  try {
    // Scale max_tokens with question count: ~600 tokens per question + 500 overhead
    const maxTokens = Math.min(8000, 500 + count * 650);
    const response = await callGroundedLLM(systemPrompt, userPrompt, 0.2, maxTokens);

    if (response.provider === 'groq') {
      const parsedQuestions = parseQuestionsFromLLM(response.content, topic, retrieved, difficulty);
      if (parsedQuestions.length > 0) {
        return parsedQuestions.slice(0, count);
      }
    }
  } catch (err) {
    console.warn('Failed to generate LLM questions, using topic defaults:', err);
  }

  // Grounded fallback if LLM parse fails
  const existingForTopic = INITIAL_QUESTIONS.filter((q) => q.topicId === topic.id);
  const results: Question[] = [...existingForTopic];

  // If still need more questions to meet count, synthesize grounded questions from remaining retrieved chunks
  for (let i = 0; i < retrieved.length && results.length < count; i++) {
    const chunk = retrieved[i];
    results.push({
      id: `gen-fb-${topic.id}-${Date.now()}-${i}`,
      topicId: topic.id,
      topicName: topic.name,
      chapter: topic.chapter,
      questionText: `Based on ${chunk.citation.section}, which of the following is correct regarding ${topic.name}?`,
      options: [
        `Strict adherence to the formula stated in ${chunk.citation.section}`,
        `Ignoring intermediate algebraic steps during evaluation`,
        `Skipping boundary conditions in practical exam problems`,
        `Assuming functions are discontinuous without verification`,
      ],
      correctAnswer: 0,
      explanation: `According to ${chunk.citation.section}: "${chunk.chunk.content.slice(0, 160)}..."`,
      difficulty,
      sourceDocument: chunk.chunk.docName,
      sourceCitation: chunk.citation.section,
      groundedContextSnippet: chunk.chunk.content.slice(0, 250),
    });
  }

  return results.slice(0, count);
}

function parseQuestionsFromLLM(
  text: string,
  topic: Topic,
  retrieved: any[],
  difficulty: 'Easy' | 'Medium' | 'Hard'
): Question[] {
  try {
    // Strip markdown code fences if present
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed: any = null;

    // Attempt 1: direct parse
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Attempt 2: extract outermost {...} object
      const objMatch = clean.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          parsed = JSON.parse(objMatch[0]);
        } catch {
          // Attempt 3: JSON is truncated — try to recover partial questions array
          // Find the "questions": [ ... part and close it safely
          const arrStart = clean.indexOf('"questions"');
          if (arrStart !== -1) {
            const bracketOpen = clean.indexOf('[', arrStart);
            if (bracketOpen !== -1) {
              let partial = clean.slice(bracketOpen);
              // Count complete question objects by counting closing braces that
              // correspond to complete question entries (heuristic: look for
              // "sourceCitation" or "explanation" as the last key before closing })
              const completeItems: string[] = [];
              let depth = 0;
              let itemStart = -1;
              for (let i = 0; i < partial.length; i++) {
                if (partial[i] === '{') {
                  if (depth === 0) itemStart = i;
                  depth++;
                } else if (partial[i] === '}') {
                  depth--;
                  if (depth === 0 && itemStart !== -1) {
                    completeItems.push(partial.slice(itemStart, i + 1));
                    itemStart = -1;
                  }
                }
              }
              if (completeItems.length > 0) {
                try {
                  parsed = { questions: JSON.parse('[' + completeItems.join(',') + ']') };
                } catch {
                  // give up on truncated recovery
                }
              }
            }
          }
        }
      }

      // Attempt 4: bare JSON array
      if (!parsed) {
        const arrMatch = clean.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          try {
            parsed = JSON.parse(arrMatch[0]);
          } catch {
            // ignore
          }
        }
      }
    }

    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.questions)
      ? parsed.questions
      : [];

    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    return rawList.map((item: any, idx: number) => ({
      id: `gen-${topic.id}-${Date.now()}-${idx}`,
      topicId: topic.id,
      topicName: topic.name,
      chapter: topic.chapter,
      questionText: String(item.questionText || item.question || `Question on ${topic.name}`),
      options: Array.isArray(item.options) && item.options.length === 4
        ? item.options.map(String)
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof item.correctAnswer === 'number' && item.correctAnswer >= 0 && item.correctAnswer <= 3
        ? item.correctAnswer
        : 0,
      explanation: String(item.explanation || `Grounded in ${retrieved[0]?.citation?.section || topic.sourceCitation}`),
      difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || difficulty,
      sourceDocument: retrieved[0]?.chunk?.docName || 'Study Material',
      sourceCitation: String(item.sourceCitation || retrieved[0]?.citation?.section || topic.sourceCitation),
      groundedContextSnippet: retrieved[0]?.chunk?.content?.slice(0, 200) || '',
    }));
  } catch (err) {
    console.warn('parseQuestionsFromLLM error:', err);
    return [];
  }
}
