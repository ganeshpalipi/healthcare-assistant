import { NextResponse } from 'next/server';

interface ChatEntry { id: string; question: string; answer: string; timestamp: string; sources: string[]; }
function getHistory(): ChatEntry[] { return (globalThis._chatHistory as ChatEntry[]) || []; }

export async function GET() {
  return NextResponse.json({ history: getHistory() });
}