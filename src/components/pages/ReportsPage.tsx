'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export function ReportsPage() {
  const [result, setResult] = useState<null | { summary: string; extracted_info: Record<string, unknown>; explanations: string[]; disclaimer: string }>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'png', 'jpg', 'jpeg'].includes(ext || '')) return toast.error('Supported: PDF, TXT, PNG, JPG');
    setFileName(file.name);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.uploadReport(file);
      setResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setLoading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-emerald-600" /> Medical Report Analysis</h1>
        <p className="text-sm text-muted-foreground">Upload a report for AI-powered analysis</p>
      </div>

      <Card className={dragOver ? 'border-emerald-400 border-2' : ''}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <input ref={fileRef} type="file" accept=".pdf,.txt,.png,.jpg,.jpeg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {loading ? (
            <div className="space-y-3"><Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" /><p className="text-sm text-muted-foreground">Analyzing {fileName}...</p></div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><Upload className="h-8 w-8" /></div>
              <p className="font-medium">Drag & drop your report here</p>
              <p className="text-sm text-muted-foreground">PDF, TXT, PNG, JPG</p>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>Browse Files</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Analysis Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.extracted_info.filename && <p className="text-sm text-muted-foreground">File: {String(result.extracted_info.filename)}</p>}
            <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{result.summary}</ReactMarkdown></div>
            {result.explanations.length > 0 && (
              <div className="space-y-1"><p className="text-sm font-medium">Key Points:</p>
                {result.explanations.map((e, i) => <p key={i} className="text-sm text-muted-foreground">• {e}</p>)}
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg"><AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /><p className="text-xs text-amber-700 dark:text-amber-300">{result.disclaimer}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}