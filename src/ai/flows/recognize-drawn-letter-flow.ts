'use server';
/**
 * @fileOverview A flow to recognize drawn English text, solve math equations, or identify geometric shapes.
 *
 * - recognizeDrawnLetter - A function that handles recognition and math/shape analysis with robust retry logic.
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

const recognizeTextPrompt = ai.definePrompt({
  name: 'recognizeTextPrompt',
  input: {schema: RecognizeDrawnTextInputSchema},
  output: {schema: RecognizeDrawnTextOutputSchema},
  prompt: `Analyze the image provided and identify the content with high precision:

1. MATH SOLVER (STRICT FILTER): 
   - ONLY activate if the drawing contains AT LEAST one number AND AT LEAST one clear math operator (+, -, *, /, x, ÷).
   - If it matches, solve the expression. Replace 'x' with '*' and '÷' with '/' during calculation.
   - Return the original expression in 'recognizedText' and the calculated answer in 'mathResult'.
   - If the expression is incomplete (e.g., "5 +"), return the numbers in 'recognizedText' and omit 'mathResult'.

2. TEXT RECOGNITION (DEFAULT): 
   - Use this for any words, single letters, or numbers WITHOUT operators.
   - STRICT: PRESERVE EXACT CASE (e.g., if you see "m", return "m"; if you see "M", return "M").
   - Return result ONLY in 'recognizedText'. Omit 'mathResult'.

3. SHAPE IDENTIFICATION: 
   - Identify circle, square, or triangle in 'detectedShape'.

STRICTNESS:
- Do not add any conversational filler.
- If you cannot identify anything clearly, return "Unknown" in recognizedText.
- Always prioritize Text Recognition for single characters unless it is a clear math operation.

Image: {{media url=imageDataUri}}`,
});

export async function recognizeDrawnLetter(
  input: RecognizeDrawnTextInput
): Promise<RecognizeDrawnTextOutput> {
  const maxRetries = 3;
  let attempt = 0;

  const executeFlow = async (): Promise<RecognizeDrawnTextOutput> => {
    try {
      const {output} = await recognizeTextPrompt(input);

      if (!output) {
        return { recognizedText: "Unknown", detectedShape: 'none' };
      }

      // Final cleaning of the math result to ensure no "null" strings
      const finalMathResult = output.mathResult && output.mathResult !== "null" ? output.mathResult : undefined;

      return {
        recognizedText: output.recognizedText?.trim() || "Unknown",
        mathResult: finalMathResult,
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
