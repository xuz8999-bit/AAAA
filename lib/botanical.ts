import type { Memory } from "../components/Editor";
export const botanicalCategories = [
  { id: "remember", title: "Things I Remember", note: "仍然记得的事" },
  { id: "places", title: "Places I Kept", note: "留住的风景" },
  { id: "people", title: "People I Met", note: "遇见的人" },
  { id: "dreams", title: "Dreams I Had", note: "做过的梦" },
  { id: "loved", title: "Things I Loved", note: "热爱的事物" },
  { id: "moments", title: "Little Moments", note: "微小的瞬间" },
];
export function botanicalCategory(memory: Memory) {
  if (botanicalCategories.some((c) => c.id === memory.botanicalCategory))
    return memory.botanicalCategory!;
  return memory.category === "PEOPLE"
    ? "people"
    : memory.category === "TRAVEL"
      ? "places"
      : memory.category === "THINGS I LOVE"
        ? "loved"
        : memory.category === "RANDOM FRAGMENTS"
          ? "moments"
          : "remember";
}
