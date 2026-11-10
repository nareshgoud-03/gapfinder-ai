import { DocumentChunk, Citation } from '@/types';
import { SAMPLE_CHUNKS } from '@/lib/mockData';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  citation: Citation;
}

// In-memory store for active chunks (seeded with initial high-yield calculus materials)
let activeChunkStore: DocumentChunk[] = [...SAMPLE_CHUNKS];

export function setMemoryChunks(chunks: DocumentChunk[]) {
  activeChunkStore = chunks;
}

export function addMemoryChunks(chunks: DocumentChunk[]) {
  activeChunkStore = [...activeChunkStore, ...chunks];
}

export function removeMemoryChunks(docId: string) {
  activeChunkStore = activeChunkStore.filter((chunk) => chunk.docId !== docId);
}

export function clearMemoryChunks() {
  activeChunkStore = [];
}

export function getMemoryChunks(): DocumentChunk[] {
  return activeChunkStore;
}

/**
 * Retrieves the top-K most semantically relevant document chunks for a query.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK: number = 4,
  filterTopicId?: string
): Promise<RetrievalResult[]> {
  const queryVec = await generateEmbedding(query);
  const candidates = activeChunkStore.filter((chunk) => {
    if (filterTopicId && chunk.topicId && chunk.topicId !== filterTopicId) {
      return false;
    }
    return true;
  });

  const scored: RetrievalResult[] = [];

  for (const chunk of candidates) {
    const chunkVec = await generateEmbedding(chunk.content);
    const score = cosineSimilarity(queryVec, chunkVec);

    // Also bonus score if query keywords appear explicitly in content
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = queryKeywords.filter(k => chunk.content.toLowerCase().includes(k)).length;
    const boostedScore = score + (matchCount * 0.05);

    scored.push({
      chunk,
      score: boostedScore,
      citation: {
        docName: chunk.docName,
        section: chunk.sectionCitation,
        page: chunk.pageNumber,
        snippet: chunk.content.slice(0, 160) + '...',
      },
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
