'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppState } from '@/lib/store';
import { DocumentMeta, DocumentType } from '@/types';

export default function MaterialsUploadPage() {
  const { documents, addDocument, removeDocument, clearAllData, resetToDemo } = useAppState();

  const [selectedType, setSelectedType] = useState<DocumentType>('textbook');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadMessage('Extracting text and chunking document for RAG...');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', selectedType);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      addDocument(data.document, data.extractedTopics, data.generatedQuestions);
      setUploadMessage(
        `Successfully parsed "${file.name}"! Indexed ${data.chunksCount} chunks and extracted ${data.extractedTopics?.length || 0} topics.`
      );
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading document.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Study Materials & Syllabus Indexer"
        subtitle="Upload your curriculum syllabus, textbook chapters, notes, and past examination papers"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Upload Zone */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-brand-500 transition-all shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Upload New Study Document
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF and TXT. Documents are chunked and converted into 384-dimensional semantic embeddings.
              </p>
            </div>

            {/* Document Type Selector */}
            <div className="flex justify-center gap-2 text-xs">
              {(
                [
                  { id: 'syllabus', label: 'Syllabus' },
                  { id: 'textbook', label: 'Textbook' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'past_papers', label: 'Past Exam Papers' },
                ] as const
              ).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedType === type.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* File Input */}
            <div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors">
                <span>Select PDF or TXT File</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-xs text-brand-600 font-medium animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {uploadMessage && !isUploading && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Indexed Documents ({documents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Grounding knowledge base for Question Generation and AI Tutor citations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Clear all indexed documents and questions to start from a blank canvas?')) {
                    clearAllData();
                  }
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Materials</span>
              </button>

              <button
                onClick={() => {
                  resetToDemo();
                  window.location.reload();
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reload Seed Documents</span>
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">No study documents indexed yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your syllabus PDF or textbook notes above, or click &ldquo;Reload Seed Documents&rdquo; to load the demo curriculum.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        {doc.type}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    </div>
                    {doc.summary && (
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                        {doc.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5">
                      <span>{doc.chunkCount} semantic chunks</span>
                      <span>&bull;</span>
                      <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
