import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173");
await page.getByText("A little better, every day").waitFor();
await page.screenshot({ path: "/tmp/ielts-dashboard.png", fullPage: true });
await page.locator("nav button").filter({ hasText: "Listening" }).click();
await page.getByRole("button", { name: "导入词汇", exact: true }).click();
await page.locator("textarea").fill("garden | 花园\nflower | 花朵");
await page.getByRole("button", { name: "保存到词库", exact: true }).click();
await page.getByRole("button", { name: "开始练习", exact: true }).click();
assert.equal(await page.getByText("garden", { exact: true }).count(), 0);
await page.getByRole("textbox", { name: "练习答案" }).fill("wrong");
await page.getByRole("button", { name: "Check answer" }).click();
await page
  .getByRole("status")
  .filter({ hasText: "正确答案：garden" })
  .waitFor();
await page.reload();
await page.locator("nav button").filter({ hasText: "Library" }).click();
await page.getByText("garden", { exact: true }).waitFor();
assert.match(await page.locator(".word-row").first().innerText(), /✗ 1/);
await page.locator("nav button").filter({ hasText: "Writing" }).click();
await page
  .locator("textarea")
  .fill("It is useful to learn something every day.");
await page.getByRole("button", { name: "保存原始材料" }).click();
await page.getByRole("button", { name: "我的素材", exact: true }).click();
await page
  .locator(".note")
  .getByText("It is useful to learn something every day.", { exact: true })
  .waitFor();
await page.locator("nav button").filter({ hasText: "Speaking" }).click();
assert.equal(await page.getByRole("button", {name:"AI 模拟考试",exact:true}).count(),0);
await page.locator("textarea").fill("I enjoy growing flowers in my garden.");
await page.getByRole("button",{name:"保存原始材料",exact:true}).click();
await page.getByRole("button",{name:"我的素材",exact:true}).click();
await page.locator(".note").getByText("I enjoy growing flowers in my garden.",{exact:true}).waitFor();
await page.getByRole("button",{name:"真实经历整理",exact:true}).click();
await page.getByRole("button",{name:"AI 整理并保存"}).click();
await page.getByRole("alert").filter({hasText:"AI 尚未配置"}).waitFor();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/tmp/ielts-mobile.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: dashboard, hidden listening answer, import, wrong-answer tracking, persistence, local writing/speaking notes, no interactive examiner, missing-key UI, mobile overflow, no browser errors",
);
await browser.close();
