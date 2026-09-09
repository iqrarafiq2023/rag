import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';

PDFParse.setWorker(
  pathToFileURL(
    path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs'),
  ).toString(),
);

export async function extractText(source: Buffer | string | URL): Promise<string> {
  const dataBuffer = Buffer.isBuffer(source) ? source : fs.readFileSync(source);
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();

  await parser.destroy();

  return data.text;
}
