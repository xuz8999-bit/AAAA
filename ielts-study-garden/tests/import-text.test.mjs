import { test } from "node:test";
import assert from "node:assert/strict";
import { extractVocabulary } from "../src/import-text.ts";
test("extracts English/Chinese rows, punctuation, IPA, parts of speech and duplicates", () => {
  assert.deepEqual(
    extractVocabulary(
      "1. accommodation /əˌkɒməˈdeɪʃən/ n. 住宿\nsustainable 可持续的\nflower | 花朵\nFlower | 花",
    ).entries,
    [
      { word: "accommodation", meaning: "住宿" },
      { word: "sustainable", meaning: "可持续的" },
      { word: "flower", meaning: "花朵" },
    ],
  );
});
test("pairs separate DOCX table cells and handles English-only vocabulary", () => {
  assert.deepEqual(
    extractVocabulary(
      "Word\n\n中文\n\ngarden\n\n花园\n\nflower\n\n花朵\n\nextraordinary",
    ).entries,
    [
      { word: "garden", meaning: "花园" },
      { word: "flower", meaning: "花朵" },
      { word: "extraordinary", meaning: "" },
    ],
  );
});
test("extracts multi-column rows, phrases, CSV and TSV", () => {
  assert.deepEqual(
    extractVocabulary(
      "apple 苹果 banana 香蕉\nclimate change,气候变化\nbook\t书本",
    ).entries,
    [
      { word: "apple", meaning: "苹果" },
      { word: "banana", meaning: "香蕉" },
      { word: "climate change", meaning: "气候变化" },
      { word: "book", meaning: "书本" },
    ],
  );
});
test("does not invent English words for Chinese-only text or punctuation", () => {
  const r = extractVocabulary("只有中文\n123\n@@@");
  assert.equal(r.entries.length, 0);
  assert.ok(r.unmatched.length > 0);
});
test("pairs DOCX columns with separate phonetic and part-of-speech cells", () => {
  assert.deepEqual(extractVocabulary("flower\n/flaʊə/\nn.\n花朵").entries, [
    { word: "flower", meaning: "花朵" },
  ]);
});
test("removes OCR spacing inside Chinese definitions", () => {
  assert.deepEqual(extractVocabulary("garden 花 园").entries, [
    { word: "garden", meaning: "花园" },
  ]);
});
