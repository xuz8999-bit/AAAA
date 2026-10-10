import type { Memory } from "../components/Editor";
export const botanicalCategories = [
  { id: "places", title: "Places I Keep", note: "留住的风景" },
  { id: "people", title: "People I Met", note: "遇见的人" },
  { id: "dreams", title: "Dreams I Had", note: "做过的梦" },
  { id: "loved", title: "Things I Treasure", note: "热爱的事物" },
  { id: "moments", title: "Little Moments", note: "微小的瞬间" },
];
export function botanicalCategory(memory: Memory) {
  if (memory.botanicalCategory === "remember") return "moments";
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
          : "moments";
}
