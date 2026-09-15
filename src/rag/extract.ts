import { definePDFJSModule, extractText as unpdfExtractText, getDocumentProxy } from 'unpdf';

let pdfjsConfigured = false;

// export async function extractText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
//   const pdf = await getDocumentProxy(new Uint8Array(buffer));
//   const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true });
//   return { text, numPages: totalPages };
// }
export async function extractText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  if (!pdfjsConfigured) {
    await definePDFJSModule(() => import('unpdf/pdfjs'));
    pdfjsConfigured = true;
  }

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true });
  return { text, numPages: totalPages };
}