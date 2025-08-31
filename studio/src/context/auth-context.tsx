
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserWithRole } from '@/types';
import { signInWithForm } from '@/lib/data-client';
import { useToast } from '@/hooks/use-toast';

const AUTH_STORAGE_KEY = 'campus-nexus-auth';

interface AuthContextType {
  permission: UserWithRole | null;
  loading: boolean;
  manualSignIn: (email: string, password: string) => Promise<void>;
  manualSignOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  permission: null,
  loading: true,
  manualSignIn: async () => {},
  manualSignOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        setPermission(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error("Failed to parse stored auth state:", error);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';
    const isProtectedPage = !isAuthPage;

    if (!permission && isProtectedPage) {
      router.push('/login');
    } else if (permission && isAuthPage) {
      router.push('/');
    }
  }, [permission, loading, pathname, router]);

  const manualSignIn = useCallback(async (email: string, password: string) => {
    const userPermission = await signInWithForm(email, password);
    // Add a superadmin check for the special user
    if (userPermission?.email === 'augustino411@gmail.com' || userPermission?.email === '03210@cyvs.edu.tyc.tw') {
        userPermission.role = 'admin';
    }
    setPermission(userPermission);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userPermission));
    router.push('/');
  }, [router]);

  const manualSignOut = useCallback(() => {
    setPermission(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
    toast({ title: '已成功登出' });
  }, [router, toast]);

  return (
    <AuthContext.Provider value={{ permission, loading, manualSignIn, manualSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
