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
 * Checks whether the retrieved context is actually relevant to the query
 * by counting how many meaningful query words appear in the context text.
 * This catches off-topic questions (e.g. "machine learning" in a calculus corpus)
 * where the local embedding engine may still return a non-zero similarity.
 */
function isContextRelevant(query: string, contextText: string): boolean {
  const stopWords = new Set([
    'what', 'which', 'when', 'where', 'who', 'whom', 'how', 'why',
    'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
    'and', 'or', 'but', 'not', 'this', 'that', 'it', 'its', 'me', 'my',
    'can', 'do', 'does', 'did', 'has', 'have', 'had', 'be', 'been', 'being',
    'explain', 'define', 'describe', 'tell', 'give', 'show', 'help',
    'please', 'about', 'some', 'any', 'all', 'from', 'by',
  ]);

  // Extract meaningful keywords from query (length > 3, not stop words)
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  if (queryWords.length === 0) return true; // very short query — allow through

  const lowerContext = contextText.toLowerCase();
  const matchCount = queryWords.filter((w) => lowerContext.includes(w)).length;
  const overlapRatio = matchCount / queryWords.length;

  // Require at least 30% keyword overlap OR at least 1 match for short queries
  return overlapRatio >= 0.3 || (queryWords.length <= 2 && matchCount >= 1);
}

/**
 * AI Tutor that explains topics using strictly grounded RAG from uploaded documents.
 */
export async function askGroundedTutor(
  userQuery: string,
  topicFilter?: string
): Promise<TutorResponse> {
  // Step 1: Semantic retrieval over student's uploaded material (8 chunks for rich context)
  const retrieved = await retrieveRelevantChunks(userQuery, 8, topicFilter);

  const bestScore = retrieved.length > 0 ? retrieved[0].score : 0;

  // Step 2: Similarity threshold check
  // Threshold is low (0.05) because the local deterministic embedder produces
  // lower absolute cosine scores than a real sentence-transformer model.
  if (retrieved.length === 0 || bestScore < 0.05) {
    return {
      answer:
        "I couldn't find sufficient information about this topic in your uploaded materials. Please make sure you have uploaded the relevant textbook chapter, notes, or syllabus containing this concept.",
      citations: [],
      isGroundingSufficient: false,
      provider: 'guardrail',
    };
  }

  // Step 3: Keyword-overlap check — catches off-topic questions where the local
  // embedder returns non-zero similarity despite no semantic match (e.g., asking
  // about "machine learning" in a calculus textbook corpus).
  const combinedContext = retrieved
    .map((r) => `${r.citation.docName} ${r.citation.section} ${r.chunk.content}`)
    .join(' ');
  if (!isContextRelevant(userQuery, combinedContext)) {
    return {
      answer:
        "🔒 **RAG Guardrail:** Your question does not appear to be covered in your uploaded study materials.\n\nYour uploaded materials cover: Calculus, Integrals, Differential Equations, Limits, and related mathematics topics.\n\nPlease upload relevant study documents if you want to explore a different subject.",
      citations: [],
      isGroundingSufficient: false,
      provider: 'guardrail_keyword',
    };
  }

  // Step 4: Build context string for the LLM
  const contextText = retrieved
    .map(
      (r, idx) =>
        `[Document ${idx + 1}: ${r.citation.docName} | ${r.citation.section} | Page ${r.citation.page || 'N/A'}]\n${r.chunk.content}`
    )
    .join('\n\n');

  const systemPrompt = `You are GapFinder AI Tutor, an intelligent educational revision assistant.
CRITICAL RULES:
1. Answer ONLY using the retrieved context from the student's uploaded materials below.
2. NEVER use outside knowledge or hallucinate facts not present in the text.
3. If the retrieved context does not contain enough information to answer, respond:
   "I couldn't find sufficient information about this topic in your uploaded materials."
4. Structure your answer clearly: start with a direct answer, then provide step-by-step explanation, formulas, and worked examples from the source.
5. Always end with the exact source citation (document name, section, page number).`;

  const userPrompt = `RETRIEVED CONTEXT FROM STUDENT'S UPLOADED MATERIALS:
${contextText}

STUDENT QUESTION:
${userQuery}

Explain clearly with step-by-step reasoning and cite the exact source section:`;

  const response = await callGroundedLLM(systemPrompt, userPrompt, 0.3, 2048);

  const citations: Citation[] = retrieved.map((r) => r.citation);

  return {
    answer: response.content,
    citations,
    isGroundingSufficient: true,
    provider: `${response.provider} (${response.modelUsed})`,
  };
}
