import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { vocabularyText } from "../import-text";
import type { Worker } from "tesseract.js";
type Props = {
  onExtract: (text: string) => void;
  onError: (text: string) => void;
  disabled?: boolean;
  onWorkingChange: (value: boolean) => void;
};
export function VocabularyFileImport({
  onExtract,
  onError,
  disabled,
  onWorkingChange,
}: Props) {
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [report, setReport] = useState("");
  const [raw, setRaw] = useState("");
  const generation = useRef(0);
  const worker = useRef<Worker | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      void worker.current?.terminate();
      worker.current = null;
      onWorkingChange(false);
    },
    [],
  );
  async function readFile(file: File) {
    const run = ++generation.current;
    setWorking(true);
    onWorkingChange(true);
    setReport("");
    setRaw("");
    setProgress("正在读取文件…");
    try {
      if (file.size > 20 * 1024 * 1024)
        throw Error("请选择20MB以内的文件；大图片请先裁剪成词汇区域。");
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "docx") {
        const mammoth = await import("mammoth");
        const extracted = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        text = extracted.value;
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        setProgress("正在加载中英文识别模型，首次约需下载10MB，请稍候…");
        const { createWorker } = await import("tesseract.js");
        const base = new URL(import.meta.env.BASE_URL, window.location.origin);
        const created = await createWorker(["chi_sim", "eng"], 1, {
          workerPath: new URL("ocr/worker.min.js", base).href,
          corePath: new URL("ocr/core/", base).href,
          langPath: new URL("ocr/", base).href,
          workerBlobURL: false,
          cachePath: "ielts-ocr-best-int-v1",
          logger: (m) => {
            if (generation.current === run)
              setProgress(
                m.status === "recognizing text"
                  ? `正在识别中英文… ${Math.round(m.progress * 100)}%`
                  : m.status.includes("language")
                    ? "正在加载中英文识别模型…"
                    : "正在准备图片识别…",
              );
          },
        });
        if (generation.current !== run) {
          await created.terminate();
          return;
        }
        worker.current = created;
        await created.setParameters({
          tessedit_pageseg_mode: "6" as import("tesseract.js").PSM,
          preserve_interword_spaces: "1",
        });
        const result = await created.recognize(file);
        text = result.data.text;
      } else if (ext === "doc")
        throw Error("旧版 .doc 暂不支持，请用 Word 另存为 .docx 后导入。");
      else if (["txt", "csv", "tsv"].includes(ext || ""))
        text = await file.text();
      else throw Error("请选择 DOCX、JPG、PNG、WebP、TXT、CSV 或 TSV 文件。");
      if (generation.current !== run) return;
      const extracted = vocabularyText(text);
      setRaw(text);
      if (!extracted.entries.length)
        throw Error(
          "没有识别到英文词汇，请使用清晰的词汇表，或复制文字手动导入。",
        );
      onExtract(extracted.text);
      setReport(
        `提取到 ${extracted.entries.length} 个英文词条，其中 ${extracted.entries.filter((e) => e.meaning).length} 个带中文。请在下方检查和修正，再点击“保存到词库”。${extracted.unmatched.length ? `另有 ${extracted.unmatched.length} 行未自动配对，可展开原文查看。` : ""}`,
      );
    } catch (e) {
      if (generation.current === run)
        onError(
          e instanceof Error
            ? e.message
            : "文件读取失败，请检查文件格式和网络。",
        );
    } finally {
      if (generation.current === run) {
        await worker.current?.terminate();
        worker.current = null;
        setWorking(false);
        onWorkingChange(false);
        setProgress("");
      }
    }
  }
  return (
    <div className="file-import">
      <label
        className={`file-button ${working || disabled ? "file-disabled" : ""}`}
      >
        <Upload size={16} />
        {working ? "正在提取…" : "导入 Word / JPG / 文本"}
        <input
          aria-label="导入词汇文件"
          type="file"
          disabled={working || disabled}
          accept=".docx,.doc,.jpg,.jpeg,.png,.webp,.txt,.csv,.tsv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void readFile(file);
          }}
        />
      </label>
      {working && <p role="status">{progress}</p>}
      {report && <p role="status">{report}</p>}
      {raw && (
        <details>
          <summary>查看提取原文（核对中文与单词配对）</summary>
          <pre>{raw}</pre>
        </details>
      )}
    </div>
  );
}
