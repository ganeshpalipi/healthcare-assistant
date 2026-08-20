'use client';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Calendar, Shield } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAppStore();
  const items = [
    { icon: User, label: 'Username', value: user?.username || 'N/A' },
    { icon: Mail, label: 'Email', value: user?.email || 'N/A' },
    { icon: Calendar, label: 'Joined', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A' },
    { icon: Shield, label: 'Account Type', value: 'Standard User' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6 text-emerald-600" /> Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 text-2xl font-bold">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
            <div><CardTitle>{user?.username || 'User'}</CardTitle><p className="text-sm text-muted-foreground">{user?.email}</p></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}