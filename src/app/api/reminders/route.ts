import { NextRequest, NextResponse } from 'next/server';

interface Reminder { id: string; medicine_name: string; dosage: string; time: string; date: string; frequency: string; active: boolean; user_id: string; created_at: string; }
function getRems(): Reminder[] { if (typeof globalThis._reminders === 'undefined') globalThis._reminders = []; return globalThis._reminders as Reminder[]; }

export async function GET() { return NextResponse.json({ reminders: getRems() }); }

export async function POST(req: NextRequest) {
  const { medicine_name, dosage, time, date, frequency } = await req.json();
  if (!medicine_name || !dosage || !time) return NextResponse.json({ detail: 'Missing fields' }, { status: 400 });
  const rem: Reminder = { id: `rem-${Date.now()}`, medicine_name, dosage, time, date: date || new Date().toISOString().split('T')[0], frequency: frequency || 'daily', active: true, user_id: 'user-1', created_at: new Date().toISOString() };
  getRems().push(rem);
  return NextResponse.json(rem, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const data = await req.json();
  const rems = getRems();
  const idx = rems.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  Object.assign(rems[idx], data);
  return NextResponse.json(rems[idx]);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const rems = getRems();
  const idx = rems.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  rems.splice(idx, 1);
  return NextResponse.json({ message: 'Reminder deleted.' });
}