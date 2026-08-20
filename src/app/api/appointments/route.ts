import { NextRequest, NextResponse } from 'next/server';

interface Appointment { id: string; doctor: Record<string, unknown>; date: string; time: string; reason: string; status: string; user_id: string; created_at: string; }
function getAppts(): Appointment[] { if (typeof globalThis._appointments === 'undefined') globalThis._appointments = []; return globalThis._appointments as Appointment[]; }

const DOCTORS: Record<string, Record<string, unknown>> = {
  'doc-1': { id: 'doc-1', name: 'Dr. Priya Sharma', specialty: 'General Medicine', available_days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], available_times: ['09:00','10:00','11:00','14:00','15:00','16:00'] },
  'doc-2': { id: 'doc-2', name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', available_days: ['Monday','Wednesday','Friday'], available_times: ['10:00','11:00','15:00','16:00'] },
  'doc-3': { id: 'doc-3', name: 'Dr. Anita Desai', specialty: 'Dermatology', available_days: ['Tuesday','Thursday','Saturday'], available_times: ['09:00','10:00','14:00'] },
  'doc-4': { id: 'doc-4', name: 'Dr. Vikram Patel', specialty: 'Orthopedics', available_days: ['Monday','Tuesday','Thursday','Friday'], available_times: ['09:00','11:00','14:00','15:00'] },
  'doc-5': { id: 'doc-5', name: 'Dr. Neha Gupta', specialty: 'Pediatrics', available_days: ['Monday','Wednesday','Thursday','Saturday'], available_times: ['09:00','10:00','14:00'] },
  'doc-6': { id: 'doc-6', name: 'Dr. Arun Mehta', specialty: 'ENT', available_days: ['Tuesday','Wednesday','Friday'], available_times: ['10:00','14:00','15:00','16:00'] },
};

export async function GET() {
  return NextResponse.json({ appointments: getAppts() });
}

export async function POST(req: NextRequest) {
  const { doctor_id, date, time, reason } = await req.json();
  if (!doctor_id || !date || !time) return NextResponse.json({ detail: 'Missing fields' }, { status: 400 });
  const doctor = DOCTORS[doctor_id];
  if (!doctor) return NextResponse.json({ detail: 'Doctor not found' }, { status: 404 });
  const appt: Appointment = { id: `appt-${Date.now()}`, doctor, date, time, reason: reason || 'General consultation', status: 'scheduled', user_id: 'user-1', created_at: new Date().toISOString() };
  getAppts().push(appt);
  return NextResponse.json(appt, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const data = await req.json();
  const appts = getAppts();
  const idx = appts.findIndex(a => a.id === id);
  if (idx === -1) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  Object.assign(appts[idx], data);
  return NextResponse.json(appts[idx]);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const appts = getAppts();
  const idx = appts.findIndex(a => a.id === id);
  if (idx === -1) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  appts.splice(idx, 1);
  return NextResponse.json({ message: 'Appointment cancelled.' });
}
