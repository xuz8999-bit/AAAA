import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (!path.startsWith("/AAAA/ielts/")) {
      res.writeHead(404);
      return res.end();
    }
    const relative =
      decodeURIComponent(path.slice("/AAAA/ielts/".length)) || "index.html";
    const file = resolve(root, relative);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      res.writeHead(403);
      return res.end();
    }
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const address = `http://127.0.0.1:${server.address().port}/AAAA/ielts/`;
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("PAGE ERROR", e.message);
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.error(m.text());
  });
  await page.addInitScript(() => {
    window.__spoken = [];
    window.speechSynthesis.speak = (u) =>
      window.__spoken.push({ text: u.text, lang: u.lang });
    window.speechSynthesis.cancel = () => {};
  });
  await page.goto(address);
  await page.locator("nav button").filter({ hasText: "Listening" }).click();
  await page.getByRole("button", { name: "导入词汇", exact: true }).click();
  await page
    .getByLabel("导入词汇文件")
    .setInputFiles(
      fileURLToPath(new URL("./fixtures/vocabulary.docx", import.meta.url)),
    );
  await page
    .getByRole("status")
    .filter({ hasText: "提取到 2 个英文词条" })
    .waitFor();
  assert.equal(
    await page.locator("textarea").inputValue(),
    "garden | 花园\nflower | 花朵",
  );
  await page.getByRole("button", { name: "保存到词库", exact: true }).click();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  await page.getByRole("button", { name: "下一题 →", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__spoken), [
    { text: "flower", lang: "en-GB" },
  ]);
  console.log(
    "PASS DOCX table extraction, Chinese saved separately, next plays only English",
  );
  await page.getByRole("button", { name: "导入词汇", exact: true }).click();
  await page
    .getByLabel("导入词汇文件")
    .setInputFiles(
      fileURLToPath(new URL("./fixtures/vocabulary.jpg", import.meta.url)),
    );
  await page
    .getByRole("status")
    .filter({ hasText: "提取到 3 个英文词条" })
    .waitFor({ timeout: 180000 });
  const value = await page.locator("textarea").inputValue();
  console.log("REAL OCR:", value);
  assert.match(value, /apple \| 苹果/);
  assert.match(value, /banana \| 香蕉/);
  assert.match(value, /garden \| 花园/);
  assert.deepEqual(errors, []);
  await page.getByRole("button", { name: "保存到词库", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ielts-study-garden-v1")),
  );
  assert.equal(saved.words.find((w) => w.word === "apple").meaning, "苹果");
  await page.reload();
  await page.locator("nav button").filter({ hasText: "Library" }).click();
  await page.getByText("apple", { exact: true }).waitFor();
  console.log(
    "PASS real JPG OCR on Pages subpath, local worker/WASM/models, save and reload",
  );
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
