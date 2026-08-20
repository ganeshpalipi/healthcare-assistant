'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

const COMMON_SYMPTOMS = ['Fever', 'Cough', 'Headache', 'Sore Throat', 'Nausea', 'Fatigue', 'Dizziness', 'Rash', 'Chest Pain', 'Difficulty Breathing', 'Back Pain', 'Joint Pain', 'Stomach Pain', 'Diarrhea', 'Vomiting', 'Sneezing', 'Body Aches', 'Chills', 'Loss of Appetite', 'Blurred Vision'];

const RISK_STYLE: Record<string, string> = { low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300', moderate: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300', high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300', urgent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300' };

export function SymptomPage() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [results, setResults] = useState<null | { identified_symptoms: string[]; possible_causes: string[]; risk_level: string; warning_signs: string[]; recommended_action: string; disclaimer: string }>(null);
  const [loading, setLoading] = useState(false);

  function addSymptom(s: string) {
    const lower = s.toLowerCase();
    if (!symptoms.includes(lower)) setSymptoms([...symptoms, lower]);
  }
  function removeSymptom(s: string) { setSymptoms(symptoms.filter(x => x !== s)); }

  async function checkSymptoms() {
    if (symptoms.length === 0) return toast.error('Please add at least one symptom');
    setLoading(true);
    try {
      const res = await api.symptomCheck(symptoms);
      setResults(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Assessment failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Stethoscope className="h-6 w-6 text-emerald-600" /> Symptom Checker</h1>
        <p className="text-sm text-muted-foreground">Select your symptoms for a preliminary assessment</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Your Symptoms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {symptoms.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 px-3 py-1.5">
                  {s}
                  <button onClick={() => removeSymptom(s)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input placeholder="Add custom symptom..." value={customSymptom} onChange={e => setCustomSymptom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && customSymptom.trim()) { addSymptom(customSymptom.trim()); setCustomSymptom(''); } }} />
            <Button variant="outline" onClick={() => { if (customSymptom.trim()) { addSymptom(customSymptom.trim()); setCustomSymptom(''); } }}><Plus className="h-4 w-4" /></Button>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Common symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.filter(s => !symptoms.includes(s.toLowerCase())).slice(0, 12).map(s => (
                <button key={s} onClick={() => addSymptom(s)} className="text-xs px-2.5 py-1 rounded-full border hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">+ {s}</button>
              ))}
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={checkSymptoms} disabled={loading || symptoms.length === 0}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Check Symptoms'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <Card className={RISK_STYLE[results.risk_level] || ''}>
            <CardContent className="p-4 flex items-center gap-3">
              {results.risk_level === 'urgent' ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <ShieldCheck className="h-6 w-6" />}
              <div>
                <p className="font-semibold">Risk Level: {results.risk_level.toUpperCase()}</p>
                <p className="text-sm">{results.recommended_action}</p>
              </div>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="text-base">Possible Causes</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm">{results.possible_causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
              {results.possible_causes.length === 0 && <p className="text-sm text-muted-foreground">No specific causes identified. Consult a doctor for proper evaluation.</p>}
            </CardContent>
          </Card>

          {results.warning_signs.length > 0 && (
            <Card><CardHeader><CardTitle className="text-base">Warning Signs</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-orange-600">{results.warning_signs.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">{results.disclaimer}</p>
        </div>
      )}
    </div>
  );
}