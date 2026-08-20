'use client';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Moon, Sun, Shield, Heart, Brain } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { clearAuth } = useAppStore();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold flex items-center gap-2'><Settings className='h-6 w-6 text-emerald-600' /> Settings</h1>
        <p className='text-sm text-muted-foreground'>Application preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle className='text-base'>Appearance</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {theme === 'dark' ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
              <div><Label>Dark Mode</Label><p className='text-xs text-muted-foreground'>Toggle between light and dark themes</p></div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className='text-base'>About</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-3 rounded-lg bg-muted/50'><div><p className='text-sm font-medium'>HealthAssist AI</p><p className='text-xs text-muted-foreground'>Version 1.0.0</p></div><Badge>Stable</Badge></div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='p-3 rounded-lg bg-muted/50 text-center'><Heart className='h-5 w-5 mx-auto mb-1 text-emerald-600' /><p className='text-xs font-medium'>Healthcare</p><p className='text-[11px] text-muted-foreground'>AI-Powered Assistant</p></div>
            <div className='p-3 rounded-lg bg-muted/50 text-center'><Brain className='h-5 w-5 mx-auto mb-1 text-emerald-600' /><p className='text-xs font-medium'>NLP & RAG</p><p className='text-[11px] text-muted-foreground'>Medical Understanding</p></div>
          </div>
          <div className='p-3 rounded-lg bg-muted/50'><p className='text-sm font-medium flex items-center gap-2'><Shield className='h-4 w-4' /> Safety First</p><p className='text-xs text-muted-foreground mt-1'>This system provides general educational information only. It does NOT diagnose, prescribe, or replace professional medical advice. Always consult qualified healthcare providers.</p></div>
          <div className='p-3 rounded-lg bg-muted/50'><p className='text-sm font-medium'>Tech Stack</p><p className='text-xs text-muted-foreground mt-1'>Next.js, Python FastAPI, LangChain, FAISS, BioBERT, OpenAI GPT, MongoDB Atlas</p></div>
        </CardContent>
      </Card>

      <Card className='border-destructive/30'>
        <CardHeader><CardTitle className='text-base text-destructive'>Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-3'>Sign out of your account.</p>
          <Button variant='destructive' onClick={clearAuth}>Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}