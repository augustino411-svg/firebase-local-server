
import { collection, doc, getDoc, getDocs, query, writeBatch, arrayUnion, setDoc, updateDoc, deleteDoc, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Student, UserWithRole, UserRole, Announcement, AttendanceRecord, CounselingRecord, ChangeLogEntry, AttendanceStatus } from '@/types';
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as XLSX from 'xlsx';

// =================================================================
// User & Permissions ("Pure Form" / Non-Auth based)
// =================================================================

/**
 * "Signs in" a user by looking up their credentials in the `users` collection.
 * This does NOT use Firebase Auth.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user's permission object if credentials are valid.
 * @throws An error if credentials are not found.
 */
export async function signInWithForm(email: string, password: string): Promise<UserWithRole> {
  try {
    const usersCollection = collection(db, 'users');
    // Corrected query to use 'code' instead of 'password'
    const q = query(
      usersCollection,
      where('email', '==', email),
      where('code', '==', password)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('您輸入的帳號或密碼不正確，請重新確認。');
    }

    if (snapshot.size > 1) {
      console.warn(`Multiple users found with the same email and password combination: ${email}. Returning the first one.`);
    }

    const userDoc = snapshot.docs[0];
    // Ensure the returned object has the correct shape.
    const userData = userDoc.data();
    // The 'uid' is not a field in the document, it's the document ID.
    // The 'id' is also the document ID. Let's ensure the returned object is consistent.
    return { id: userDoc.id, ...userData } as UserWithRole;

  } catch (error: any) {
    console.error("Error during form sign-in:", error);
    // Re-throw the specific error message or a generic one.
    throw error;
  }
}

export async function getUsers(): Promise<UserWithRole[]> {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWithRole));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error('無法獲取使用者列表。');
  }
}

export async function addUser(userData: Omit<UserWithRole, 'id'>): Promise<{success: boolean, message?: string}> {
  try {
    // Check if email already exists
    const q = query(collection(db, "users"), where("email", "==", userData.email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: false, message: '新增使用者失敗：此 Email 已經存在。' };
    }

    // Add a new document with a generated ID
    await addDoc(collection(db, "users"), userData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error adding user:", error);
    throw new Error(`新增使用者失敗: ${error.message}`);
  }
}

export async function updateUser(uid: string, data: Partial<UserWithRole>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
  } catch (error: any) {
    console.error("Error updating user:", error);
    throw new Error(`更新使用者資料失敗: ${error.message}`);
  }
}

export async function deleteUser(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
  } catch (error: any) {
    console.error("Error deleting user from Firestore:", error);
    throw new Error(`從權限列表中刪除使用者失敗: ${error.message}`);
  }
}


export async function getUserRole(uid: string): Promise<UserWithRole | null> {
    if (!uid) {
        console.error("getUserRole called with no UID.");
        return null;
    }
    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as UserWithRole;
        } else {
            console.warn(`No role document found for UID: ${uid}`);
            return null; // Return null if user doc not found
        }
    } catch (error) {
        console.error(`Critical error fetching role for user ${uid}:`, error);
        throw error;
    }
}


// =================================================================
// Student Data
// =================================================================
export async function getStudents(): Promise<Student[]> {
  try {
    const studentsCollection = collection(db, 'students');
    const studentQuery = query(studentsCollection);
    
    const studentSnapshot = await getDocs(studentQuery);
    return studentSnapshot.docs.map(doc => ({ ...doc.data(), studentId: doc.id } as Student));

  } catch (error) {
    console.error("Error fetching students: ", error);
    throw error;
  }
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  if (!className) return [];
  try {
    const studentsCollection = collection(db, 'students');
    const allStudentsSnapshot = await getDocs(studentsCollection);
    const allStudents = allStudentsSnapshot.docs.map(doc => ({ ...doc.data(), studentId: doc.id } as Student));
    
    const filteredStudents = allStudents.filter(student => {
      const effectiveClass = student.currentClass || student.className;
      return effectiveClass === className;
    });

    return filteredStudents.sort((a, b) => (a.seatNumber || '99').localeCompare(b.seatNumber || '99', undefined, { numeric: true }));

  } catch (error) {
    console.error(`Error fetching students for class ${className}: `, error);
    throw error;
  }
}


export async function getClasses(): Promise<string[]> {
    try {
        const studentsCollection = collection(db, 'students');
        const studentSnapshot = await getDocs(studentsCollection);
        const classSet = new Set<string>();
        studentSnapshot.forEach(doc => {
          const s = doc.data() as Student;
          const effectiveClass = s.currentClass || s.className;
          if (effectiveClass) classSet.add(effectiveClass);
        });
        
        return [...classSet].sort();
    } catch (error) {
        console.error("Error fetching classes: ", error);
        throw error;
    }
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  if (!id) return undefined;
  try {
    const studentDocRef = doc(db, "students", id);
    const studentDoc = await getDoc(studentDocRef);

    if (!studentDoc.exists()) {
      console.warn(`No student found with studentId (document ID): ${id}`);
      return undefined;
    }
    
    return { ...studentDoc.data(), studentId: studentDoc.id } as Student;

  } catch (error) {
    console.error("Error fetching student by ID: ", error);
    throw error;
  }
}

// =================================================================
// Attendance Data
// =================================================================

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  try {
    const attendanceCollection = collection(db, 'attendance');
    const q = query(attendanceCollection);

    const attendanceSnapshot = await getDocs(q);
    return attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));

  } catch (error) {
    console.error("Error fetching all attendance records: ", error);
    throw error;
  }
}


export async function getAttendanceByClass(className: string): Promise<AttendanceRecord[]> {
  if (!className) return [];
  try {
      const attendanceCollection = collection(db, 'attendance');
      const q = query(attendanceCollection, where('className', '==', className));
      const attendanceSnapshot = await getDocs(q);

      return attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));

  } catch (error) {
    console.error(`Error fetching attendance records for class ${className}`, error);
    throw error;
  }
}

export async function getRollCallRecordsByClassAndDate(className: string, date: string): Promise<AttendanceRecord[]> {
  if (!className || !date) return [];
  try {
    const attendanceCollection = collection(db, 'attendance');
    const q = query(
        attendanceCollection, 
        where('className', '==', className),
        where('date', '==', date)
    );
    const attendanceSnapshot = await getDocs(q);
    const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
    return attendanceList;
  } catch (error) {
    console.error(`Error fetching attendance for class ${className} on ${date}: `, error);
    if (error instanceof Error && error.message.includes('firestore/failed-precondition')) {
        console.error(
          'Firestore index missing. Please create a composite index for the "attendance" collection on "className" (ascending) and "date" (ascending). You can usually find a direct link to create this index in the Firebase console error logs.'
        );
        throw new Error(
          '資料庫索引缺少，請在Firebase後台建立。'
        );
      }
    throw error;
  }
}

const PERIOD_ID_TO_LABEL: Record<string, string> = {
    'period1': '第一節',
    'period2': '第二節',
    'period3': '第三節',
    'period4': '第四節',
    'period5': '第五節',
};


export async function addRollCallRecords(
    attendance: Record<string, Record<string, AttendanceStatus>>,
    students: Student[],
    className: string,
    date: string
) {
    const batch = writeBatch(db);
    const studentMap = new Map(students.map(s => [s.studentId, s]));
    const dateForId = date.replace(/-/g, '');

    const existingRecordsQuery = query(collection(db, 'attendance'), where('className', '==', className), where('date', '==', date));
    const existingRecordsSnapshot = await getDocs(existingRecordsQuery);
    
    const existingRecordsMap = new Map<string, any>();
    existingRecordsSnapshot.docs.forEach(doc => {
        const recordData = doc.data() as AttendanceRecord;
        const key = `${recordData.studentId}-${recordData.period}`;
        existingRecordsMap.set(key, doc.ref);
    });

    for (const studentId in attendance) {
        const student = studentMap.get(studentId);
        if (!student) continue;

        for (const periodId in attendance[studentId]) {
            const periodLabel = PERIOD_ID_TO_LABEL[periodId];
            if (!periodLabel) continue;

            const status = attendance[studentId][periodId];
            const docId = `${dateForId}-${student.studentId}-${periodId.replace('period', '')}`;
            const docRef = doc(db, 'attendance', docId);
            const key = `${student.studentId}-${periodLabel}`;

            if (status && status !== 'Present') {
                const record: Omit<AttendanceRecord, 'id'> = {
                    studentId: student.studentId, 
                    studentName: student.name,
                    className: student.currentClass || student.className,
                    date: date,
                    period: periodLabel,
                    status: status,
                };
                batch.set(docRef, record, { merge: true });
                existingRecordsMap.delete(key);
            }
        }
    }
    
    for(const docRef of existingRecordsMap.values()){
        batch.delete(docRef);
    }
    
    await batch.commit();
}


export async function batchImportAttendanceRecords(records: Omit<AttendanceRecord, 'id' | 'studentName'>[]): Promise<void> {
    const batch = writeBatch(db);
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentMap = new Map(studentsSnapshot.docs.map(d => [d.id, d.data() as Student]));

    for (const record of records) {
        const student = studentMap.get(record.studentId);
        if (!student) {
            console.warn(`Skipping import for unknown student ID: ${record.studentId}`);
            continue;
        }

        const periodNumber = record.period.match(/\d+/)?.[0] || '';
        const docId = `${record.date.replace(/-/g, '')}-${record.studentId}-${periodNumber}`;

        const docRef = doc(db, 'attendance', docId);

        const recordToSave: Omit<AttendanceRecord, 'id'> = {
            ...record,
            studentName: student.name,
        };

        batch.set(docRef, recordToSave);
    }

    await batch.commit();
}

// =================================================================
// Counseling Data
// =================================================================

export async function getAllCounselingRecords(): Promise<CounselingRecord[]> {
  try {
    const recordsCollection = collection(db, 'counselingRecords');
    const q = query(recordsCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingRecord));

  } catch (error) {
    console.error("Error fetching all counseling records: ", error);
    throw error;
  }
}


export async function getCounselingRecordsCountForDay(datePrefix: string, studentId: string, typePrefix: string): Promise<number> {
    const recordsCollection = collection(db, 'counselingRecords');
    const prefix = `${datePrefix}-${studentId}-${typePrefix}`;
    const q = query(
        recordsCollection,
        where('__name__', '>=', prefix),
        where('__name__', '<', prefix + 'z') 
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
}


export async function addCounselingRecord(docId: string, recordData: Omit<CounselingRecord, 'id'>): Promise<void> {
  try {
    const finalRecordData = {
        ...recordData,
        studentId: String(recordData.studentId),
    };
    const docRef = doc(db, 'counselingRecords', docId);
    await setDoc(docRef, finalRecordData);
  } catch (error) {
    console.error("Error adding counseling record: ", error);
    throw new Error('Failed to add counseling record');
  }
}


export async function deleteCounselingRecord(recordId: string): Promise<void> {
  if (!recordId) {
    throw new Error('輔導紀錄 ID 為必填項目。');
  }
  try {
    const docRef = doc(db, 'counselingRecords', recordId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting counseling record: ', error);
    throw new Error('刪除輔導紀錄失敗。');
  }
}

// =================================================================
// Settings & System Management (Client-Side)
// =================================================================

export async function batchUpdateStudentStatus(
  studentDocIds: string[],
  newStatusCode: string,
  newClassName: string,
  note: string
): Promise<void> {
  if (studentDocIds.length === 0 || (!newStatusCode && !newClassName) || !note) return;
  
  const date = format(new Date(), 'yyyy-MM-dd');
  const statusMap: Record<string, string> = {
    '1': '一般', '2': '休學', '3': '退學', '4': '畢業'
  };

  const batch = writeBatch(db);

  for (const studentId of studentDocIds) {
    const studentDocRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentDocRef);

    if (studentDoc.exists()) {
      const studentData = studentDoc.data() as Student;
      const updates: Partial<Student> = {};
      let logType = '';

      if (newStatusCode && studentData.statusCode !== newStatusCode) {
        updates.statusCode = newStatusCode;
        logType += `狀態變更為「${statusMap[newStatusCode] || '未知'}」`;
      }
      if (newClassName && (studentData.currentClass || studentData.className) !== newClassName) {
        updates.currentClass = newClassName;
        if (logType) logType += '；';
        logType += `班級異動至「${newClassName}」`;
      }

      if (Object.keys(updates).length > 0) {
        const changeLogEntry: ChangeLogEntry = {
          date,
          type: logType || '資料更新',
          note,
        };
        batch.update(studentDocRef, { ...updates, changeLog: arrayUnion(changeLogEntry) });
      }
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error in batch updating student status: ", error);
    throw new Error('批次更新學生學籍狀態失敗。');
  }
}

const SETTINGS_COLLECTION = 'semesters';

export async function saveSettings(academicYear: string, settings: any) {
    if (!academicYear) {
        throw new Error("Academic year is required to save settings.");
    }
    try {
        const settingsDocRef = doc(db, SETTINGS_COLLECTION, academicYear);
        const { permissions, ...semesterSettings } = settings;
        await setDoc(settingsDocRef, semesterSettings, { merge: true });
    } catch (error) {
        console.error("Error saving settings: ", error);
        throw new Error("Failed to save settings.");
    }
}

export async function getSettings(academicYear: string) {
    if (!academicYear) return null;
    try {
        const settingsDocRef = doc(db, SETTINGS_COLLECTION, academicYear);
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings: ", error);
        throw error;
    }
}

// =================================================================
// Announcements
// =================================================================
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const announcementsCollection = collection(db, 'announcements');
    // Fetch without ordering, will sort on client
    const snapshot = await getDocs(query(announcementsCollection));
    if (snapshot.empty) {
      return [];
    }
    const announcementsList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Announcement;
    });
    // Client-side sorting to ensure consistency
    return announcementsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching announcements: ", error);
    throw error;
  }
}

async function getAnnouncementsCountForDay(datePrefix: string): Promise<number> {
    const recordsCollection = collection(db, 'announcements');
    const q = query(
        recordsCollection,
        where('__name__', '>=', datePrefix),
        where('__name__', '<', datePrefix + 'z')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export async function addAnnouncement(title: string, content: string, user: UserWithRole, file?: File): Promise<void> {
  if (!title.trim() || !content.trim()) {
    throw new Error('公告標題與內容不可為空。');
  }
  try {
    const datePrefix = format(new Date(), 'yyyyMMdd');
    const count = await getAnnouncementsCountForDay(datePrefix);
    const docId = `${datePrefix}-${count + 1}`;
    const docRef = doc(db, 'announcements', docId);

    await setDoc(docRef, {
      title,
      content,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: serverTimestamp(),
      authorName: user.name || user.email,
      authorEmail: user.email,
      authorRole: user.role,
    });
  } catch (error) {
    console.error('Error adding announcement: ', error);
    throw new Error('新增公告失敗。');
  }
}

export async function updateAnnouncement(id: string, title: string, content: string, user: UserWithRole, file?: File): Promise<void> {
  if (!id || !title.trim() || !content.trim()) {
    throw new Error('ID、標題與內容為必填項目。');
  }
  try {
    const docRef = doc(db, 'announcements', id);
    const updateData: { [key: string]: any } = { 
        title, 
        content,
        authorName: user.name || user.email,
        authorEmail: user.email,
        authorRole: user.role,
    };
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating announcement: ', error);
    throw new Error('更新公告失敗。');
  }
}


export async function deleteAnnouncement(id: string): Promise<void> {
  if (!id) {
    throw new Error('Announcement ID is required for deletion.');
  }
  try {
    const docRef = doc(db, 'announcements', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as Announcement;
        if (data.fileUrl) {
            // This needs `storage` to be imported and initialized.
            // Assuming storage is available as in firebase.ts
            // import { storage } from './firebase'; 
            // const fileRef = ref(storage, data.fileUrl);
            // await deleteObject(fileRef);
            console.warn("File deletion from storage is not implemented in this mock.")
        }
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting announcement: ', error);
    throw new Error('刪除公告失敗。');
  }
}


// =================================================================
// Data Import / Export (Client-Side)
// =================================================================

type StudentPreview = Partial<Student> & { importStatus: 'new' | 'existing' };

export async function previewStudentsFromExcel(
    fileBase64: string
): Promise<{ success: boolean; message: string; data?: StudentPreview[] }> {
    try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return { success: false, message: "Excel 檔案為空或格式不符。", data: [] };
        }
        
        const existingStudentsSnapshot = await getDocs(collection(db, 'students'));
        const existingStudentIds = new Set(existingStudentsSnapshot.docs.map(doc => doc.id));

        const previewData: StudentPreview[] = jsonData.map(row => {
            const studentId = String(row['學號']);
            const mappedStudent: Partial<Student> = {
                studentId: studentId,
                nationalId: String(row['身分證字號'] || ''),
                name: String(row['姓名'] || ''),
                englishName: String(row['英文姓名'] || ''),
                gender: String(row['性別'] || ''),
                birthDate: String(row['出生日期'] || ''),
                className: String(row['班級名稱'] || ''),
                seatNumber: String(row['學生座號'] || ''),
                specialCode: String(row['特殊身份代碼'] || ''),
                statusCode: String(row['學籍狀態代碼'] || '1'),
                email: String(row['電子信箱'] || ''),
                mobile: String(row['學生行動電話'] || ''),
                bloodType: String(row['血型'] || ''),
                mountainOrPlain: String(row['山地平地'] || ''),
                ethnicity: String(row['原住民族別'] || ''),
                residenceZip: String(row['戶籍地郵區'] || ''),
                residenceAddress: String(row['戶籍地址'] || ''),
                residencePhone: String(row['戶籍地電話'] || ''),
                contactZip: String(row['通訊地郵區'] || ''),
                contactAddress: String(row['通訊地址'] || ''),
                contactPhone: String(row['通訊地電話'] || ''),
                guardianName: String(row['監護人姓名'] || ''),
                guardianRelation: String(row['監護人關係'] || ''),
                guardianOccupation: String(row['家長職業別'] || ''),
                guardianMobile: String(row['監護人行動電話'] || ''),
                motherMobile: String(row['母親行動電話'] || ''),
                fatherMobile: String(row['父親行動電話'] || ''),
                graduatedSchool: String(row['畢業學校'] || ''),
                admissionType: String(row['入學管道'] || ''),
                educationLevel: String(row['新生教育程度'] || ''),
            };

            return {
                ...mappedStudent,
                importStatus: existingStudentIds.has(studentId) ? 'existing' : 'new'
            };
        });

        return { success: true, message: "預覽成功", data: previewData };

    } catch (error: any) {
        console.error("Error previewing students from excel:", error);
        return { success: false, message: `預覽檔案時發生錯誤: ${error.message}` };
    }
}


export async function commitStudentImport(
  studentsToImport: (Partial<Student> & { importStatus?: 'new' | 'existing' })[],
  mode: 'overwrite' | 'add'
): Promise<{ success: boolean; message: string; count: number }> {
    const batch = writeBatch(db);
    
    try {
        if (mode === 'overwrite') {
            const existingStudentsSnapshot = await getDocs(collection(db, 'students'));
            existingStudentsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }

        let count = 0;
        for (const student of studentsToImport) {
            if (student.studentId) {
                const docRef = doc(db, 'students', student.studentId);
                const { importStatus, ...dataToSet } = student;
                
                const finalData = {
                    ...dataToSet,
                    studentId: String(dataToSet.studentId),
                    statusCode: String(dataToSet.statusCode || '1'),
                    seatNumber: String(dataToSet.seatNumber || ''),
                };
                
                batch.set(docRef, finalData, { merge: mode === 'add' });
                count++;
            }
        }

        await batch.commit();
        return { success: true, message: '學生資料已成功匯入。', count };

    } catch (error: any) {
        console.error("Error committing student import:", error);
        return { success: false, message: `匯入過程中發生錯誤: ${error.message}`, count: 0 };
    }
}

const EXPORTABLE_COLLECTIONS = ['students', 'attendance', 'counselingRecords', 'semesters', 'announcements', 'users'];
export async function exportAllData(): Promise<{ success: boolean; data: Record<string, any[]>; failedCollections: string[] }> {
    const data: Record<string, any[]> = {};
    const failedCollections: string[] = [];

    for (const collectionName of EXPORTABLE_COLLECTIONS) {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            data[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error exporting collection ${collectionName}:`, error);
            failedCollections.push(collectionName);
        }
    }
    
    const success = failedCollections.length === 0;
    return { success, data, failedCollections };
}


export async function restoreDataFromJson(
    jsonString: string
): Promise<{ success: boolean; message: string; collectionCount: number; documentCount: number }> {
    let collectionsToRestore: Record<string, any[]>;
    try {
        collectionsToRestore = JSON.parse(jsonString);
    } catch (error) {
        return { success: false, message: 'JSON 格式錯誤，無法解析檔案。', collectionCount: 0, documentCount: 0 };
    }

    const batch = writeBatch(db);
    let totalDocs = 0;
    let collectionCount = 0;

    for (const collectionName in collectionsToRestore) {
        if (Object.prototype.hasOwnProperty.call(collectionsToRestore, collectionName)) {
            const documents = collectionsToRestore[collectionName];
            if (Array.isArray(documents)) {
                collectionCount++;
                for (const docData of documents) {
                    if (docData.id) {
                        const docRef = doc(db, collectionName, docData.id);
                        const dataToSet = { ...docData };
                        delete dataToSet.id;
                        batch.set(docRef, dataToSet);
                        totalDocs++;
                    }
                }
            }
        }
    }

    if (totalDocs === 0) {
        return { success: false, message: '備份檔案中沒有找到有效的資料可供還原。', collectionCount: 0, documentCount: 0 };
    }

    try {
        await batch.commit();
        return { success: true, message: '資料庫已成功還原。', collectionCount, documentCount: totalDocs };
    } catch (error: any) {
        console.error("Error restoring data from JSON:", error);
        return { success: false, message: `還原過程中發生錯誤: ${error.message}`, collectionCount: 0, documentCount: 0 };
    }
}


export async function deleteStudentsByIds(
  studentDocIds: string[]
): Promise<{ success: boolean; message: string; count: number }> {
    const batch = writeBatch(db);
    
    if (!studentDocIds || studentDocIds.length === 0) {
        return { success: false, message: '沒有提供任何學生 ID。', count: 0 };
    }

    studentDocIds.forEach(id => {
        const docRef = doc(db, 'students', id);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        return { success: true, message: `成功刪除 ${studentDocIds.length} 位學生。`, count: studentDocIds.length };
    } catch (error: any) {
        console.error("Error deleting students by IDs:", error);
        return { success: false, message: `刪除學生時發生錯誤: ${error.message}`, count: 0 };
    }
}

    
