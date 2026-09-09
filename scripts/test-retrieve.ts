import { retrieveChunks } from '../src/rag/retrieve';

const results = await retrieveChunks('What technologies does this person work with?');

console.log('Raw results:', results);
console.log('Number of matches:', results.length);

results.forEach((result, index) => {
  console.log(`\n--- Match ${index + 1} (similarity: ${result.similarity.toFixed(3)}) ---`);
  console.log(result.chunk_text.slice(0, 150));
});
