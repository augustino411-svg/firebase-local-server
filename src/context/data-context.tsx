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
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([])
  const [counselingRecords, setCounselingRecords] = useState<
    CounselingRecord[]
  >([])
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!permission) {
      if (!authLoading) setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [
        fetchedStudents,
        fetchedClasses,
        fetchedAttendance,
        fetchedCounseling,
        fetchedUsers,
      ] = await Promise.all([
        getStudents(),
        getClasses(),
        getAllAttendance(),
        getAllCounselingRecords(),
        getUsers(),
      ])

      setStudents(fetchedStudents)
      setClasses(fetchedClasses)
      setAttendanceRecords(fetchedAttendance)
      setCounselingRecords(fetchedCounseling)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('DataContext: Failed to fetch initial data', error)
      toast({
        title: '核心資料載入失敗',
        description:
          '無法從資料庫獲取核心應用資料，部分功能可能無法正常運作。',
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