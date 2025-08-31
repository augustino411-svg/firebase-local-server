'use server';

import 'dotenv/config';
import { suggestInterventions } from '@/ai/flows/suggest-interventions';


// This file is reserved for server-only actions,
// such as calling Genkit flows that require backend processing.
// All client-side data fetching and manipulation logic resides in `src/lib/data-client.ts`.


/**
 * Gets AI-driven intervention suggestions based on counseling notes.
 * This remains a server action because it calls a Genkit flow.
 * @param studentDocId The ID of the student.
 * @param counselingRecordsText A string concatenation of the student's counseling records.
 * @returns A promise that resolves to a string of suggestions.
 */
export async function getInterventionSuggestions(
  studentDocId: string,
  counselingRecordsText: string
): Promise<string> {
  if (!counselingRecordsText || counselingRecordsText.trim().length === 0) {
    return '沒有可用的輔導紀錄來產生建議。';
  }

  try {
    const result = await suggestInterventions({ studentId: studentDocId, counselingNotes: counselingRecordsText });
    const formattedSuggestions = result.suggestions
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .join('\n');
    return formattedSuggestions;
  } catch (error) {
    console.error('取得 AI 建議時發生錯誤:', error);
    throw new Error('產生 AI 建議失敗，請稍後再試。');
  }
}
