import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const p = await browser.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://127.0.0.1:5173");
await p.locator("nav button").filter({ hasText: "Reading" }).click();
await p.getByRole("button", { name: "导入词汇", exact: true }).click();
await p
  .locator("textarea")
  .fill(
    "sustainable | 可持续的\nlasting | 持久的\ngarden | 花园\nsustainable | 重复",
  );
await p.getByRole("button", { name: "保存到词库" }).click();
await p.getByRole("button", { name: "开始练习", exact: true }).click();
await p.getByRole("textbox", { name: "练习答案" }).fill("sustainable");
await p.getByRole("button", { name: "Check answer" }).click();
await p.getByRole("status").filter({ hasText: "回答正确" }).waitFor();
assert.equal(
  await p.evaluate(
    () =>
      JSON.parse(localStorage.getItem("ielts-study-garden-v1")).words.length,
  ),
  3,
);
await p.locator("nav button").filter({ hasText: "Library" }).click();
p.once("dialog", (d) => d.accept("可持续的"));
p.once("dialog", () => {});
let num = 0;
const handle = async (d) => {
  num++;
  await d.accept(num === 1 ? "可持续的" : "enduring, durable");
};
p.removeAllListeners("dialog");
p.on("dialog", handle);
await p
  .locator(".word-row")
  .filter({ hasText: "sustainable" })
  .getByRole("button", { name: "编辑", exact: true })
  .click();
p.removeListener("dialog", handle);
await p.locator("nav button").filter({ hasText: "Reading" }).click();
await p.locator(".toolbar select").nth(1).selectOption("同义替换");
await p.getByRole("button", { name: "enduring", exact: true }).click();
await p.getByRole("status").filter({ hasText: "回答正确" }).waitFor();
// Mock only the external AI response to validate the structured UI path; no claim of live AI validation.
await p.route("**/api/ai", (r) =>
  r.fulfill({
    json: {
      summary: "测试结构化结果",
      items: [
        {
          title: "Reason",
          text: "Learning every day helps us improve.",
          explanation: "原因句：每天学习有助于进步。",
          tags: ["reason"],
          synonyms: [],
        },
      ],
    },
  }),
);
await p.locator("nav button").filter({ hasText: "Writing" }).click();
await p.locator("textarea").fill("Learning every day helps us improve.");
await p.getByRole("button", { name: "AI 整理并保存" }).click();
await p.getByText("测试结构化结果").waitFor();
await p.getByRole("button", { name: "我的素材", exact: true }).click();
await p
  .locator(".note")
  .getByText("Learning every day helps us improve.", { exact: true })
  .waitFor();
p.once("dialog", (d) => d.accept("Learning"));
await p.getByRole("button", { name: "填空练习" }).click();
await p.getByText("填空正确！", { exact: true }).waitFor();
await p.reload();
await p.locator("nav button").filter({ hasText: "Writing" }).click();
await p.getByRole("button", { name: "我的素材", exact: true }).click();
assert.equal(await p.locator(".note").count(), 1);
assert.deepEqual(errors, []);
console.log(
  "PASS: reading import deduplication, spelling, synonym editing/quiz; writing structured result UI (mock API), cloze, saved material reload",
);
await browser.close();
