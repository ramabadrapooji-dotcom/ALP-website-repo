import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '../utils/logger';
import fs from 'fs';

// Initialize the SDK. It will automatically pick up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({});

export interface AIParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null; // 0, 1, 2, 3... or null if no visual answer cue is found
}

/**
 * Uploads a PDF to Gemini and extracts questions and answers using multimodal AI.
 */
export async function extractQuestionsWithAI(filePath: string, fileName: string): Promise<AIParsedQuestion[]> {
  logger.info(`[AI Extractor] Uploading ${fileName} to Gemini File API...`);
  
  let uploadResult;
  try {
    uploadResult = await ai.files.upload({
      file: filePath,
      config: { mimeType: 'application/pdf' },
    });
    logger.info(`[AI Extractor] Uploaded as ${uploadResult.name}. Extracting content...`);
  } catch (error) {
    logger.error('[AI Extractor] Failed to upload file to Gemini:', error);
    throw new Error('Failed to upload file to Gemini API');
  }

  try {
    const prompt = `You are a highly intelligent test parser.
Please read this exam PDF and extract all the multiple-choice questions.

Crucially, in some exams, the correct answer is indicated visually directly on the question (for example, by a green checkmark, bold text, an asterisk, or a highlighted background on one of the options).
You MUST look for these visual cues and use them to identify the correct answer index.

Requirements for each question:
- questionNumber: Extract the question number.
- questionText: The full text of the question.
- options: An array of the option strings (exactly as they appear, do not prefix with A, B, C, D).
- correctAnswerIndex: The 0-based index of the correct option. If there is a clear visual cue (like a checkmark or bold) indicating the correct answer, set this to the corresponding index (0, 1, 2, etc). If there is absolutely no visual cue indicating the answer, return null.

Return exactly a JSON array of objects.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
            { text: prompt }
          ],
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionNumber: { type: Type.INTEGER },
              questionText: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, nullable: true }
            },
            required: ['questionNumber', 'questionText', 'options']
          }
        },
        temperature: 0.1, // low temperature for precise extraction
      }
    });

    const text = response.text ?? '';
    if (!text) throw new Error('Empty response from Gemini');

    const parsedData: AIParsedQuestion[] = JSON.parse(text);
    logger.info(`[AI Extractor] Successfully extracted ${parsedData.length} questions.`);
    return parsedData;

  } catch (error) {
    logger.error('[AI Extractor] Gemini generation failed:', error);
    throw error;
  } finally {
    // Cleanup the file from Gemini storage
    try {
      await ai.files.delete({ name: uploadResult.name! });
      logger.info(`[AI Extractor] Deleted file ${uploadResult.name} from Gemini API.`);
    } catch (cleanupError) {
      logger.warn(`[AI Extractor] Failed to delete file ${uploadResult.name}:`, cleanupError);
    }
  }
}
