import { Citation } from '@/types';
import { retrieveRelevantChunks } from '@/lib/rag/retriever';
import { callGroundedLLM } from './groq';

export interface TutorResponse {
  answer: string;
  citations: Citation[];
  isGroundingSufficient: boolean;
  provider: string;
}

/**
 * AI Tutor that explains topics using strictly grounded RAG from uploaded documents.
 */
export async function askGroundedTutor(
  userQuery: string,
  topicFilter?: string
): Promise<TutorResponse> {
  // Step 1: Semantic retrieval over student's uploaded material
  const retrieved = await retrieveRelevantChunks(userQuery, 6, topicFilter);

  // If literally zero chunks in storage
  if (retrieved.length === 0) {
    return {
      answer:
        "I couldn't find sufficient information about this topic in your uploaded materials. Please make sure you have uploaded the relevant textbook chapter, notes, or syllabus containing this concept.",
      citations: [],
      isGroundingSufficient: false,
      provider: 'guardrail',
    };
  }

  // Step 2: Build context string for the LLM
  const contextText = retrieved
    .map(
      (r, idx) =>
        `[Document ${idx + 1}: ${r.citation.docName} | ${r.citation.section} | Page ${r.citation.page || 'N/A'}]\n${r.chunk.content}`
    )
    .join('\n\n');

  const systemPrompt = `You are GapFinder AI Tutor, an intelligent educational revision assistant.
CRITICAL RULES:
1. First, check if the student's question is answerable or discussed in the RETRIEVED CONTEXT below.
2. If the retrieved context contains relevant definitions, theory, or explanations about the question, answer clearly and comprehensively, incorporating step-by-step reasoning, formulas, and examples from the text. Always cite the exact document name, section, and page number.
3. Only if the retrieved context has ABSOLUTELY NOTHING to do with the question, reply with:
   "I couldn't find sufficient information about this topic in your uploaded materials. Please upload relevant documents (e.g. syllabus, textbook chapters, or lecture notes) covering this topic."`;

  const userPrompt = `RETRIEVED CONTEXT FROM STUDENT'S UPLOADED MATERIALS:
${contextText}

STUDENT QUESTION:
${userQuery}

Explain clearly based on the uploaded materials:`;

  const response = await callGroundedLLM(systemPrompt, userPrompt, 0.3, 2048);

  const isSufficient = !response.content.toLowerCase().includes("couldn't find sufficient information");
  const citations: Citation[] = isSufficient ? retrieved.slice(0, 3).map((r) => r.citation) : [];

  return {
    answer: response.content,
    citations,
    isGroundingSufficient: isSufficient,
    provider: `${response.provider} (${response.modelUsed})`,
  };
}
