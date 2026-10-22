import { mkdir, copyFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const target = fileURLToPath(new URL("../public/ocr/", import.meta.url));
await mkdir(join(target, "core"), { recursive: true });
await copyFile(
  require.resolve("tesseract.js/dist/worker.min.js"),
  join(target, "worker.min.js"),
);
const core = dirname(require.resolve("tesseract.js-core/package.json"));
for (const file of await readdir(core))
  if (/lstm\.(wasm|wasm\.js)$/.test(file))
    await copyFile(join(core, file), join(target, "core", file));
await copyFile(join(core, "LICENSE"), join(target, "core", "LICENSE"));
for (const lang of ["eng", "chi_sim"]) {
  const data = require(`@tesseract.js-data/${lang}`);
  await copyFile(
    join(dirname(data.langPath), "4.0.0_best_int", `${lang}.traineddata.gz`),
    join(target, `${lang}.traineddata.gz`),
  );
}
console.log(
  "Prepared local OCR worker, WASM core and English/Chinese recognition models.",
);
