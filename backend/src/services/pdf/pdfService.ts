import fs from 'fs/promises';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function extractPdfText(filePath: string): Promise<ExtractedPdf> {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  const text = (data.text as string).replace(/\u0000/g, '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { text, pageCount: data.numpages ?? 0, wordCount };
}

/**
 * Very lightweight topic extraction from raw text, used to pre-tag a
 * material before any AI call is made (keeps topic listing fast/free).
 * Looks for heading-like lines: short lines, title case or numbered.
 */
export function guessTopics(text: string, max = 12): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  const candidates = new Set<string>();
  for (const line of lines) {
    if (line.length < 4 || line.length > 60) continue;
    const isNumbered = /^(\d+(\.\d+)*|[IVXLC]+\.)\s+[A-Z]/.test(line);
    const isTitleCase =
      /^[A-Z][a-zA-Z0-9 ,'-]+$/.test(line) && line.split(' ').length <= 8 && !line.endsWith('.');
    if (isNumbered || isTitleCase) {
      candidates.add(line.replace(/^(\d+(\.\d+)*|[IVXLC]+\.)\s+/, '').trim());
    }
    if (candidates.size >= max) break;
  }
  return Array.from(candidates);
}
