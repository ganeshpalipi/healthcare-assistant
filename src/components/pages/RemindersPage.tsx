'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Reminder } from '@/types';

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medicine_name: '', dosage: '', time: '', date: '', frequency: 'daily' });
  const [loading, setLoading] = useState(false);

  async function load() {
    try { const r = await api.getReminders(); setReminders(r.reminders || []); } catch { /* */ }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.medicine_name || !form.dosage || !form.time) return toast.error('Fill required fields');
    setLoading(true);
    try {
      await api.createReminder(form);
      toast.success('Reminder created!');
      setForm({ medicine_name: '', dosage: '', time: '', date: '', frequency: 'daily' });
      setShowForm(false); await load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function toggle(id: string, active: boolean) {
    try { await api.updateReminder(id, { active: !active }); await load(); }
    catch { toast.error('Update failed'); }
  }

  async function remove(id: string) {
    try { await api.deleteReminder(id); toast.success('Deleted'); await load(); }
    catch { toast.error('Delete failed'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-emerald-600" /> Medication Reminders</h1>
          <p className="text-sm text-muted-foreground">Manage your medication schedule</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />{showForm ? 'Cancel' : 'Add Reminder'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Reminder</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Medicine Name *</label><Input value={form.medicine_name} onChange={e => setForm({ ...form, medicine_name: e.target.value })} className="mt-1" placeholder="e.g. Paracetamol" /></div>
              <div><label className="text-sm font-medium">Dosage *</label><Input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="mt-1" placeholder="e.g. 500mg" /></div>
              <div><label className="text-sm font-medium">Time *</label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium">Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="mt-1 w-full h-9 rounded-md border bg-transparent px-3 text-sm">
                  <option value="daily">Daily</option><option value="twice daily">Twice Daily</option><option value="weekly">Weekly</option><option value="as needed">As Needed</option>
                </select>
              </div>
            </div>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={create} disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Reminder'}</Button>
          </CardContent>
        </Card>
      )}

      {reminders.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Bell className="h-10 w-10 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No reminders yet. Create your first medication reminder!</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reminders.map(r => (
            <Card key={r.id} className={r.active ? '' : 'opacity-60'}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${r.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}><Bell className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium text-sm">{r.medicine_name}</p>
                    <p className="text-xs text-muted-foreground">{r.dosage} · {r.time} · {r.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.active ? 'default' : 'secondary'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                  <button onClick={() => toggle(r.id, r.active)} className="p-1">{r.active ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}