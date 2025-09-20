'use server';

/**
 * 根據學生的輔導紀錄產生建議（非 AI 版本）。
 * @param studentDocId 學生 ID
 * @param counselingRecordsText 輔導紀錄文字
 * @returns 建議文字
 */
export async function getInterventionSuggestions(
  studentDocId: string,
  counselingRecordsText: string
): Promise<string> {
  if (!counselingRecordsText || counselingRecordsText.trim().length === 0) {
    return '沒有可用的輔導紀錄來產生建議。';
  }

  // 非 AI 模擬建議邏輯（可依關鍵字判斷）
  if (counselingRecordsText.includes('情緒')) {
    return '建議安排情緒管理課程，並定期追蹤學生情緒狀況。';
  }

  if (counselingRecordsText.includes('人際')) {
    return '可考慮安排人際溝通工作坊，協助學生建立正向互動。';
  }

  return '建議持續觀察學生狀況，並視需要安排進一步輔導。';
}
