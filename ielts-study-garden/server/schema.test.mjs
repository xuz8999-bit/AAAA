import { test } from "node:test";
import assert from "node:assert/strict";
import { request, result } from "./schema.mjs";
test("rejects unknown tasks and oversized materials", () => {
  assert.equal(request.safeParse({ task: "other", text: "x" }).success, false);
  assert.equal(
    request.safeParse({ task: "reading", text: "x".repeat(40001) }).success,
    false,
  );
});
test("requires structured learning items and rejects malformed AI results", () => {
  assert.equal(
    result.safeParse({
      summary: "ok",
      items: [
        {
          title: "word",
          text: "词",
          explanation: "noun",
          tags: ["vocabulary"],
          synonyms: ["term"],
        },
      ],
    }).success,
    true,
  );
  assert.equal(
    result.safeParse({ summary: "ok", items: [{ title: 42 }] }).success,
    false,
  );
});

test("interactive speaking exam tasks are unavailable", () => {
  for (const task of ["exam", "feedback"]) assert.equal(request.safeParse({task,text:"hello"}).success,false);
  assert.equal(request.safeParse({task:"speaking",text:"My real experience"}).success,true);
});
