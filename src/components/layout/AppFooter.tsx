'use client';

import { Heart, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function AppFooter() {
  return (
    <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <Separator className="mb-3" />
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span>MedAssist Healthcare Assistant</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>This is not a substitute for professional medical advice. Always consult a qualified healthcare provider.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
