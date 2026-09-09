import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { genAI } from '@/lib/gemini';
dotenv.config();

// const geminiApiKey = process.env.GEMINI_API_KEY;
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// if (!geminiApiKey || !supabaseUrl || !supabaseKey) {
//   throw new Error('Missing GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_KEY in .env');
// }

// const genAI = new GoogleGenerativeAI(geminiApiKey);
// const supabase = createClient(supabaseUrl, supabaseKey);

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
  });
  return result.embedding.values;
}

export async function storeChunks(chunks: string[], sourceFile: string): Promise<void> {
  for (const chunk of chunks) {
    const embedding = await embedText(chunk);

    const { error } = await supabase.from('document_chunks').insert({
      source_file: sourceFile,
      chunk_text: chunk,
      embedding,
    });

    if (error) console.error('Insert failed:', error.message);
    else console.log('Stored chunk, length:', chunk.length);
  }
}
