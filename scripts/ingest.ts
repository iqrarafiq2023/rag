import { readFile } from 'fs/promises';
import { extractText } from '../src/rag/extract';
import { chunkText } from '../src/rag/chunk';
import { storeChunks } from '../src/rag/embed';

const sourcePath = new URL('../data/sample.pdf', import.meta.url);

async function run(): Promise<void> {
  const buffer = await readFile(sourcePath);
  const { text } = await extractText(buffer);
  const chunks = chunkText(text);
  await storeChunks(chunks, 'data/sample.pdf');
  console.log('Done. Stored', chunks.length, 'chunks.');
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});