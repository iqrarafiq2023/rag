import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractText as unpdfExtractText, getDocumentProxy } from 'unpdf';

// PDFParse.setWorker(
//   pathToFileURL(
//     path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs'),
//   ).toString(),
// );


export async function extractText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true });
  return { text, numPages: totalPages };
}
