// src/lib/holidays-tw.ts

/**
 * 114 學年度 (2025-2026) 國定假日與補班日
 * 資料來源：行政院人事行政總處
 * 注意：此為初步預估，實際日期可能變動，需依官方公告為準。
 */

// 114 學年度第一學期 (2025 年 8 月 - 2026 年 1 月)
const firstSemesterHolidays: string[]  = [
  // 2025
  '2025-09-08', // 中秋節 (補假) - 待確認
  '2025-10-10', // 國慶日
];

const firstSemesterWorkdays: string[]  = [
  // 2025
  // '2025-09-13', // 補中秋節的班 - 待確認
];


// 114 學年度第二學期 (2026 年 2 月 - 2026 年 7 月)
const secondSemesterHolidays = [
  // 2026
  '2026-01-01', // 元旦
  '2026-01-02', // 元旦彈性放假
  '2026-02-16', // 農曆除夕 (彈性放假)
  '2026-02-17', // 春節初一
  '2026-02-18', // 春節初二
  '2026-02-19', // 春節初三
  '2026-02-20', // 春節初四 (彈性放假)
  '2026-02-27', // 228紀念日 (彈性放假)
  '2026-04-03', // 兒童節 (彈性放假)
  '2026-06-19', // 端午節
];

const secondSemesterWorkdays : string[] = [
  // 2026
  '2026-02-21', // 補 2/20 的班
  // 其他補班日待確認
];

export const holidays114 = [...firstSemesterHolidays, ...secondSemesterHolidays];
export const workdays114 = [...firstSemesterWorkdays, ...secondSemesterWorkdays];
