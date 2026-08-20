import { NextRequest, NextResponse } from 'next/server';

interface StoreUser { id: string; username: string; email: string; password: string; }

function getUsers(): StoreUser[] {
  if (typeof globalThis._users === 'undefined') globalThis._users = [];
  return globalThis._users as StoreUser[];
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ detail: 'Email and password required' }, { status: 400 });
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || user.password !== password) return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, username: user.username })).toString('base64');
    return NextResponse.json({ access_token: token, token_type: 'bearer', user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    return NextResponse.json({ detail: 'Login failed' }, { status: 500 });
  }
}