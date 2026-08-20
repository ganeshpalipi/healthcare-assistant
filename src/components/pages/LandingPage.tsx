'use client';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageSquare, Stethoscope, Shield, Brain, FileText } from 'lucide-react';

export function LandingPage() {
  const { setCurrentPage } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Heart className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">HealthAssist AI</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCurrentPage('login')}>Sign In</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentPage('register')}>Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Shield className="h-3.5 w-3.5" />
              AI-Powered Healthcare Assistant
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Your Intelligent{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Healthcare</span>{' '}
              Companion
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ask health questions in natural language, get AI-powered preliminary assessments, analyze medical reports, and manage your healthcare needs — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8" onClick={() => setCurrentPage('register')}>
                Start Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => setCurrentPage('login')}>
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Powered by Advanced AI</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'Natural language healthcare conversations with RAG-enhanced responses' },
              { icon: Stethoscope, title: 'Symptom Assessment', desc: 'Preliminary symptom analysis with risk level evaluation' },
              { icon: Brain, title: 'Medical NLP', desc: 'Extracts symptoms, diseases, and medical entities automatically' },
              { icon: FileText, title: 'Report Analysis', desc: 'Upload medical reports for AI-powered summaries and explanations' },
              { icon: Shield, title: 'Safety First', desc: 'Emergency detection and healthcare disclaimers on every response' },
              { icon: Heart, title: 'Medicine Info', desc: 'General educational information about common medications' },
            ].map((f, i) => (
              <Card key={i} className="border-emerald-100 dark:border-emerald-900 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 border-t">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              ⚠️ This system is NOT a replacement for a doctor. It provides general educational information only.
              Always consult a qualified healthcare professional for medical advice, diagnosis, and treatment.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HealthAssist AI — B.Tech CSE/AIML Academic Project</p>
          <p className="mt-1">Built with Next.js, Python FastAPI, LangChain, and Generative AI</p>
        </div>
      </footer>
    </div>
  );
}