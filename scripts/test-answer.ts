import { askQuestion } from '../src/rag/answer';

const result = await askQuestion("What is this person's favorite food?");

console.log('\n--- ANSWER ---');
console.log(result.answer);

console.log('\n--- SOURCES ---');
result.sources.forEach((source) => {
  console.log(`[${source.ref}] ${source.source_file} (similarity: ${source.similarity.toFixed(3)})`);
});
