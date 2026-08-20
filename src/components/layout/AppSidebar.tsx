'use client';

import { useTheme } from 'next-themes';
import { useAuthStore, useAppStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, MessageSquare, Stethoscope, FileText, Pill,
  CalendarDays, Bell, History, User, Settings, LogOut,
  Moon, Sun, Heart, Menu, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import type { PageType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: PageType;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: MessageSquare, label: 'AI Chat', page: 'chat' },
  { icon: Stethoscope, label: 'Symptom Checker', page: 'symptom-checker' },
  { icon: FileText, label: 'Reports', page: 'reports' },
  { icon: Pill, label: 'Medicines', page: 'medicines' },
  { icon: CalendarDays, label: 'Appointments', page: 'appointments' },
  { icon: Bell, label: 'Reminders', page: 'reminders' },
  { icon: History, label: 'Chat History', page: 'chat-history' },
  { icon: User, label: 'Profile', page: 'profile' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useAppStore();
  const isMobile = useIsMobile();

  const handleNav = (page: PageType) => {
    setCurrentPage(page);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('landing');
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Heart className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight">MedAssist</span>
          <span className="text-[10px] text-muted-foreground">Healthcare Assistant</span>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3 space-y-1.5">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </Button>

        {user && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile === false && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 self-start mt-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>
      )}

      {isMobile === true && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {isMobile === true && sidebarOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </AnimatePresence>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
            animate={{ x: 0, width: 280, opacity: 1 }}
            exit={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`shrink-0 h-full overflow-hidden border-r border-sidebar-border bg-sidebar ${
              isMobile ? 'fixed top-0 left-0 z-40' : ''
            }`}
            role="navigation"
            aria-label="Sidebar navigation"
          >
            <div className="w-[280px] h-full">{sidebarContent}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
