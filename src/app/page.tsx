'use client';
import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { LandingPage } from '@/components/pages/LandingPage';
import { LoginPage } from '@/components/pages/LoginPage';
import { RegisterPage } from '@/components/pages/RegisterPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { ChatPage } from '@/components/pages/ChatPage';
import { SymptomPage } from '@/components/pages/SymptomPage';
import { ReportsPage } from '@/components/pages/ReportsPage';
import { MedicinesPage } from '@/components/pages/MedicinesPage';
import { AppointmentsPage } from '@/components/pages/AppointmentsPage';
import { RemindersPage } from '@/components/pages/RemindersPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { SettingsPage } from '@/components/pages/SettingsPage';

function AppContent() {
  const { currentPage, isAuthenticated, initAuth } = useAppStore();

  useEffect(() => { initAuth(); }, []);

  // Auth pages (no sidebar)
  if (!isAuthenticated) {
    switch (currentPage) {
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      default: return <LandingPage />;
    }
  }

  // Main app with sidebar
  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    chat: <ChatPage />,
    symptoms: <SymptomPage />,
    reports: <ReportsPage />,
    medicines: <MedicinesPage />,
    appointments: <AppointmentsPage />,
    reminders: <RemindersPage />,
    history: <HistoryPage />,
    profile: <ProfilePage />,
    settings: <SettingsPage />,
  };

  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 lg:px-6'>
          <MobileNav />
          <div className='flex-1' />
          <div className='flex items-center gap-2 text-sm'>
            <span className='hidden sm:inline text-muted-foreground'>{useAppStore.getState().user?.username}</span>
            <div className='h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 text-xs font-bold'>
              {useAppStore.getState().user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className='flex-1 p-4 lg:p-6'>{pages[currentPage] || <DashboardPage />}</main>
        <footer className='border-t py-3 px-4 text-center text-xs text-muted-foreground bg-muted/30'>
          <p>HealthAssist AI — B.Tech CSE/AIML Academic Project · Not a replacement for professional medical advice</p>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
      <AppContent />
      <Toaster richColors position='top-right' />
    </ThemeProvider>
  );
}