export type Word = {
  id: string;
  word: string;
  meaning: string;
  example: string;
  synonyms: string[];
  skill: "Listening" | "Reading";
  correct: number;
  wrong: number;
  last: number;
  due: number;
};
export type Note = {
  id: string;
  skill: string;
  title: string;
  text: string;
  explanation: string;
  tags: string[];
  synonyms: string[];
  favorite: boolean;
  created: number;
};
export type Event = { at: number; skill: string; correct: boolean; kind?: "practice" | "material" };
export type State = {
  version: 1;
  words: Word[];
  notes: Note[];
  events: Event[];
};
export const empty: State = { version: 1, words: [], notes: [], events: [] };
export const key = "ielts-study-garden-v1";
export const id = () => crypto.randomUUID();
export function validate(v: unknown): v is State {
  const x = v as State;
  return (
    !!x &&
    x.version === 1 &&
    Array.isArray(x.words) &&
    Array.isArray(x.notes) &&
    Array.isArray(x.events) &&
    x.words.every(
      (w) =>
        typeof w.id === "string" &&
        typeof w.word === "string" &&
        typeof w.meaning === "string" &&
        typeof w.example === "string" &&
        ["Listening", "Reading"].includes(w.skill) &&
        Array.isArray(w.synonyms) &&
        w.synonyms.every((s) => typeof s === "string") &&
        [w.correct, w.wrong, w.last, w.due].every(
          (n) => Number.isFinite(n) && n >= 0,
        ),
    ) &&
    x.notes.every(
      (n) =>
        ["id", "skill", "title", "text", "explanation"].every(
          (k) => typeof n[k as keyof Note] === "string",
        ) &&
        Array.isArray(n.tags) &&
        n.tags.every((t) => typeof t === "string") &&
        Array.isArray(n.synonyms) &&
        n.synonyms.every((t) => typeof t === "string") &&
        typeof n.favorite === "boolean" &&
        Number.isFinite(n.created),
    ) &&
    x.events.every(
      (e) =>
        Number.isFinite(e.at) &&
        typeof e.skill === "string" &&
        typeof e.correct === "boolean",
    )
  );
}
export function load(): State {
  const raw = localStorage.getItem(key);
  if (!raw) return structuredClone(empty);
  const data = JSON.parse(raw);
  if (!validate(data))
    throw Error("存档格式异常；为保护数据，未覆盖原存档。请先导出原始数据。");
  return data;
}
export function parseWords(text: string, skill: Word["skill"]): Word[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, ...meaning] = line.split(/\t|\s*[|＝=：:]\s*|\s+[-—]\s+/);
      return {
        id: id(),
        word: word.trim(),
        meaning: meaning.join(" "),
        example: "",
        synonyms: [],
        skill,
        correct: 0,
        wrong: 0,
        last: 0,
        due: 0,
      };
    })
    .filter((w) => w.word);
}
export function review(w: Word, correct: boolean): Word {
  const now = Date.now();
  return {
    ...w,
    correct: w.correct + Number(correct),
    wrong: w.wrong + Number(!correct),
    last: now,
    due:
      now +
      (correct ? Math.min(30, 2 ** Math.min(w.correct, 5)) * 86400000 : 600000),
  };
}
