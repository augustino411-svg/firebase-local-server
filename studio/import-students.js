const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 中文欄位 → Prisma 欄位對應表
const columnMap = {
  '學號': 'studentId',
  '身份證號': 'nationalId',
  '姓名': 'name',
  '英文姓名': 'englishName',
  '性別': 'gender',
  '出生日期': 'birthDate',
  '出生地': 'birthPlace',
  '部別': 'division',
  '課程適用年度': 'curriculumYear',
  '學制': 'educationSystem',
  '班群代碼': 'classGroupCode',
  '在學狀態代碼': 'statusCode',
  '班級代碼': 'classCode',
  '班級名稱': 'currentClass',
  '學生座號': 'seatNumber',
  '特殊身份代碼': 'specialCode',
  '學籍狀態代碼': 'academicStatusCode',
  '電子信箱': 'email',
  '學生行動電話': 'mobile',
  '血型': 'bloodType',
  '山地平地': 'mountainOrPlain',
  '原住民族別': 'ethnicity',
  '戶籍地郵區': 'residenceZip',
  '戶籍地址': 'residenceAddress',
  '戶籍地電話': 'residencePhone',
  '通訊地郵區': 'contactZip',
  '通訊地址': 'contactAddress',
  '通訊地電話': 'contactPhone',
  '監護人姓名': 'guardianName',
  '監護人關係': 'guardianRelation',
  '家長職業別': 'guardianOccupation',
  '監護人行動電話': 'guardianMobile',
  '母親行動電話': 'motherMobile',
  '父親行動電話': 'fatherMobile',
  '畢業學校': 'graduatedSchool',
  '入學管道': 'admissionType',
  '新生教育程度': 'educationLevel',
  '入學成績-國文': 'scoreChinese',
  '入學成績-英語': 'scoreEnglish',
  '入學成績-數學': 'scoreMath',
  '入學成績-社會': 'scoreSocial',
  '入學成績-自然': 'scoreScience',
  '入學成績-寫作': 'scoreWriting',
  '異動紀錄': 'changeLog', // 若有此欄位
  '照片網址': 'photoUrl'    // 若有此欄位
};

// 讀取 Excel
const workbook = xlsx.readFile('./students.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

async function importStudents() {
  let successCount = 0;
  let failCount = 0;

  for (const row of rows) {
    const data = {};

    for (const [chineseKey, value] of Object.entries(row)) {
      const prismaKey = columnMap[chineseKey];
      if (prismaKey) {
        if (prismaKey === 'changeLog') {
          try {
            data[prismaKey] = value ? JSON.parse(value) : null;
          } catch {
            data[prismaKey] = null;
          }
        } else {
          data[prismaKey] = value || null;
        }
      }
    }

    try {
      await prisma.student.create({ data });
      successCount++;
    } catch (err) {
      console.error(`❌ 學號 ${data.studentId || '未知'} 匯入失敗：`, err.message);
      failCount++;
    }
  }

  console.log(`✅ 匯入完成：成功 ${successCount} 筆，失敗 ${failCount} 筆`);
}

importStudents()
  .catch((err) => console.error('❌ 匯入程序錯誤：', err))
  .finally(() => prisma.$disconnect());