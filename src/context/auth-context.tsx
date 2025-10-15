'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { UserWithRole } from '@/types'
import { signInWithForm } from '@/lib/data-client'
import { useToast } from '@/hooks/use-toast'

const AUTH_STORAGE_KEY = 'campus-nexus-auth'

interface AuthContextType {
  permission: UserWithRole | null
  loading: boolean
  manualSignIn: (email: string, password: string) => Promise<void>
  manualSignOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  permission: null,
  loading: true,
  manualSignIn: async () => {},
  manualSignOut: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE

  // 初次載入：從 sessionStorage 或 API 取得使用者
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          setPermission(JSON.parse(stored))
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setPermission(data.user)
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user))
          }
        }
      } catch (error) {
        console.error('Auth restore failed:', error)
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        setPermission(null)
      } finally {
        setLoading(false)
      }
    }

    restoreAuth()
  }, [API_BASE])

  // 權限導向邏輯
  useEffect(() => {
    if (loading) return

    const isAuthPage = pathname === '/login'
    const isProtectedPage = !isAuthPage

    if (!permission && isProtectedPage) {
      router.push('/login')
    } else if (permission && isAuthPage) {
      router.push('/')
    }
  }, [permission, loading, pathname, router])

  const manualSignIn = useCallback(
    async (email: string, password: string) => {
      try {
        const userPermission = await signInWithForm(email, password)

        // 特殊帳號提升權限
        if (
          userPermission?.email === 'augustino411@gmail.com' ||
          userPermission?.email === '03210@cyvs.edu.tyc.tw'
        ) {
          userPermission.role = 'admin'
        }

        setPermission(userPermission)
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userPermission))
        router.push('/')
      } catch (error) {
        toast({
          title: '登入失敗',
          description: (error as Error).message,
        })
      }
    },
    [router, toast]
  )

  const manualSignOut = useCallback(() => {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setPermission(null)
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      router.push('/login')
      toast({ title: '已成功登出' })
    })
  }, [router, toast, API_BASE])

  return (
    <AuthContext.Provider
      value={{ permission, loading, manualSignIn, manualSignOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)