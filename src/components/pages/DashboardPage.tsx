'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Stethoscope, CalendarDays, Bell, FileText, Activity } from 'lucide-react';
import type { Appointment, Reminder } from '@/types';

export function DashboardPage() {
  const { setCurrentPage, user, chatMessages } = useAppStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [apts, rems] = await Promise.all([api.getAppointments(), api.getReminders()]);
        setAppointments(apts.appointments || []);
        setReminders(rems.reminders || []);
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const stats = [
    { label: 'Chat Sessions', value: chatMessages.length > 0 ? Math.ceil(chatMessages.length / 2) : 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950' },
    { label: 'Appointments', value: appointments.filter(a => a.status === 'scheduled').length, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
    { label: 'Active Reminders', value: reminders.filter(r => r.active).length, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' },
    { label: 'Reports', value: 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950' },
  ];

  const quickActions = [
    { label: 'Ask AI Doctor', icon: MessageSquare, page: 'chat' as const, desc: 'Get AI-powered health information' },
    { label: 'Check Symptoms', icon: Stethoscope, page: 'symptoms' as const, desc: 'Preliminary symptom assessment' },
    { label: 'Book Appointment', icon: CalendarDays, page: 'appointments' as const, desc: 'Schedule with a doctor' },
    { label: 'Set Reminder', icon: Bell, page: 'reminders' as const, desc: 'Medication reminders' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.username || 'User'}</h1>
        <p className="text-muted-foreground">Here&apos;s your healthcare dashboard overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-6" /> : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Card key={a.label} className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 dark:border-emerald-900" onClick={() => setCurrentPage(a.page)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium text-sm">{a.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {appointments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.filter(a => a.status === 'scheduled').slice(0, 3).map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{appt.doctor.name}</p>
                  <p className="text-xs text-muted-foreground">{appt.doctor.specialty} · {appt.date} at {appt.time}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage('appointments')}>View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Medication Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.filter(r => r.active).slice(0, 3).map(rem => (
              <div key={rem.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{rem.medicine_name}</p>
                  <p className="text-xs text-muted-foreground">{rem.dosage} · {rem.time} · {rem.frequency}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage('reminders')}>View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}