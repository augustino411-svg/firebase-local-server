import type {
  Student,
  UserWithRole,
  Announcement,
  AttendanceRecord,
  CounselingRecord,
  ChangeLogEntry,
  AttendanceStatus,
} from '@/types'
import { exportAllData, restoreDataFromJson } from '@/lib/data-client'
import { format } from 'date-fns'

export async function signInWithForm(email: string, password: string): Promise<UserWithRole> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '登入失敗')
  }
  return await res.json()
}

export async function getUsers(): Promise<UserWithRole[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('無法獲取使用者列表。')
  return await res.json()
}

export async function addUser(userData: Omit<UserWithRole, 'id'>): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  return await res.json()
}

export async function updateUser(uid: string, data: Partial<UserWithRole>): Promise<void> {
  const res = await fetch(`/api/users/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新使用者資料失敗。')
}

export async function deleteUser(uid: string): Promise<void> {
  const res = await fetch(`/api/users/${uid}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('刪除使用者失敗。')
}

export async function getUserRole(uid: string): Promise<UserWithRole | null> {
  if (!uid) return null
  const res = await fetch(`/api/users/${uid}`)
  if (!res.ok) return null
  return await res.json()
}
export async function getStudents(): Promise<Student[]> {
  const res = await fetch('/api/students')
  if (!res.ok) throw new Error('無法取得學生資料')
  return await res.json()
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  if (!className) return []
  const res = await fetch(`/api/students?className=${encodeURIComponent(className)}`)
  if (!res.ok) throw new Error(`無法取得 ${className} 班級學生`)
  return await res.json()
}

export async function getClasses(): Promise<string[]> {
  const res = await fetch('/api/classes')
  if (!res.ok) throw new Error('無法取得班級清單')
  return await res.json()
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  if (!id) return undefined
  const res = await fetch(`/api/students/${id}`)
  if (!res.ok) return undefined
  return await res.json()
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  const res = await fetch('/api/attendance')
  if (!res.ok) throw new Error('無法取得出勤紀錄')
  return await res.json()
}

export async function getAttendanceByClass(className: string): Promise<AttendanceRecord[]> {
  if (!className) return []
  const res = await fetch(`/api/attendance?className=${encodeURIComponent(className)}`)
  if (!res.ok) throw new Error(`無法取得 ${className} 班級出勤紀錄`)
  return await res.json()
}

export async function getRollCallRecordsByClassAndDate(className: string, date: string): Promise<AttendanceRecord[]> {
  if (!className || !date) return []
  const res = await fetch(`/api/attendance?className=${encodeURIComponent(className)}&date=${encodeURIComponent(date)}`)
  if (!res.ok) throw new Error(`無法取得 ${className} 在 ${date} 的出勤紀錄`)
  return await res.json()
}
export async function addRollCallRecords(payload: {
  attendance: Record<string, Record<string, AttendanceStatus>>
  students: Student[]
  className: string
  date: string
}): Promise<void> {
  const res = await fetch('/api/attendance/rollcall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('新增點名紀錄失敗')
}

export async function batchImportAttendanceRecords(
  records: Omit<AttendanceRecord, 'id' | 'studentName'>[]
): Promise<void> {
  const res = await fetch('/api/attendance/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  })
  if (!res.ok) throw new Error('匯入出勤紀錄失敗')
}

export async function getAllCounselingRecords(): Promise<CounselingRecord[]> {
  const res = await fetch('/api/counseling')
  if (!res.ok) throw new Error('無法取得輔導紀錄')
  return await res.json()
}

export async function getCounselingRecordsCountForDay(
  datePrefix: string,
  studentId: string,
  typePrefix: string
): Promise<number> {
  const res = await fetch(
    `/api/counseling/count?datePrefix=${datePrefix}&studentId=${studentId}&typePrefix=${typePrefix}`
  )
  if (!res.ok) throw new Error('無法取得當日輔導紀錄數量')
  const result = await res.json()
  return result.count
}

export async function addCounselingRecord(docId: string, recordData: Omit<CounselingRecord, 'id'>): Promise<void> {
  const res = await fetch(`/api/counseling/${docId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData),
  })
  if (!res.ok) throw new Error('新增輔導紀錄失敗')
}

export async function deleteCounselingRecord(recordId: string): Promise<void> {
  const res = await fetch(`/api/counseling/${recordId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('刪除輔導紀錄失敗')
}
export async function getSettings(academicYear: string): Promise<any | null> {
  if (!academicYear) return null
  const res = await fetch(`/api/settings/${academicYear}`)
  if (!res.ok) return null
  return await res.json()
}

export async function saveSettings(academicYear: string, settings: any): Promise<void> {
  const res = await fetch(`/api/settings/${academicYear}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error('儲存設定失敗')
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const res = await fetch('/api/announcements')
  if (!res.ok) throw new Error('無法取得公告')
  return await res.json()
}

export async function getAnnouncementsCountForDay(datePrefix: string): Promise<number> {
  const res = await fetch(`/api/announcements/count?prefix=${datePrefix}`)
  if (!res.ok) throw new Error('無法取得公告數量')
  const result = await res.json()
  return result.count
}

export async function addAnnouncement(
  title: string,
  content: string,
  user: UserWithRole,
  file?: File
): Promise<void> {
  const res = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, user }),
  })
  if (!res.ok) throw new Error('新增公告失敗')
}

export async function updateAnnouncement(
  id: string,
  title: string,
  content: string,
  user: UserWithRole,
  file?: File
): Promise<void> {
  const res = await fetch(`/api/announcements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, user }),
  })
  if (!res.ok) throw new Error('更新公告失敗')
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('刪除公告失敗')
}
export async function previewStudentsFromExcel(fileBase64: string): Promise<{
  success: boolean
  message: string
  data?: StudentPreview[]
}> {
  const res = await fetch('/api/students/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64 }),
  })
  return await res.json()
}

export async function commitStudentImport(
  studentsToImport: (Partial<Student> & { importStatus?: 'new' | 'existing' })[],
  mode: 'overwrite' | 'add'
): Promise<{ success: boolean; message: string; count: number }> {
  const res = await fetch('/api/students/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentsToImport, mode }),
  })
  return await res.json()
}

export async function exportAllData(): Promise<{
  success: boolean
  data: Record<string, any[]>
  failedCollections: string[]
}> {
  const res = await fetch('/api/export')
  return await res.json()
}

export async function restoreDataFromJson(jsonString: string): Promise<{
  success: boolean
  message: string
  collectionCount: number
  documentCount: number
}> {
  const res = await fetch('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonString }),
  })
  return await res.json()
}
export async function exportAllData() {
  const res = await fetch('/api/backup')
  if (!res.ok) throw new Error('匯出失敗')
  const data = await res.json()
  return { success: true, data, failedCollections: [] }
}

export async function restoreDataFromJson(jsonString: string) {
  const res = await fetch('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonString,
  })
  if (!res.ok) throw new Error('還原失敗')
  return await res.json()
}
export async function deleteStudentsByIds(studentDocIds: string[]): Promise<{
  success: boolean
  message: string
  count: number
}> {
  const res = await fetch('/api/students/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentDocIds }),
  })
  return await res.json()
}