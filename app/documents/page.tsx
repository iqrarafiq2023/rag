'use client';

import { useEffect, useState } from 'react';

interface Document {
  id: number;
  filename: string;
  chunk_count: number;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto mt-16 p-6">
      <h1 className="text-2xl font-semibold mb-6">Uploaded Documents</h1>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && documents.length === 0 && (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      )}

      <ul className="space-y-3">
        {documents.map((doc) => (
          <li key={doc.id} className="border rounded p-3 text-sm">
            <p className="font-medium">{doc.filename}</p>
            <p className="text-gray-500">
              {doc.chunk_count} chunks · uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>

      <a href="/" className="block mt-8 text-blue-600 underline text-sm">
        ← Upload another
      </a>
    </main>
  );
}