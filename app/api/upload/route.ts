import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/src/rag/extract';
import { chunkText } from '@/src/rag/chunk';
import { embedText } from '@/src/rag/embed';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await extractText(buffer);
    const chunks = chunkText(text);

    let stored = 0;
    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      const { error } = await supabase.from('document_chunks').insert({
        source_file: file.name,
        chunk_text: chunk,
        embedding,
      });

      if (error) {
        throw new Error(`Failed to store document chunk: ${error.message}`);
      }

      stored++;
    }

    const { error: docError } = await supabase.from('documents').insert({
      filename: file.name,
      chunk_count: stored,
    });

    if (docError) {
      console.error('Failed to record document:', docError.message);
      // don't fail the whole request over this — chunks are already stored successfully
    }

    return NextResponse.json({
      message: 'Upload processed',
      chunksStored: stored,
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    const message = error instanceof Error ? error.message : 'Upload processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}