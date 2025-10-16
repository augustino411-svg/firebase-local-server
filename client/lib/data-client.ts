import type {
  Student,
  UserWithRole,
  Announcement,
  AttendanceRecord,
  CounselingRecord,
  ChangeLogEntry,
  AttendanceStatus,
  StudentPreview,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

const jsonHeaders = { 'Content-Type': 'application/json' }

// 使用者登入
export async function signInWithForm(email: string, password: string): Promise<UserWithRole> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json();
    console.error('登入失敗:', error.message);
    throw new Error(error.message || '登入失敗');
  }
  return await res.json()
}

// 使用者 CRUD
export async function getUsers(): Promise<UserWithRole[]> {
  const res = await fetch(`${API_BASE}/api/user`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法獲取使用者列表。')
  return await res.json()
}

export async function addUser(userData: Omit<UserWithRole, 'id'>): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/user`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(userData),
    credentials: 'include',
  })
  return await res.json()
}

export async function updateUser(uid: string, data: Partial<UserWithRole>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/${uid}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('更新使用者資料失敗。')
}

export async function deleteUser(uid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/${uid}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('刪除使用者失敗。')
}

export async function getUserRole(uid: string): Promise<UserWithRole | null> {
  if (!uid) return null
  const res = await fetch(`${API_BASE}/api/user/${uid}`, { credentials: 'include' })
  if (!res.ok) return null
  return await res.json()
}

// 學生資料
export async function getStudents(): Promise<Student[]> {
  const res = await fetch(`${API_BASE}/api/students`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法取得學生資料')
  return await res.json()
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  if (!className) return []
  const res = await fetch(`${API_BASE}/api/students?className=${encodeURIComponent(className)}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`無法取得 ${className} 班級學生`)
  return await res.json()
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  if (!id) return undefined
  const res = await fetch(`${API_BASE}/api/students/${id}`, { credentials: 'include' })
  if (!res.ok) return undefined
  return await res.json()
}

export async function deleteStudentsByIds(studentDocIds: string[]): Promise<{
  success: boolean
  message: string
  count: number
}> {
  const res = await fetch(`${API_BASE}/api/students/delete`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ studentDocIds }),
    credentials: 'include',
  })
  return await res.json()
}

export async function previewStudentsFromExcel(fileBase64: string): Promise<{
  success: boolean
  message: string
  data?: StudentPreview[]
}> {
  const res = await fetch(`${API_BASE}/api/students/preview`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ fileBase64 }),
    credentials: 'include',
  })
  return await res.json()
}

export async function commitStudentImport(
  studentsToImport: (Partial<Student> & { importStatus?: 'new' | 'existing' })[],
  mode: 'overwrite' | 'add'
): Promise<{ success: boolean; message: string; count: number }> {
  const res = await fetch(`${API_BASE}/api/students/import`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ studentsToImport, mode }),
    credentials: 'include',
  })
  return await res.json()
}

export async function getClasses(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/classes`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法取得班級清單')
  return await res.json()
}

// 出勤紀錄
export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  const res = await fetch(`${API_BASE}/api/attendance`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法取得出勤紀錄')
  return await res.json()
}

export async function getAttendanceByClass(className: string): Promise<AttendanceRecord[]> {
  if (!className) return []
  const res = await fetch(`${API_BASE}/api/attendance?className=${encodeURIComponent(className)}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`無法取得 ${className} 班級出勤紀錄`)
  return await res.json()
}

export async function getRollCallRecordsByClassAndDate(className: string, date: string): Promise<AttendanceRecord[]> {
  if (!className || !date) return []
  const res = await fetch(
    `${API_BASE}/api/attendance?className=${encodeURIComponent(className)}&date=${encodeURIComponent(date)}`,
    { credentials: 'include' }
  )
  if (!res.ok) throw new Error(`無法取得 ${className} 在 ${date} 的出勤紀錄`)
  return await res.json()
}

export async function addRollCallRecords(payload: {
  attendance: Record<string, Record<string, AttendanceStatus>>
  students: Student[]
  selectedClass: string
  date: string
}): Promise<void> {
  const { attendance, students, selectedClass, date } = payload

  const res = await fetch(`${API_BASE}/api/attendance/rollcall`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ attendance, students, className: selectedClass, date }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('新增點名紀錄失敗')
}

export async function batchImportAttendanceRecords(
  records: Omit<AttendanceRecord, 'id' | 'studentName'>[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/attendance/import`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ records }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('匯入出勤紀錄失敗')
}

// 輔導紀錄
export async function getAllCounselingRecords(): Promise<CounselingRecord[]> {
  const res = await fetch(`${API_BASE}/api/counseling`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法取得輔導紀錄')
  return await res.json()
}

export async function getCounselingRecordsCountForDay(
  datePrefix: string,
  studentId: string,
  typePrefix: string
): Promise<number> {
  const res = await fetch(
    `${API_BASE}/api/counseling/count?datePrefix=${datePrefix}&studentId=${studentId}&typePrefix=${typePrefix}`,
    { credentials: 'include' }
  )
  if (!res.ok) throw new Error('無法取得當日輔導紀錄數量')
  const result = await res.json()
  return result.count
}

export async function addCounselingRecord(docId: string, recordData: Omit<CounselingRecord, 'id'>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/counseling/${docId}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(recordData),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('新增輔導紀錄失敗')
}

export async function deleteCounselingRecord(recordId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/counseling/${recordId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('刪除輔導紀錄失敗')
}

// 公告
export async function getAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE}/api/announcements`, { credentials: 'include' })
  if (!res.ok) throw new Error('無法取得公告')
  return await res.json()
}

export async function getAnnouncementsCountForDay(datePrefix: string): Promise<number> {
  const res = await fetch(`${API_BASE}/api/announcements/count?prefix=${datePrefix}`, {
    credentials: 'include',
  })
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
  const res = await fetch(`${API_BASE}/api/announcements`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ title, content, user }),
    credentials: 'include',
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
  const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ title, content, user }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('更新公告失敗')
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('刪除公告失敗')
}

// 系統設定
export async function getSettings(academicYear: string): Promise<any | null> {
  if (!academicYear) return null
  const res = await fetch(`${API_BASE}/api/settings/${academicYear}`, {
    credentials: 'include',
  })
  if (!res.ok) return null
  return await res.json()
}

export async function saveSettings(academicYear: string, settings: any): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/${academicYear}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(settings),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('儲存設定失敗')
}

// 匯出與還原資料
export async function exportAllData(): Promise<{
  success: boolean
  data: Record<string, any[]>
  failedCollections: string[]
}> {
  const res = await fetch(`${API_BASE}/api/backup`, { credentials: 'include' })
  if (!res.ok) throw new Error('匯出失敗')
  const data = await res.json()
  return { success: true, data, failedCollections: [] }
}

export async function restoreDataFromJson(jsonString: string): Promise<{
  success: boolean
  message: string
  collectionCount: number
  documentCount: number
}> {
  const res = await fetch(`${API_BASE}/api/restore`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ jsonString }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('還原失敗')
  return await res.json()
}
// 批次學籍更新
export async function batchUpdateStudentStatus(payload: {
  updates: { studentId: string; status: string }[]
}): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/students/batch-update-status`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('批次更新學籍狀態失敗')
  return await res.json()
}

