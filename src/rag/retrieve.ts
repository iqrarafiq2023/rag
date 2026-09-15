
import { supabase } from '@/lib/supabase';
import { genAI } from '@/lib/gemini';
import type { EmbedContentRequest } from '@google/generative-ai';


export interface RetrievedChunk {
    source_file: string;
    chunk_text: string;
    similarity: number;
}

// async function embedQuery(question: string): Promise<number[]> {
//     const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
//     const result = await model.embedContent({
//         content: { role: 'user', parts: [{ text: question }] },
//         outputDimensionality: 768,
//     } as EmbedContentRequest & { outputDimensionality: number });
//     return result.embedding.values;
// }

async function embedQuery(question: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-embedding-001',
    });

    const result = await model.embedContent({
        content: {
            role: 'user',
            parts: [{ text: question }],
        },
        outputDimensionality: 768,
    } as EmbedContentRequest & { outputDimensionality: number });

    const embedding = result.embedding.values;

    console.log('QUERY EMBEDDING DIMENSIONS:', embedding.length);

    return embedding;
}

export async function retrieveChunks(
    question: string,
    matchCount = 5,
): Promise<RetrievedChunk[]> {
    const queryEmbedding = await embedQuery(question);
    console.log('QUERY VECTOR LENGTH:', queryEmbedding.length);
    const { data, error } = await supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_count: matchCount,
    });
    console.log('Retrieved chunks:', data);
    console.log('Retrieved chunks error:', error);

    if (error) {
        console.error('Retrieval failed:', JSON.stringify(error, null, 2));
        return [];
    }

    return (data ?? []) as RetrievedChunk[];
}
