import { NextRequest, NextResponse } from 'next/server';
import { chunkDocumentText } from '@/lib/rag/chunker';
import { addMemoryChunks } from '@/lib/rag/retriever';
import { DocumentMeta, DocumentType } from '@/types';

// Pure JS PDF text extraction or text parsing
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
        // Dynamic import pdf-parse
        // Note: pdf-parse expects a buffer
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

    const docMeta: DocumentMeta = {
      id: docId,
      name: docName,
      type: docType,
      uploadedAt: new Date().toISOString(),
      fileSize,
      chunkCount: chunks.length,
      status: 'ready',
      summary: `Parsed ${chunks.length} semantically indexed chunks from ${docName}.`,
      extractedTextLength: extractedText.length,
    };

    return NextResponse.json({
      success: true,
      document: docMeta,
      chunksCount: chunks.length,
      sampleCitation: chunks[0]?.sectionCitation || 'General Section',
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
