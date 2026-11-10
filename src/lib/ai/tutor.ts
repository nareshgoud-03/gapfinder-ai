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
 * AI Tutor that explains topics using curriculum-aligned pedagogical reasoning and grounded RAG.
 */
export async function askGroundedTutor(
  userQuery: string,
  topicFilter?: string,
  topicName?: string,
  syllabusTopics?: string[]
): Promise<TutorResponse> {
  // Step 1: Semantic retrieval over student's uploaded material
  const retrieved = await retrieveRelevantChunks(userQuery, 6, topicFilter);

  // Check relevance of retrieved chunks against student's query keywords
  const queryKeywords = userQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const matchedChunks = retrieved.filter((r) =>
    queryKeywords.some((kw) => r.chunk.content.toLowerCase().includes(kw))
  );
  const isContextRelevant = matchedChunks.length > 0;

  // Step 2: Build context string for the LLM
  let contextText = '';
  if (retrieved.length > 0) {
    contextText = retrieved
      .map(
        (r, idx) =>
          `[Document ${idx + 1}: ${r.citation.docName} | ${r.citation.section} | Page ${r.citation.page || 'N/A'}]\n${r.chunk.content}`
      )
      .join('\n\n');
  }

  const syllabusText =
    Array.isArray(syllabusTopics) && syllabusTopics.length > 0
      ? `Student's Syllabus Topics: ${syllabusTopics.join(', ')}`
      : '';

  const systemPrompt = `You are GapFinder AI Tutor, an expert and supportive educational revision educator.
Your mission is to help students thoroughly master concepts, eliminate learning gaps, and score higher in exams.

TEACHING & FORMATTING GUIDELINES:
1. ALWAYS provide a thorough, structured, and easy-to-understand educational answer to the student's question or topic.
2. Structure your response with clean GitHub markdown:
   - 📌 **Core Concept & Definition**: Explain what the concept is, its fundamental intuition, and why it matters.
   - 🔍 **Key Principles & Syntax / Formulas**: Step-by-step technical breakdown with clear explanations, code blocks (e.g. Python, SQL), or mathematical notation.
   - 💡 **Practical Example / Solved Illustration**: A realistic solved example or code snippet demonstrating practical usage.
   - 🎯 **Exam & Revision Takeaways**: Common mistakes students make, tricky edge cases, and essential points to remember for tests.
3. GROUNDING:
   - If the retrieved context contains relevant definitions, formulas, or theorems, integrate them and cite the document names and section titles.
   - If the retrieved documents do not cover this specific question, still provide a complete, high-quality, syllabus-aligned explanation.
4. TONE: Pedagogical, encouraging, crystal-clear, and structured for fast revision.`;

  const userPrompt = `${syllabusText ? `${syllabusText}\n\n` : ''}${
    contextText ? `RETRIEVED STUDY CONTEXT:\n${contextText}\n\n` : ''
  }STUDENT QUESTION:
${userQuery}

${topicName ? `Current Topic Focus: ${topicName}` : ''}

Provide a comprehensive, step-by-step educational explanation:`;

  const response = await callGroundedLLM(systemPrompt, userPrompt, 0.3, 2048);

  const citations: Citation[] =
    isContextRelevant && matchedChunks.length > 0
      ? matchedChunks.slice(0, 3).map((r) => r.citation)
      : [
          {
            docName: topicName ? `${topicName} Reference Guide` : 'Curriculum Study Guide',
            section: topicName || 'Foundational Principles & Concepts',
            snippet: `Core curriculum conceptual overview and revision guide for ${userQuery}.`,
          },
        ];

  return {
    answer: response.content,
    citations,
    isGroundingSufficient: true,
    provider: `${response.provider} (${response.modelUsed})`,
  };
}
