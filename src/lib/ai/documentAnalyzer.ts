import { Topic, Question, DocumentChunk } from '@/types';
import { callGroundedLLM } from './groq';

export interface ExtractedDocumentData {
  topics: Topic[];
  questions: Question[];
}

/**
 * Extracts topics, subtopics, and initial diagnostic questions from uploaded document text.
 */
export async function extractTopicsAndQuestionsFromText(
  docId: string,
  docName: string,
  chunks: DocumentChunk[],
  rawText: string
): Promise<ExtractedDocumentData> {
  const sampleExcerpt = chunks
    .slice(0, 4)
    .map((c, i) => `[Excerpt ${i + 1} (${c.sectionCitation})]:\n${c.content}`)
    .join('\n\n')
    .slice(0, 2500);

  const systemPrompt = `You are an expert curriculum analyzer and diagnostic test generator for GapFinder AI.
Your task is to analyze the uploaded study document and extract 2 to 3 main topics covered in this text, along with 2 multiple-choice diagnostic questions strictly grounded in the text.
Rules:
1. Every topic must exist in the text.
2. Every question must have 4 options, a correct answer index (0-3), and explanation with citations.
3. Return ONLY valid JSON with this exact schema:
{
  "topics": [
    {
      "name": "Topic Name",
      "chapter": "Chapter or Unit Name",
      "description": "Short summary of what this topic covers",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "examWeight": "High"
    }
  ],
  "questions": [
    {
      "topicName": "Topic Name",
      "questionText": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "...",
      "difficulty": "Medium",
      "sourceCitation": "..."
    }
  ]
}`;

  const userPrompt = `DOCUMENT NAME: ${docName}

CONTENT EXCERPTS:
${sampleExcerpt}

Extract topics and grounded diagnostic questions as JSON:`;

  try {
    const response = await callGroundedLLM(systemPrompt, userPrompt, 0.2);

    if (response.provider === 'groq') {
      const jsonStart = response.content.indexOf('{');
      const jsonEnd = response.content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = response.content.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);

        const extractedTopics: Topic[] = (parsed.topics || []).map((t: any, idx: number) => ({
          id: `top-${docId}-${idx + 1}`,
          subjectId: 'sub-custom',
          chapter: t.chapter || `From: ${docName}`,
          name: t.name,
          description: t.description || `Extracted from ${docName}`,
          subtopics: Array.isArray(t.subtopics) ? t.subtopics : ['General Principles', 'Core Definitions'],
          pastExamFrequency: Math.floor(Math.random() * 4) + 3,
          examWeight: (t.examWeight as 'High' | 'Medium' | 'Low') || 'High',
          sourceCitation: `${docName} (p. 1)`,
        }));

        const extractedQuestions: Question[] = (parsed.questions || []).map((q: any, idx: number) => {
          const matchingTopic =
            extractedTopics.find((t) => t.name.toLowerCase() === (q.topicName || '').toLowerCase()) ||
            extractedTopics[0];

          return {
            id: `q-${docId}-${idx + 1}`,
            topicId: matchingTopic ? matchingTopic.id : `top-${docId}-1`,
            topicName: matchingTopic ? matchingTopic.name : q.topicName || 'General Topic',
            chapter: matchingTopic ? matchingTopic.chapter : `From: ${docName}`,
            questionText: q.questionText,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            explanation: q.explanation || `Based on ${docName}`,
            difficulty: (q.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            sourceDocument: docName,
            sourceCitation: q.sourceCitation || `${docName} Section 1`,
            groundedContextSnippet: sampleExcerpt.slice(0, 200),
          };
        });

        if (extractedTopics.length > 0) {
          return { topics: extractedTopics, questions: extractedQuestions };
        }
      }
    }
  } catch (err) {
    console.warn('LLM document analysis error, using heuristic extraction:', err);
  }

  // Fallback: Heuristic extraction from document title and first lines
  const cleanDocName = docName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const topicId = `top-${docId}-1`;
  const fallbackTopic: Topic = {
    id: topicId,
    subjectId: 'sub-custom',
    chapter: `Unit: ${cleanDocName}`,
    name: cleanDocName,
    description: `Core concepts and syllabus requirements extracted from ${docName}`,
    subtopics: ['Core Definitions', 'Theoretical Foundations', 'Applied Problems'],
    pastExamFrequency: 4,
    examWeight: 'High',
    sourceCitation: `${docName} (p. 1)`,
  };

  const firstChunkSnippet = chunks[0]?.content || rawText.slice(0, 300);
  const fallbackQuestion: Question = {
    id: `q-${docId}-1`,
    topicId,
    topicName: cleanDocName,
    chapter: `Unit: ${cleanDocName}`,
    questionText: `Based on the uploaded document "${docName}", what is the primary focus of this unit?`,
    options: [
      `The core principles and methods detailed in "${cleanDocName}"`,
      'Generic unrelated definitions not in the document',
      'Historical context unrelated to the syllabus',
      'Concepts excluded from the examination scope',
    ],
    correctAnswer: 0,
    explanation: `According to ${docName}: "${firstChunkSnippet.slice(0, 160)}..."`,
    difficulty: 'Medium',
    sourceDocument: docName,
    sourceCitation: `${docName} - Section 1`,
    groundedContextSnippet: firstChunkSnippet.slice(0, 250),
  };

  return {
    topics: [fallbackTopic],
    questions: [fallbackQuestion],
  };
}
