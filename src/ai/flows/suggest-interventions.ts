
'use server';

/**
 * @fileOverview AI-driven intervention suggestions for counselors based on historical counseling notes.
 *
 * - suggestInterventions - A function that suggests relevant resources or interventions for a student.
 * - SuggestInterventionsInput - The input type for the suggestInterventions function.
 * - SuggestInterventionsOutput - The return type for the suggestInterventions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInterventionsInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  counselingNotes: z
    .string()
    .describe('The historical counseling notes for the student.'),
});
export type SuggestInterventionsInput = z.infer<
  typeof SuggestInterventionsInputSchema
>;

const SuggestInterventionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of suggested interventions or resources for the student.'
    ),
});
export type SuggestInterventionsOutput = z.infer<
  typeof SuggestInterventionsOutputSchema
>;

export async function suggestInterventions(
  input: SuggestInterventionsInput
): Promise<SuggestInterventionsOutput> {
  return suggestInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInterventionsPrompt',
  input: {schema: SuggestInterventionsInputSchema},
  output: {schema: SuggestInterventionsOutputSchema},
  prompt: `你是一位經驗豐富的學校輔導老師，根據學生的歷史紀錄提供建議。

  根據學號 {{{studentId}}} 的以下輔導紀錄，建議相關的介入措施或資源：
  “{{{counselingNotes}}}”。

  請提供一份簡潔的建議清單，讓輔導老師可以考慮用來支持這位學生。請用繁體中文回答。`,
});

const suggestInterventionsFlow = ai.defineFlow(
  {
    name: 'suggestInterventionsFlow',
    inputSchema: SuggestInterventionsInputSchema,
    outputSchema: SuggestInterventionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
