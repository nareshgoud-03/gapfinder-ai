import { NextRequest, NextResponse } from 'next/server';
import { chunkDocumentText } from '@/lib/rag/chunker';
import { addMemoryChunks, removeMemoryChunks } from '@/lib/rag/retriever';
import { extractTopicsAndQuestionsFromText } from '@/lib/ai/documentAnalyzer';
import { extractTextFromPdf } from '@/lib/rag/pdfExtractor';
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
      extractedText = await extractTextFromPdf(buffer);
    } else {
      // TXT / plain text file
      extractedText = buffer.toString('utf-8');
    }

    // Strip leftover PDF bytecode noise
    if (
      extractedText.startsWith('%PDF-') ||
      extractedText.includes('<</Type/Catalog')
    ) {
      extractedText = '';
    }

    if (!extractedText.trim() || extractedText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            'Could not extract readable text from this document. Please ensure it contains selectable text (not scanned images), or try uploading it as a .txt file.',
        },
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
    const msg =
      error instanceof Error
        ? error.message
        : 'Internal server error while processing document';
    console.error('Error handling document upload:', error);
    return NextResponse.json(
      {
        error: `Upload processing failed: ${msg}`,
        success: false,
      },
      { status: 500 }
    );
  }
}


