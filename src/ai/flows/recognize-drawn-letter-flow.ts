'use server';
/**
 * @fileOverview A flow to recognize drawn English text, solve math equations, or identify geometric shapes.
 *
 * - recognizeDrawnLetter - A function that handles recognition and math/shape analysis with retry logic.
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
    .describe('The English word, text, or math expression identified from the drawing. PRESERVE THE EXACT CASE AS DRAWN (e.g. "Apple" not "apple").'),
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

export async function recognizeDrawnLetter(
  input: RecognizeDrawnTextInput
): Promise<RecognizeDrawnTextOutput> {
  // YAHAN FIX KIYA GAYA HAI (3 ki jagah 0 kar diya hai):
  const maxRetries = 0;
  let attempt = 0;

  const executeFlow = async (): Promise<RecognizeDrawnTextOutput> => {
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
      const errorStr = JSON.stringify(error).toLowerCase();
      const isQuotaError = 
        errorStr.includes('429') || 
        errorStr.includes('resource_exhausted') || 
        errorStr.includes('too many requests');
      
      if (isQuotaError && attempt < maxRetries) {
        attempt++;
        // Exponential backoff: 2s, 4s, 6s
        const delay = attempt * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeFlow();
      }

      if (isQuotaError) {
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
  };

  return executeFlow();
}
