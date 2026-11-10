import { NextRequest, NextResponse } from 'next/server';
import { chunkDocumentText } from '@/lib/rag/chunker';
import { addMemoryChunks, removeMemoryChunks } from '@/lib/rag/retriever';
import { extractTopicsAndQuestionsFromText } from '@/lib/ai/documentAnalyzer';
import { DocumentMeta, DocumentType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = (formData.get('type') as DocumentType) || 'notes';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const docName = file.name;
    const fileSize = file.size;
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';

    if (docName.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfModule = await import('pdf-parse');
        const pdfParse = ((pdfModule as unknown as { default?: (buf: Buffer) => Promise<{ text: string }> }).default || pdfModule) as (buf: Buffer) => Promise<{ text: string }>;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr) {
        console.warn('PDF parser fallback to utf8 string extraction:', pdfErr);
        extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from document. Please ensure it is not an image-only scanned PDF.' },
        { status: 422 }
      );
    }

    const docId = `doc-${Date.now()}`;
    const chunks = chunkDocumentText(docId, docName, extractedText, {
      chunkSize: 650,
      chunkOverlap: 120,
    });

    // Store in retriever memory
    addMemoryChunks(chunks);

    // Dynamically extract topics and initial diagnostic questions from this document
    const extractedData = await extractTopicsAndQuestionsFromText(
      docId,
      docName,
      chunks,
      extractedText
    );

    const docMeta: DocumentMeta = {
      id: docId,
      name: docName,
      type: docType,
      uploadedAt: new Date().toISOString(),
      fileSize,
      chunkCount: chunks.length,
      status: 'ready',
      summary: `Parsed ${chunks.length} chunks. Extracted ${extractedData.topics.length} topics and ${extractedData.questions.length} questions.`,
      extractedTextLength: extractedText.length,
    };

    return NextResponse.json({
      success: true,
      document: docMeta,
      chunksCount: chunks.length,
      sampleCitation: chunks[0]?.sectionCitation || 'General Section',
      extractedTopics: extractedData.topics,
      generatedQuestions: extractedData.questions,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error while processing document';
    console.error('Error handling document upload:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { docId } = await req.json();

    if (!docId) {
      return NextResponse.json({ error: 'docId is required' }, { status: 400 });
    }

    // Remove document chunks from retriever memory
    removeMemoryChunks(docId);

    return NextResponse.json({ success: true, deletedDocId: docId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
