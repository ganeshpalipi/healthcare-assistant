'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertTriangle, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'I have been having a persistent headache for two days',
  'What are the common symptoms of flu?',
  'How can I manage mild fever at home?',
  'Tell me about diabetes management',
];

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function ChatPage() {
  const { chatMessages, addChatMessage, isChatLoading, setChatLoading } = useAppStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isChatLoading) return;
    setInput('');
    addChatMessage({ id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() });
    setChatLoading(true);
    try {
      const res = await api.chat(msg);
      addChatMessage({
        id: `a-${Date.now()}`, role: 'assistant', content: res.answer,
        timestamp: new Date().toISOString(), sources: res.sources, risk_level: res.risk_level, disclaimer: res.disclaimer,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to get response');
      setChatLoading(false);
    }
    setChatLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          AI Health Chat
        </h1>
        <p className="text-sm text-muted-foreground">Ask health questions in natural language</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Ask me about symptoms, health conditions, medicines, or general health topics.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="text-left text-sm p-3 rounded-lg border hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:text-foreground">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                    {msg.role === 'assistant' && msg.risk_level && (
                      <Badge variant="outline" className={RISK_COLORS[msg.risk_level] || ''}>
                        {msg.risk_level === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        Risk: {msg.risk_level}
                      </Badge>
                    )}
                    {msg.role === 'assistant' && msg.sources?.length > 0 && (
                      <div className="text-xs text-muted-foreground">Sources: {msg.sources.join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-4 w-4" /></div>
                  <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-emerald-600" /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {chatMessages.length > 0 && (
          <div className="border-t px-4 py-2 bg-muted/30">
            <p className="text-[11px] text-muted-foreground text-center">
              AI-generated response for educational purposes only. Not medical advice. Consult a healthcare provider.
            </p>
          </div>
        )}

        <div className="border-t p-3">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your health question..." className="min-h-[44px] max-h-32 resize-none" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 shrink-0" disabled={!input.trim() || isChatLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}