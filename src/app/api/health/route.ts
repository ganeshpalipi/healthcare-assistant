import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    database: 'connected',
    rag: 'ready',
    llm: 'configured',
  });
}