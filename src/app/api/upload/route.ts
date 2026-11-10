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
        const pdfModule = await import('pdf-parse') as any;
        if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const res = await parser.getText();
          if (res && typeof res.text === 'string' && res.text.trim()) {
            extractedText = res.text;
          } else if (res && Array.isArray(res.pages)) {
            extractedText = res.pages.map((p: any) => p.text || '').join('\n\n');
          }
        } else if (typeof pdfModule === 'function') {
          const res = await pdfModule(buffer);
          extractedText = res.text || '';
        } else if (typeof pdfModule.default === 'function') {
          const res = await pdfModule.default(buffer);
          extractedText = res.text || '';
        }
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr);
      }

      // Safeguard: Ensure raw PDF bytecode is never treated as extracted document text
      if (extractedText.startsWith('%PDF-') || extractedText.includes('<</Type/Catalog')) {
        extractedText = '';
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim() || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Could not extract readable text from this document. Please ensure it contains selectable text (not scanned images).' },
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
