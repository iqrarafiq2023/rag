'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setStatus('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let data: { error?: string; chunksStored?: number; totalChunks?: number } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: 'The server returned an invalid response.' };
        }
      }

      if (!res.ok) {
        setStatus(`Error: ${data.error || 'Upload failed'}`);
      } else {
        setStatus(
          `Stored ${data.chunksStored} / ${data.totalChunks} chunks`
        );
      }
    } catch (err) {
      setStatus('Upload failed — please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Upload a document
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Upload a PDF and we&apos;ll prepare it for your AI assistant.
            </p>
          </div>

          {/* Upload Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="file-upload"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center transition hover:border-gray-400 hover:bg-gray-100"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>

              <p className="text-sm font-medium text-gray-900">
                {file ? file.name : 'Choose a PDF file'}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : 'PDF documents only'}
              </p>

              <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setFile(e.target.files?.[0] ?? null)
                }
                className="hidden"
              />
            </label>

            {/* Selected file */}
            {file && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                    PDF
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setFile(null)}
                  className="ml-3 text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {loading ? 'Processing document...' : 'Upload document'}
            </button>

            {/* Status */}
            {status && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  status.startsWith('Error')
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {status}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 text-center">
            <a
              href="/chat"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Go to chat
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}