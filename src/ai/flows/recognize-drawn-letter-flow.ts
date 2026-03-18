'use server';
/**
 * @fileOverview A flow to recognize drawn English text, solve math equations, or identify geometric shapes.
 *
 * - recognizeDrawnLetter - A function that handles recognition and math/shape analysis.
 * - RecognizeDrawnTextInput - The input type.
 * - RecognizeDrawnTextOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeDrawnTextInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A captured drawing of text, math, or a shape, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeDrawnTextInput = z.infer<
  typeof RecognizeDrawnTextInputSchema
>;

const RecognizeDrawnTextOutputSchema = z.object({
  recognizedText: z
    .string()
    .optional()
    .describe('The English word, text, or math expression identified from the drawing. PRESERVE THE EXACT CASE AS DRAWN (e.g. "Apple" not "APPLE").'),
  mathResult: z
    .string()
    .optional()
    .describe('The solution to the math expression, if one was detected.'),
  detectedShape: z
    .enum(['circle', 'square', 'triangle', 'none'])
    .optional()
    .describe('The geometric shape identified in the drawing, if any.'),
  error: z
    .string()
    .optional()
    .describe('An error message if recognition fails or quota is exceeded.'),
});
export type RecognizeDrawnTextOutput = z.infer<
  typeof RecognizeDrawnTextOutputSchema
>;

export async function recognizeDrawnLetter(
  input: RecognizeDrawnTextInput
): Promise<RecognizeDrawnTextOutput> {
  return recognizeDrawnTextFlow(input);
}

const recognizeTextPrompt = ai.definePrompt({
  name: 'recognizeTextPrompt',
  input: {schema: RecognizeDrawnTextInputSchema},
  output: {schema: RecognizeDrawnTextOutputSchema},
  prompt: `Analyze the image provided and identify the content with high precision:

1. TEXT RECOGNITION (DEFAULT): Identify any words or letters. 
   - STRICT: PRESERVE EXACT CASE (e.g., if you see "m", return "m"; if you see "M", return "M").
   - Return result in 'recognizedText'.

2. MATH SOLVER: If the drawing contains numbers AND math operators (+, -, *, /, x), solve it. 
   - Return the equation in 'recognizedText' and the calculated answer in 'mathResult'.

3. SHAPE IDENTIFICATION: If the drawing is a circle, square, or triangle, identify it in 'detectedShape'.

STRICTNESS:
- Do not add any conversational filler.
- If you cannot identify anything clearly, return "Unknown" in recognizedText.

Image: {{media url=imageDataUri}}`,
});

const recognizeDrawnTextFlow = ai.defineFlow(
  {
    name: 'recognizeDrawnTextFlow',
    inputSchema: RecognizeDrawnTextInputSchema,
    outputSchema: RecognizeDrawnTextOutputSchema,
  },
  async input => {
    try {
      const {output} = await recognizeTextPrompt(input);

      if (!output) {
        return { recognizedText: "Unknown", detectedShape: 'none' };
      }

      return {
        recognizedText: output.recognizedText?.trim() || "Unknown",
        mathResult: output.mathResult,
        detectedShape: output.detectedShape || 'none',
      };
    } catch (error: any) {
      // Catching Google AI Quota (429) errors gracefully
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          error: 'QUOTA_EXCEEDED',
          recognizedText: 'AI is Resting...',
          detectedShape: 'none'
        };
      }
      return { 
        error: 'System Error',
        recognizedText: 'Error',
        detectedShape: 'none'
      };
    }
  }
);
