
/**
 * 代表一次學籍的異動紀錄。
 */
export type ChangeLogEntry = {
  date: string; // 異動日期 (yyyy-MM-dd)
  type: string; // 異動類型 (例如: 狀態變更為「休學」、班級異動至「資一乙」)
  note: string; // 異動原因或備註 (例如: 113學年度升級)
};

/**
 * 代表一個學生的完整資料模型。
 */
export type Student = {
  studentId: string;      // 學號，同時也是 Firestore 中的文件 ID
  name: string;           // 學生姓名
  className: string;      // 原始班級 (入學時的班級)
  gender?: string;        // 性別代碼 (1:男, 2:女)
  birthDate?: string;     // 出生日期 (yyyy-MM-dd)
  email?: string;         // 電子郵件
  mobile?: string;        // 學生行動電話
  profilePictureUrl?: string; // 大頭照的 URL
  seatNumber?: string;    // 座號
  specialCode?: string;   // 特殊身份代碼
  statusCode: string;     // 學籍狀態代碼 (1:一般, 2:休學, 3:退學, 4:畢業)
  bloodType?: string;     // 血型
  mountainOrPlain?: string; // 山地/平地
  ethnicity?: string;     // 原住民族別
  residenceZip?: string;  // 戶籍地郵遞區號
  residenceAddress?: string; // 戶籍地址
  residencePhone?: string;   // 戶籍地電話
  contactZip?: string;       // 通訊地郵遞區號
  contactAddress?: string;   // 通訊地址
  contactPhone?: string;     // 通訊地電話
  guardianName?: string;     // 監護人姓名
  guardianRelation?: string; // 監護人關係
  guardianOccupation?: string; // 監護人職業
  guardianMobile?: string;   // 監護人行動電話
  motherMobile?: string;     // 母親行動電話
  fatherMobile?: string;     // 父親行動電話
  graduatedSchool?: string; // 畢業國中
  admissionType?: string;   // 入學管道
  educationLevel?: string;  // 新生教育程度
  nationalId?: string;      // 身分證字號
  currentClass?: string;    // 目前班級 (用於升級或轉班後，覆蓋原始班級)
  changeLog?: ChangeLogEntry[]; // 學籍異動紀錄陣列
  englishName?: string;     // 英文姓名
};

/**
 * 定義所有可能的出缺勤狀態。
 */
export type AttendanceStatus = 'Present' | 'Late' | 'Sick' | 'Personal' | 'Official' | 'Menstrual' | 'Bereavement' | 'Absent';

/**
 * 代表一筆單獨的出缺勤紀錄。
 */
export type AttendanceRecord = {
  id: string;             // Firestore 文件 ID
  studentId: string;      // 該筆紀錄對應的學號
  studentName: string;    // 學生姓名 (冗餘資料，用於顯示)
  className: string;      // 該筆紀錄發生時的班級
  date: string;           // 缺曠日期 (yyyy-MM-dd)
  status: AttendanceStatus; // 缺曠狀態
  period: string;         // 缺曠節次 (例如: '第一節')
};

/**
 * 代表一筆輔導紀錄。
 */
export type CounselingRecord = {
  id: string;               // Firestore 文件 ID
  studentId: string;        // 該筆紀錄對應的學號
  className: string;        // 該筆紀錄發生時的班級
  recordType: string;       // 紀錄類型 (例如: '個人談話記錄', '家庭聯繫紀錄')
  date: string;             // 輔導日期 (yyyy-MM-dd)
  notes: string;            // 輔導記事內容
  academicYear: string;     // 學年度
  semester: string;         // 學期
  counselingType: string;   // 輔導類型代碼
  inquiryMethod?: string;   // 詢問/訪問方式
  contactPerson?: string | null; // 家庭聯繫時的聯繫者
  visibleToTeacher?: 'yes' | 'no'; // 是否開放給導師查看
  authorEmail?: string;     // 填寫人 Email
  authorName?: string;      // 填寫人姓名
  authorRole?: UserRole;    // 填寫人角色
};

/**
 * 定義系統中的使用者角色。
 */
export type UserRole = 'admin' | 'superadmin' | 'teacher' | 'part-time' | null;

/**
 * 代表一個使用者的權限與資料模型。
 */
export type UserWithRole = {
    id: string;               // Firestore 文件 ID
    name?: string;            // 使用者姓名
    email: string;            // 登入帳號 (Email)
    code?: string;            // 登入密碼 (欄位名為 'code')
    role: UserRole;           // 使用者角色
    assignedClasses?: string[]; // 若為導師，其負責的班級列表
};

/**
 * 代表一則公告的資料模型。
 */
export type Announcement = {
  id: string;               // Firestore 文件 ID
  title: string;            // 公告標題
  date: string;             // 公告日期 (yyyy-MM-dd)
  content: string;          // 公告內容
  createdAt: any;           // 建立時間的伺服器時間戳
  fileUrl?: string;         // 附件下載 URL
  fileName?: string;        // 附件原始檔名
  authorName?: string;      // 發布者姓名
  authorEmail?: string;     // 發布者 Email
  authorRole?: UserRole;    // 發布者角色
};
/**
 * 代表匯入預覽的學生資料。
 */
export type StudentPreview = {
  name: string
  className: string
  importStatus?: 'new' | 'existing'
}
