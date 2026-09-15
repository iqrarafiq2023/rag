# RAG Document Q&A Agent

A full-stack Retrieval-Augmented Generation (RAG) application that lets users upload PDF documents, automatically indexes them into a vector knowledge base, and answers natural-language questions about their content — with source citations and per-document filtering.

**Live demo:** https://rag-dtnh.vercel.app/

---

## Overview

Upload a PDF → the app extracts and chunks the text → each chunk is embedded and stored in a vector database → when a user asks a question, the app retrieves the most relevant chunks via semantic similarity search → an LLM generates a grounded answer, citing which source chunks it used.

Built as a personal project to explore RAG architecture, TypeScript, vector search, and end-to-end AI application development.

---

## Features

- 📄 **PDF upload** with automatic text extraction and chunking
- 🧠 **Semantic search** via vector embeddings (Google Gemini) stored in Postgres (pgvector)
- 💬 **Chat interface** for asking natural-language questions about uploaded documents
- 🔗 **Source citations** — every answer references which document/chunk it came from
- 🎯 **Per-document filtering** — scope questions to a single document or search across all of them
- 📚 **Document library** — sidebar view of all uploaded documents with chunk counts
- 🔄 **Retry logic** for transient LLM API failures (e.g. 503 errors under high demand)
- ✅ **Automated tests** (Jest) for core chunking logic
- 🚀 **CI pipeline** (GitHub Actions) — runs tests and type-checks on every push

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Node.js runtime) |
| Database | Supabase (Postgres + pgvector extension) |
| Embeddings & LLM | Google Gemini API (`gemini-embedding-001`, `gemini-3.6-flash`) |
| PDF Parsing | `unpdf` (serverless-compatible PDF text extraction) |
| Testing | Jest |
| CI/CD | GitHub Actions |
| Hosting | Vercel |

---

## Architecture

```
Upload flow:
  PDF → extractText() → chunkText() → embedText() → Supabase (document_chunks table)

Query flow:
  Question → embedQuery() → pgvector similarity search (match_chunks RPC)
           → top-k relevant chunks → Gemini LLM (grounded prompt) → Answer + citations
```

### Database schema

```sql
create table documents (
  id bigserial primary key,
  filename text not null,
  chunk_count int not null default 0,
  uploaded_at timestamptz default now()
);

create table document_chunks (
  id bigserial primary key,
  source_file text not null,
  chunk_text text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

create index on document_chunks using ivfflat (embedding vector_cosine_ops);
```

Retrieval uses a Postgres function (`match_chunks`) that performs cosine similarity search, with an optional `filter_source` parameter to scope results to a single document.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier) with the `vector` extension enabled
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### Setup

```bash
git clone <your-repo-url>
cd rag-agent-ui
npm install
```

Create a `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
```

Run the SQL in `schema.sql` (or the block above) in your Supabase SQL editor to set up the tables and the `match_chunks` function.

### Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Run tests

```bash
npx jest
```

### Build for production

```bash
npm run build
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/upload` | POST | Accepts a PDF file, extracts/chunks/embeds text, stores it |
| `/api/ask` | POST | Accepts `{ question, documentFilter? }`, returns `{ answer, sources }` |
| `/api/documents` | GET | Returns the list of uploaded documents |

---

## Known Limitations

- PDFs must contain a real text layer — scanned/image-based PDFs are not supported (no OCR)
- No authentication — this is a single-user personal project, not multi-tenant
- Gemini's free tier has rate limits; retry logic handles transient `503` errors but sustained high traffic may still fail

## Possible Future Enhancements

- Page-number-level citations (currently source is filename-only)
- OCR support for scanned documents
- Multi-user support with per-user document isolation
- Docker containerization for platform-agnostic deployment

---

## License

Personal project — built for learning and portfolio purposes.