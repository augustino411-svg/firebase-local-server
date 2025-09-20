'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import type {
  Student,
  AttendanceRecord,
  CounselingRecord,
  UserWithRole,
} from '@/types'
import { useAuth } from '@/context/auth-context'
import {
  getStudents,
  getClasses,
  getAllAttendance,
  getAllCounselingRecords,
  getUsers,
} from '@/lib/data-client'
import { useToast } from '@/hooks/use-toast'

interface DataContextType {
  students: Student[]
  classes: string[]
  attendanceRecords: AttendanceRecord[]
  counselingRecords: CounselingRecord[]
  users: UserWithRole[]
  loading: boolean
  refetchData: () => Promise<void>
}

const DataContext = createContext<DataContextType>({
  students: [],
  classes: [],
  attendanceRecords: [],
  counselingRecords: [],
  users: [],
  loading: true,
  refetchData: async () => {},
})

export function DataProvider({ children }: { children: ReactNode }) {
  const { permission, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [counselingRecords, setCounselingRecords] = useState<CounselingRecord[]>([])
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!permission) {
      if (!authLoading) setLoading(false)
      return
    }

    setLoading(true)

    let hasError = false

    try {
      const [
        fetchedStudents,
        fetchedClasses,
        fetchedAttendance,
        fetchedCounseling,
        fetchedUsers,
      ] = await Promise.all([
        getStudents().catch(err => {
          console.warn('取得學生資料失敗', err)
          hasError = true
          return []
        }),
        getClasses().catch(err => {
          console.warn('取得班級清單失敗', err)
          hasError = true
          return []
        }),
        getAllAttendance().catch(err => {
          console.warn('取得出勤紀錄失敗', err)
          hasError = true
          return []
        }),
        getAllCounselingRecords().catch(err => {
          console.warn('取得輔導紀錄失敗', err)
          hasError = true
          return []
        }),
        getUsers().catch(err => {
          console.warn('取得使用者資料失敗', err)
          hasError = true
          return []
        }),
      ])

      setStudents(fetchedStudents)
      setClasses(fetchedClasses)
      setAttendanceRecords(fetchedAttendance)
      setCounselingRecords(fetchedCounseling)
      setUsers(fetchedUsers)

      if (hasError) {
        toast({
          title: '部分資料載入失敗',
          description: '系統部分功能可能無法正常運作，請稍後重試。',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('DataContext: 全域資料載入失敗', error)
      toast({
        title: '核心資料載入失敗',
        description: '無法從資料庫獲取核心應用資料，部分功能可能無法正常運作。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [permission, authLoading, toast])

  useEffect(() => {
    if (!authLoading && permission) {
      fetchData()
    } else if (!authLoading && !permission) {
      setLoading(false)
    }
  }, [permission, authLoading, fetchData])

  return (
    <DataContext.Provider
      value={{
        students,
        classes,
        attendanceRecords,
        counselingRecords,
        users,
        loading,
        refetchData: fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)