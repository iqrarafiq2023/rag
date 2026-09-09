
import { supabase } from '@/lib/supabase';
import { genAI } from '@/lib/gemini';

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: 768,
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
