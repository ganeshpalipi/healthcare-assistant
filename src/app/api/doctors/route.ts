import { NextResponse } from 'next/server';

const DOCTORS = [
  { id: 'doc-1', name: 'Dr. Priya Sharma', specialty: 'General Medicine', available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], available_times: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'] },
  { id: 'doc-2', name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', available_days: ['Monday', 'Wednesday', 'Friday'], available_times: ['10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00'] },
  { id: 'doc-3', name: 'Dr. Anita Desai', specialty: 'Dermatology', available_days: ['Tuesday', 'Thursday', 'Saturday'], available_times: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00'] },
  { id: 'doc-4', name: 'Dr. Vikram Patel', specialty: 'Orthopedics', available_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], available_times: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
  { id: 'doc-5', name: 'Dr. Neha Gupta', specialty: 'Pediatrics', available_days: ['Monday', 'Wednesday', 'Thursday', 'Saturday'], available_times: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30'] },
  { id: 'doc-6', name: 'Dr. Arun Mehta', specialty: 'ENT', available_days: ['Tuesday', 'Wednesday', 'Friday'], available_times: ['10:00', '11:00', '14:00', '15:00', '16:00'] },
];

export async function GET() {
  return NextResponse.json({ doctors: DOCTORS, note: 'Demo data for demonstration purposes.' });
}
