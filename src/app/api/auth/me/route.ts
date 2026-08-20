import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  try {
    const payload = JSON.parse(Buffer.from(auth.split(' ')[1], 'base64').toString());
    return NextResponse.json({ id: payload.sub, username: payload.username, email: payload.email });
  } catch {
    return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
  }
}
