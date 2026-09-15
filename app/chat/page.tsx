'use client';

import { useEffect, useRef, useState } from 'react';

interface Source {
  ref: number;
  source_file: string;
  similarity: number;
}

interface Document {
  id: number;
  filename: string;
  chunk_count: number;
  uploaded_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null); // null = search all documents
  // Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------
  // Scroll to latest message
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  // --------------------------------------------------
  // Fetch documents
  // --------------------------------------------------

  async function fetchDocuments() {
    try {
      setDocumentsLoading(true);

      const res = await fetch('/api/documents');

      if (!res.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await res.json();

      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  // --------------------------------------------------
  // Upload PDF
  // --------------------------------------------------

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus('Please select a PDF file.');
      return;
    }

    setUploading(true);
    setUploadStatus('');

    try {
      const formData = new FormData();

      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();

      let data: {
        error?: string;
        chunksStored?: number;
        totalChunks?: number;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {
            error: 'The server returned an invalid response.',
          };
        }
      }

      if (!res.ok) {
        throw new Error(
          data.error || `Upload failed with status ${res.status}`
        );
      }

      setUploadStatus(
        `Uploaded successfully — ${data.chunksStored ?? 0} chunks stored.`
      );

      await fetchDocuments();
    } catch (error) {
      console.error(error);

      setUploadStatus(
        error instanceof Error
          ? error.message
          : 'Something went wrong while uploading.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // --------------------------------------------------
  // Ask question
  // --------------------------------------------------

  async function handleAsk() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading || documents.length === 0) {
      return;
    }

    // ------------------------------------------------
    // Add user's question immediately
    // ------------------------------------------------

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmedQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input immediately
    setQuestion('');

    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          documentFilter: selectedDoc, // ADD THIS
        }),
      });

      const responseText = await res.text();

      let data: {
        answer?: string;
        sources?: Source[];
        error?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {
            error: 'The server returned an invalid response.',
          };
        }
      }

      if (!res.ok) {
        throw new Error(
          data.error || `Request failed with status ${res.status}`
        );
      }

      // ------------------------------------------------
      // Add assistant response
      // ------------------------------------------------

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer || 'No answer was returned.',
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Something went wrong — please try again.',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto flex min-h-screen max-w-7xl">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">

          {/* Sidebar Header */}
          <div className="border-b border-gray-200 p-5">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8M8 17h6" />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Documents
                </h2>

                <p className="text-xs text-gray-400">
                  {documents.length}{' '}
                  {documents.length === 1
                    ? 'document'
                    : 'documents'}
                </p>
              </div>

            </div>
          </div>

          {/* Upload */}
          <div className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>

                  Upload PDF
                </>
              )}
            </button>

            {uploadStatus && (
              <p
                className={`mt-2 text-xs ${uploadStatus.includes('successfully')
                  ? 'text-green-600'
                  : 'text-red-500'
                  }`}
              >
                {uploadStatus}
              </p>
            )}
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto px-3 pb-5">

            {documentsLoading ? (
              <div className="space-y-3 px-2 pt-2">
                <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ) : documents.length === 0 ? (
              <div className="px-3 pt-8 text-center">

                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>

                <p className="text-xs font-medium text-gray-600">
                  No documents yet
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-400">
                  Upload a PDF to start asking questions.
                </p>

              </div>
            ) : (
              <div className="space-y-1">

                {documents.map((doc) => {
                  const isSelected = selectedDoc === doc.filename;

                  return (
                    <div
                      key={doc.id}
                      onClick={() =>
                        setSelectedDoc(isSelected ? null : doc.filename)
                      }
                      className={`cursor-pointer rounded-lg px-3 py-3 transition ${isSelected
                        ? 'bg-gray-900 hover:bg-gray-800'
                        : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isSelected
                            ? 'bg-white/10 text-white'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M8 13h2M8 17h6" />
                          </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            title={doc.filename}
                            className={`truncate text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'
                              }`}
                          >
                            {doc.filename}
                          </p>

                          <p className={`mt-1 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                            {doc.chunk_count} {doc.chunk_count === 1 ? 'chunk' : 'chunks'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>
        </aside>

        {/* =====================================================
            MAIN CHAT
        ====================================================== */}

        <section className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 md:px-8">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-sm font-semibold text-gray-900">
                    Ask your documents
                  </h1>

                  <p className="hidden text-xs text-gray-400 sm:block">
                    Ask questions based on your uploaded PDFs.
                  </p>
                </div>

              </div>

              {/* Mobile Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 md:hidden"
              >
                {uploading ? 'Uploading...' : '+ Upload'}
              </button>

            </div>
          </header>

          {/* =================================================
              CHAT AREA
          ================================================== */}

          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">

            <div className="mx-auto max-w-4xl">

              {/* No messages */}
              {messages.length === 0 && !loading && (
                <div className="flex min-h-[55vh] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 shadow-sm">
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                      </svg>
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                      Ask a question to get started
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-400">
                      Your answers will be generated using the
                      information contained in your uploaded documents.
                    </p>

                    {documents.length === 0 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-5 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Upload your first PDF
                      </button>
                    )}

                  </div>

                </div>
              )}

              {/* =================================================
                  MESSAGES
              ================================================== */}

              <div className="space-y-8">

                {messages.map((message) => (

                  <div
                    key={message.id}
                    className={
                      message.role === 'user'
                        ? 'flex justify-end'
                        : 'flex justify-start'
                    }
                  >

                    {message.role === 'user' ? (

                      /* USER MESSAGE */
                      <div className="max-w-[80%]">

                        <div className="mb-2 flex items-center justify-end gap-2">
                          <span className="text-xs font-medium text-gray-500">
                            You
                          </span>

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
                            </svg>
                          </div>
                        </div>

                        <div className="rounded-2xl rounded-tr-md bg-gray-900 px-5 py-3.5 text-sm leading-6 text-white">
                          {message.content}
                        </div>

                      </div>

                    ) : (

                      /* ASSISTANT MESSAGE */
                      <div className="w-full">

                        <div className="mb-3 flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 3v18M3 12h18" />
                            </svg>
                          </div>

                          <span className="text-sm font-medium text-gray-900">
                            Answer
                          </span>

                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                            {message.content}
                          </p>

                        </div>

                        {/* Sources for this answer */}
                        {message.sources &&
                          message.sources.length > 0 && (
                            <div className="mt-4">

                              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Sources
                              </p>

                              <div className="space-y-2">

                                {message.sources.map((source) => (
                                  <div
                                    key={`${message.id}-${source.ref}`}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                                  >

                                    <div className="flex min-w-0 items-center gap-3">

                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                                        {source.ref}
                                      </span>

                                      <span className="truncate text-sm text-gray-700">
                                        {source.source_file}
                                      </span>

                                    </div>

                                    <span className="ml-4 shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                      {source.similarity.toFixed(3)}
                                    </span>

                                  </div>
                                ))}

                              </div>

                            </div>
                          )}

                      </div>
                    )}

                  </div>

                ))}

                {/* Loading message */}
                {loading && (
                  <div className="flex justify-start">

                    <div className="w-full">

                      <div className="mb-3 flex items-center gap-2">

                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 3v18M3 12h18" />
                          </svg>
                        </div>

                        <span className="text-sm font-medium text-gray-900">
                          Answer
                        </span>

                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center gap-3">

                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
                          </div>

                          <span className="text-sm text-gray-500">
                            Searching your documents...
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />

            </div>
          </div>

          {/* =================================================
              QUESTION INPUT
          ================================================== */}

          <div className="sticky bottom-0 border-t border-gray-200 bg-[#fafafa]/95 px-4 py-4 backdrop-blur md:px-8">

            <div className="mx-auto max-w-4xl">
              {selectedDoc && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-xs">
                  <span className="text-gray-600">
                    Asking only: <span className="font-medium text-gray-900">{selectedDoc}</span>
                  </span>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="ml-2 font-medium text-gray-500 hover:text-gray-900"
                  >
                    Clear ✕
                  </button>
                </div>
              )}
              <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">

                <div className="flex items-center gap-2">

                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !loading
                      ) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                    placeholder={
                      documents.length === 0
                        ? 'Upload a PDF first...'
                        : 'Ask something about your documents...'
                    }
                    disabled={
                      documents.length === 0 || loading
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />

                  <button
                    onClick={handleAsk}
                    disabled={
                      !question.trim() ||
                      loading ||
                      documents.length === 0
                    }
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {loading && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}

                    {loading ? 'Thinking' : 'Ask'}

                  </button>

                </div>

              </div>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                Answers are generated from your uploaded documents.
              </p>

            </div>
          </div>

        </section>
      </div>
    </main>
  );
}