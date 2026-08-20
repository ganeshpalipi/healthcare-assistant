import { NextRequest, NextResponse } from 'next/server';

interface StoreUser { id: string; username: string; email: string; password: string; created_at: string; }

function getUsers(): StoreUser[] {
  if (typeof globalThis._users === 'undefined') globalThis._users = [];
  return globalThis._users as StoreUser[];
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) return NextResponse.json({ detail: 'All fields required' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ detail: 'Password must be at least 8 characters' }, { status: 400 });
    const users = getUsers();
    if (users.find(u => u.email === email)) return NextResponse.json({ detail: 'Email already registered' }, { status: 409 });
    const user: StoreUser = { id: `user-${Date.now()}`, username, email, password, created_at: new Date().toISOString() };
    users.push(user);
    const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, username: user.username })).toString('base64');
    const { password: _, ...safe } = user;
    return NextResponse.json({ access_token: token, token_type: 'bearer', user: safe });
  } catch (e: unknown) {
    return NextResponse.json({ detail: 'Registration failed' }, { status: 500 });
  }
}