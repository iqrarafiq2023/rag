
import { supabase } from '@/lib/supabase';
import { genAI } from '@/lib/gemini';
import type { EmbedContentRequest } from '@google/generative-ai';


export interface RetrievedChunk {
    source_file: string;
    chunk_text: string;
    similarity: number;
}

async function embedQuery(question: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({
        content: { role: 'user', parts: [{ text: question }] },
        outputDimensionality: 768,
    } as EmbedContentRequest & { outputDimensionality: number });
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
