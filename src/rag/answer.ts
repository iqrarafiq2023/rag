import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveChunks, type RetrievedChunk } from './retrieve';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('Missing GEMINI_API_KEY in .env');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

export interface AnswerSource {
  ref: number;
  source_file: string;
  similarity: number;
}

export interface AnswerResult {
  answer: string;
  sources: AnswerSource[];
}

function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] (source: ${c.source_file})\n${c.chunk_text}`)
    .join('\n\n---\n\n');

  return `You are a helpful assistant answering questions based ONLY on the context below. 
Do not use any outside knowledge. If the answer isn't in the context, say "I don't have enough information to answer that."

When you use information from a chunk, cite it using its number like [1], [2], etc.

Context:
${context}

Question: ${question}

Answer (with citations):`;
}

export async function askQuestion(question: string): Promise<AnswerResult> {
  const chunks = await retrieveChunks(question);

  if (chunks.length === 0) {
    return { answer: "I don't have enough information to answer that.", sources: [] };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
  const prompt = buildPrompt(question, chunks);
console.log('Prompt sent to model:', prompt);
  const result = await model.generateContent(prompt);
  const answer = result.response.text();
console.log('Model response:', answer);
  const sources = chunks.map((c, i) => ({
    ref: i + 1,
    source_file: c.source_file,
    similarity: c.similarity,
  }));

  return { answer, sources };
}
