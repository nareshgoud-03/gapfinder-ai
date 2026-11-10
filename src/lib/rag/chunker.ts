import { DocumentChunk } from '@/types';

export interface ChunkOptions {
  chunkSize?: number; // target character size per chunk
  chunkOverlap?: number;
}

/**
 * Splits document text into semantically cohesive chunks while preserving section
 * headings and document metadata.
 */
export function chunkDocumentText(
  docId: string,
  docName: string,
  text: string,
  options: ChunkOptions = {}
): DocumentChunk[] {
  const chunkSize = options.chunkSize || 600;
  const chunkOverlap = options.chunkOverlap || 120;

  const chunks: DocumentChunk[] = [];
  
  // Clean text
  const normalizedText = text.replace(/\r\n/g, '\n').trim();
  if (!normalizedText) return [];

  // Split into paragraphs / lines
  const paragraphs = normalizedText.split(/\n\s*\n/);
  let currentChunk = '';
  let currentPage = 1;
  let currentSection = 'General Section';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect section headers
    if (trimmed.length < 80 && /^(Chapter|Section|Unit|Theorem|Example|Part|Topic|\d+\.|\bCBSE\b|\bNCERT\b)/i.test(trimmed)) {
      currentSection = trimmed.replace(/[\n\r]+/g, ' ');
    }

    // Detect page markers if extracted from PDF e.g. "--- Page 3 ---"
    const pageMatch = trimmed.match(/---\s*Page\s*(\d+)\s*---/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    if ((currentChunk + ' ' + trimmed).length > chunkSize && currentChunk.length > 0) {
      chunkIndex++;
      chunks.push({
        id: `${docId}-chunk-${chunkIndex}`,
        docId,
        docName,
        content: currentChunk.trim(),
        pageNumber: currentPage,
        sectionCitation: `${docName} - ${currentSection} (p. ${currentPage})`,
      });

      // Maintain sliding window overlap
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + '\n\n' + trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    }
  }

  // Push final chunk
  if (currentChunk.trim().length > 0) {
    chunkIndex++;
    chunks.push({
      id: `${docId}-chunk-${chunkIndex}`,
      docId,
      docName,
      content: currentChunk.trim(),
      pageNumber: currentPage,
      sectionCitation: `${docName} - ${currentSection} (p. ${currentPage})`,
    });
  }

  return chunks;
}
