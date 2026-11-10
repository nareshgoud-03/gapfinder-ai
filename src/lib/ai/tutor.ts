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
  // Step 1: Semantic Retrieval over student's uploaded material
  const retrieved = await retrieveRelevantChunks(userQuery, 4, topicFilter);

  // Check relevance threshold (min cosine score)
  const bestScore = retrieved.length > 0 ? retrieved[0].score : 0;

  if (retrieved.length === 0 || bestScore < 0.15) {
    return {
      answer: "I couldn't find sufficient information about this topic in your uploaded materials. Please make sure you have uploaded the relevant textbook chapter, notes, or syllabus containing this concept.",
      citations: [],
      isGroundingSufficient: false,
      provider: 'guardrail',
    };
  }

  const contextText = retrieved
    .map(
      (r, idx) =>
        `[Document ${idx + 1}: ${r.citation.docName} | ${r.citation.section} | Page ${r.citation.page || 'N/A'}]\n${r.chunk.content}`
    )
    .join('\n\n');

  const systemPrompt = `You are GapFinder AI Tutor, an intelligent revision tutor.
CRITICAL MANDATORY INSTRUCTIONS:
1. Answer the student's question ONLY using the retrieved context from their uploaded materials.
2. DO NOT use outside general knowledge or hallucinate theorems not in the text.
3. If the context does not contain the answer, say:
   "I couldn't find sufficient information about this topic in your uploaded materials."
4. Always cite the exact source document, section, and page number in your explanation.
5. Provide clear step-by-step mathematical reasoning, worked examples, and actionable revision guidance.`;

  const userPrompt = `RETRIEVED CONTEXT FROM STUDENT'S UPLOADED MATERIALS:
${contextText}

STUDENT QUESTION:
${userQuery}

Explain clearly with citations based solely on the text above:`;

  const response = await callGroundedLLM(systemPrompt, userPrompt, 0.2);

  const citations: Citation[] = retrieved.map((r) => r.citation);

  return {
    answer: response.content,
    citations,
    isGroundingSufficient: true,
    provider: `${response.provider} (${response.modelUsed})`,
  };
}
