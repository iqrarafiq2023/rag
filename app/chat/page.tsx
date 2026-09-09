'use client';

import { useState } from 'react';

interface Source {
  ref: number;
  source_file: string;
  similarity: number;
}

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setAnswer('Something went wrong — please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Ask your documents
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Ask questions and get answers based on your uploaded PDFs.
              </p>
            </div>

            <a
              href="/upload"
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Upload PDF
            </a>
          </div>
        </div>

        {/* Question Box */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleAsk();
                }
              }}
              placeholder="Ask something about your documents..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

            <button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {loading ? 'Thinking' : 'Ask'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
        )}

        {/* Answer */}
        {answer && !loading && (
          <div className="mt-8">
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
                {answer}
              </p>
            </div>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Sources
            </p>

            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.ref}
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

        {/* Empty state */}
        {!answer && !loading && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
              <svg
                width="21"
                height="21"
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

            <p className="mt-1 text-xs text-gray-400">
              Answers will be generated from your uploaded documents.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}