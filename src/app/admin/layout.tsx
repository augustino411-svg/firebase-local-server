
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { permission, loading: authLoading } = useAuth();
  const router = useRouter();

  // Explicitly check for 'admin' or 'superadmin' which I assume is a valid role.
  // The logic seems correct, but I'll ensure it's here.
  const hasAccess = permission?.role === 'admin' || permission?.role === 'superadmin';

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      // If loading is done and user does not have access, redirect.
      router.push('/');
    }
  }, [permission, authLoading, hasAccess, router]);

  if (authLoading || !hasAccess) {
    // Show a loading/verification screen while checking or if access is denied.
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>正在驗證管理者權限...</p>
        </div>
      </AppLayout>
    );
  }
  
  // If checks pass, render the children within the layout.
  return (
      <AppLayout>
          {children}
      </AppLayout>
  );
}
