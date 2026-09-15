import { NextRequest, NextResponse } from 'next/server';
import { askQuestion } from '@/src/rag/answer';

export const runtime = 'nodejs';

interface AskRequest {
  question?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    // const body = (await req.json()) as AskRequest;
 const { question, documentFilter } = await req.json();

  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

    // if (typeof body.question !== 'string' || !body.question.trim()) {
    //   return NextResponse.json(
    //     { error: 'A question is required' },
    //     { status: 400 },
    //   );
    // }

    const result = await askQuestion(question, documentFilter);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Question failed:', error);
    const message = error instanceof Error ? error.message : 'Question processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
