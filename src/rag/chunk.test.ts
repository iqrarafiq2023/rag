import { chunkText } from './chunk';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const text = 'This is a short sentence.';
    const chunks = chunkText(text, 500, 50);
    expect(chunks.length).toBe(1);
  });

  it('splits long text into multiple chunks', () => {
    const words = Array(1000).fill('word').join(' ');
    const chunks = chunkText(words, 500, 50);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('creates overlap between consecutive chunks', () => {
    const words = Array(600).fill('word').join(' ');
    const chunks = chunkText(words, 500, 50);
    const firstChunkWords = chunks[0].split(' ');
    const secondChunkWords = chunks[1].split(' ');
    // last `overlap` words of chunk 1 should appear at start of chunk 2
    expect(secondChunkWords[0]).toBe(firstChunkWords[firstChunkWords.length - 50]);
  });

  it('returns empty array for empty input', () => {
    expect(chunkText('', 500, 50)).toEqual([]);
  });
});