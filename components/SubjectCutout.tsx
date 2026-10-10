"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "../lib/assets";
export default function SubjectCutout({
  src,
  onApply,
  onClose,
}: {
  src: string;
  onApply: (src: string, ratio: number) => void;
  onClose: () => void;
}) {
  const [image, setImage] = useState<HTMLImageElement>();
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setImage(im);
    im.onerror = () => setError("图片暂时无法读取，请换一张图片。");
    im.src = asset(src);
  }, [src]);
  const w = image
      ? Math.round(
          image.width * Math.min(1, 1200 / image.width, 900 / image.height),
        )
      : 1,
    h = image
      ? Math.round(
          image.height * Math.min(1, 1200 / image.width, 900 / image.height),
        )
      : 1;
  useEffect(() => {
    if (!image || !canvas.current) return;
    const ctx = canvas.current.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    if (points.length) {
      ctx.beginPath();
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      if (points.length > 2) ctx.closePath();
      ctx.fillStyle = "#829dc433";
      ctx.fill();
      ctx.strokeStyle = "#e7edff";
      ctx.lineWidth = Math.max(2, w / 400);
      ctx.stroke();
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3, w / 180), 0, Math.PI * 2);
        ctx.fillStyle = "#617fc5";
        ctx.fill();
      });
    }
  }, [image, points, w, h]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".cutout-modal button:not(:disabled), .cutout-modal canvas",
          ),
        );
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  const apply = () => {
    if (!image || points.length < 3) return;
    try {
      const output = document.createElement("canvas");
      output.width = w;
      output.height = h;
      const ctx = output.getContext("2d")!;
      ctx.beginPath();
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, 0, 0, w, h);
      const x = Math.floor(Math.min(...points.map((p) => p.x))),
        y = Math.floor(Math.min(...points.map((p) => p.y)));
      const cw = Math.ceil(Math.max(...points.map((p) => p.x))) - x,
        ch = Math.ceil(Math.max(...points.map((p) => p.y))) - y;
      if (cw < 5 || ch < 5) {
        setError("请圈选一个更完整的主体区域。");
        return;
      }
      const cropped = document.createElement("canvas");
      cropped.width = cw;
      cropped.height = ch;
      cropped.getContext("2d")!.drawImage(output, x, y, cw, ch, 0, 0, cw, ch);
      onApply(cropped.toDataURL("image/png"), ch / cw);
    } catch {
      setError("抠图未能完成，请使用自己上传的图片。");
    }
  };
  return (
    <div className="cutout-backdrop">
      <section
        className="cutout-modal"
        role="dialog"
        aria-modal="true"
        aria-label="圈选图片主体"
      >
        <button autoFocus onClick={onClose} className="cutout-close">
          关闭 ×
        </button>
        <h2>把主体，剪进记忆里。</h2>
        <p>沿主体边缘点击或轻触，至少标记 3 个点。圈内保留，圈外变透明。</p>
        {image && (
          <canvas
            ref={canvas}
            width={w}
            height={h}
            aria-label="点击图片圈选主体"
            tabIndex={0}
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPoints((p) => [
                ...p,
                {
                  x: ((e.clientX - r.left) * w) / r.width,
                  y: ((e.clientY - r.top) * h) / r.height,
                },
              ]);
            }}
          />
        )}
        <div className="cutout-actions">
          <button
            disabled={!points.length}
            onClick={() => setPoints((p) => p.slice(0, -1))}
          >
            撤销一个点
          </button>
          <button onClick={() => setPoints([])}>重新圈选</button>
          <button disabled={points.length < 3} onClick={apply}>
            保留主体，生成透明剪贴 ↗
          </button>
        </div>
        <p role="status">
          {error || `已标记 ${points.length} 个点 · 原图会保留，可随时恢复`}
        </p>
      </section>
    </div>
  );
}
