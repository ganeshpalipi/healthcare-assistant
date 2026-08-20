'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { ChatHistoryEntry } from '@/types';

export function HistoryPage() {
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    try { const r = await api.getChatHistory(); setHistory(r.history || []); } catch { /* */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    try { await api.deleteChatHistory(id); toast.success('Deleted'); setHistory(history.filter(h => h.id !== id)); } catch { toast.error('Failed'); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6 text-emerald-600" /> Chat History</h1>
        <p className="text-sm text-muted-foreground">Your previous healthcare conversations</p>
      </div>

      {history.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No chat history yet. Start a conversation in AI Chat!</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {history.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                    {expanded === entry.id && (
                      <div className="mt-3 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{entry.answer.slice(0, 500)}{entry.answer.length > 500 ? '...' : ''}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>{expanded === entry.id ? 'Hide' : 'View'}</Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}