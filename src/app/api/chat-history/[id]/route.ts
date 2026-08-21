import { NextRequest, NextResponse } from 'next/server';

interface ChatEntry { id: string; question: string; answer: string; timestamp: string; sources: string[]; }
function getHistory(): ChatEntry[] { return (globalThis._chatHistory as ChatEntry[]) || []; }

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = getHistory();
    const idx = history.findIndex(h => h.id === id);
    if (idx === -1) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    history.splice(idx, 1);
    return NextResponse.json({ message: 'Entry deleted.' });
  } catch {
    return NextResponse.json({ detail: 'Delete failed' }, { status: 500 });
  }
}