'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Loader2, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export function MedicinesPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<null | { medicine: string; information: string; disclaimer: string; source: string }>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return toast.error('Enter a medicine name');
    setLoading(true); setResult(null);
    try {
      const res = await api.getMedicines(query);
      setResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Pill className="h-6 w-6 text-emerald-600" /> Medicine Information</h1>
        <p className="text-sm text-muted-foreground">Search for general educational medicine information</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Paracetamol, Ibuprofen, Metformin..." className="pl-10" onKeyDown={e => e.key === 'Enter' && search()} />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={search} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{result.medicine}</CardTitle>
              <span className="text-xs text-muted-foreground">{result.source}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{result.information}</ReactMarkdown></div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg"><AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /><p className="text-xs text-amber-700 dark:text-amber-300">{result.disclaimer}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}