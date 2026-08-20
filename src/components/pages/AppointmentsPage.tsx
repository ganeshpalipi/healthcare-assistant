'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Loader2, Trash2, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Doctor, Appointment } from '@/types';

export function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [tab, setTab] = useState<'book' | 'list'>('book');
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [d, a] = await Promise.all([api.getDoctors(), api.getAppointments()]);
      setDoctors(d.doctors || []);
      setAppointments(a.appointments || []);
    } catch { /* silent */ }
  }

  useEffect(() => { loadData(); }, []);

  async function book() {
    if (!selected || !date || !time) return toast.error('Please select doctor, date, and time');
    setLoading(true);
    try {
      await api.createAppointment({ doctor_id: selected, date, time, reason: reason || 'General consultation' });
      toast.success('Appointment booked!');
      setDate(''); setTime(''); setReason(''); setSelected('');
      await loadData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Booking failed'); }
    finally { setLoading(false); }
  }

  async function cancel(id: string) {
    try { await api.deleteAppointment(id); toast.success('Cancelled'); await loadData(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Cancel failed'); }
  }

  const doc = doctors.find(d => d.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-6 w-6 text-emerald-600" /> Appointments</h1>
        <p className="text-sm text-muted-foreground">Book and manage doctor appointments</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'book' ? 'default' : 'outline'} className={tab === 'book' ? 'bg-emerald-600' : ''} onClick={() => setTab('book')}>Book Appointment</Button>
        <Button variant={tab === 'list' ? 'default' : 'outline'} className={tab === 'list' ? 'bg-emerald-600' : ''} onClick={() => setTab('list')}>My Appointments ({appointments.length})</Button>
      </div>

      {tab === 'book' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Select a Doctor</CardTitle><CardDescription>Demo data for demonstration</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctors.map(d => (
                <button key={d.id} onClick={() => setSelected(d.id)} className={`text-left p-4 rounded-lg border-2 transition-colors ${selected === d.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent hover:border-muted-foreground/20'}`}>
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{d.available_days.join(', ')}</p>
                </button>
              ))}
            </div>
            {doc && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-sm font-medium">Date</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" /></div>
                  <div><label className="text-sm font-medium">Time</label>
                    <select value={time} onChange={e => setTime(e.target.value)} className="mt-1 w-full h-9 rounded-md border bg-transparent px-3 text-sm">
                      <option value="">Select time</option>
                      {doc.available_times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className="text-sm font-medium">Reason</label><Input placeholder="Consultation reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-1" /></div>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={book} disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</> : 'Book Appointment'}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'list' && (
        appointments.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">No appointments yet. Book your first appointment!</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <Card key={appt.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600"><MapPin className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-sm">{appt.doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{appt.doctor.specialty}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{appt.date} at {appt.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={appt.status === 'scheduled' ? 'default' : 'secondary'}>{appt.status}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => cancel(appt.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}