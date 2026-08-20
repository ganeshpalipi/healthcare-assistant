'use client';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { PageKey } from '@/types';
import { useState } from 'react';
import {
  LayoutDashboard, MessageSquare, Stethoscope, FileText, Pill, CalendarDays, Bell, History, User, Settings, LogOut, Menu, Heart, Moon, Sun, X
} from 'lucide-react';

const NAV: { key: PageKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'chat', label: 'AI Chat', icon: MessageSquare },
  { key: 'symptoms', label: 'Symptom Checker', icon: Stethoscope },
  { key: 'reports', label: 'Medical Reports', icon: FileText },
  { key: 'medicines', label: 'Medicine Info', icon: Pill },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays },
  { key: 'reminders', label: 'Reminders', icon: Bell },
  { key: 'history', label: 'Chat History', icon: History },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setCurrentPage, user, clearAuth } = useAppStore();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Heart className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">HealthAssist AI</h1>
          <p className="text-[11px] text-muted-foreground">Healthcare Assistant</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={currentPage === key ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 px-3 h-9 text-sm font-normal',
                currentPage === key && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium'
              )}
              onClick={() => { setCurrentPage(key); onNavigate?.(); }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="px-3 py-3 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3 text-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3 text-sm text-destructive hover:text-destructive" onClick={clearAuth}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
      <NavContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}