import { extractText as unpdfExtractText, getDocumentProxy } from 'unpdf';



export async function extractText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true });
  return { text, numPages: totalPages };
}
