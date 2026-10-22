export type ExtractedWord = { word: string; meaning: string };
const chinese = /[\u3400-\u9fff]/;
const heading =
  /^(?:word|words|vocabulary|english|meaning|chinese|translation|list|unit|page|chapter)(?:\s+\d+)?$/i;
function cleanEnglish(value: string) {
  return value
    .replace(/\([^)]*\)|（[^）]*）/g, " ")
    .replace(/\b(?:n|v|vt|vi|adj|adv|prep|pron|conj|det|pl|num|art)\.$/gi, "")
    .replace(/[|,:：=\s]+$/g, "")
    .trim()
    .replace(/\s+/g, " ");
}
/** Extract rows and alternating Word table cells without inventing translations. */
export function extractVocabulary(text: string): {
  entries: ExtractedWord[];
  unmatched: string[];
} {
  const entries: ExtractedWord[] = [];
  const unmatched: string[] = [];
  let pending: ExtractedWord | null = null;
  for (const raw of text
    .replace(/\r/g, "")
    .replace(/([\u3400-\u9fff])[ \t]+(?=[\u3400-\u9fff])/g, "$1")
    .split("\n")) {
    const line = raw
      .trim()
      .replace(/^\s*(?:\d+[.)、．]?|[•●▪])\s*/, "")
      .replace(/\[[^\]]*\]|\/[^/\n]+\//g, " ")
      .trim();
    if (
      !line ||
      /^(?:n|v|vt|vi|adj|adv|prep|pron|conj|det|pl|num|art)\.$/i.test(line)
    )
      continue;
    if (
      /^(?:英文|单词|词汇|中文|释义|词性|序号)(?:\s*(?:英文|单词|词汇|中文|释义|词性|序号))*$/.test(
        line,
      )
    )
      continue;
    // Each English/Chinese pair can occur in a separate column on the same row.
    const pairs = [
      ...line.matchAll(
        /([A-Za-z][A-Za-z'’.-]*(?:[ \t]+[A-Za-z][A-Za-z'’.-]*)*)[ \t|:：=,，—-]*([\u3400-\u9fff][^A-Za-z\n|]*)/g,
      ),
    ];
    if (pairs.length) {
      for (const pair of pairs) {
        const word = cleanEnglish(pair[1]);
        const meaning = pair[2].replace(/[\s,，;；|\d.、]+$/g, "").trim();
        if (word && !heading.test(word)) {
          entries.push({ word, meaning });
          pending = null;
        }
      }
      continue;
    }
    if (chinese.test(line) && !/[A-Za-z]/.test(line) && pending) {
      pending.meaning = line.replace(/^[|:：=\s]+/, "");
      pending = null;
      continue;
    }
    const english = cleanEnglish(line.replace(/[|:：=,]+$/, ""));
    if (
      /^[A-Za-z][A-Za-z'’ -]*$/.test(english) &&
      english.length <= 100 &&
      !heading.test(english)
    ) {
      pending = { word: english, meaning: "" };
      entries.push(pending);
    } else {
      unmatched.push(raw.trim());
      pending = null;
    }
  }
  const unique = new Map<string, ExtractedWord>();
  for (const e of entries) {
    const k = e.word.toLowerCase();
    const old = unique.get(k);
    if (!old) unique.set(k, e);
    else if (!old.meaning && e.meaning) old.meaning = e.meaning;
  }
  return { entries: [...unique.values()], unmatched };
}
export function vocabularyText(text: string) {
  const result = extractVocabulary(text);
  return {
    ...result,
    text: result.entries
      .map((e) => (e.meaning ? `${e.word} | ${e.meaning}` : e.word))
      .join("\n"),
  };
}
