import dotenv from 'dotenv';
import { supabase } from '@/lib/supabase';
import { genAI } from '@/lib/gemini';
dotenv.config();

export interface RetrievedChunk {
  source_file: string;
  chunk_text: string;
  similarity: number;
}

// const geminiApiKey = process.env.GEMINI_API_KEY;
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// if (!geminiApiKey || !supabaseUrl || !supabaseKey) {
//   throw new Error('Missing GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_KEY in .env');
// }

// const genAI = new GoogleGenerativeAI(geminiApiKey);
// const supabase = createClient(supabaseUrl, supabaseKey);

async function embedQuery(question: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: question }] },
  });
  return result.embedding.values;
}

export async function retrieveChunks(
  question: string,
  matchCount = 5,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(question);
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    console.error('Retrieval failed:', JSON.stringify(error, null, 2));
    return [];
  }

  return (data ?? []) as RetrievedChunk[];
}
