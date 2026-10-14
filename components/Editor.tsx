"use client";
import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KImage,
  Text,
  Transformer,
  Rect,
} from "react-konva";
import Konva from "konva";
import SubjectCutout from "./SubjectCutout";
import { loadCustomArt, storeCustomArt, type CustomArt } from "../lib/storage";
import { motion } from "framer-motion";
import {
  developPrint,
  developReceipt,
  printFinishes,
  type PrintFinish,
} from "../lib/print";
import { asset } from "../lib/assets";
import { artMaterials } from "../lib/art";
export type Piece = {
  id: string;
  type: "image" | "text";
  src?: string;
  originalSrc?: string;
  originalHeight?: number;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  decorative?: boolean;
  generated?: boolean;
};
export type Memory = {
  id: string;
  title: string;
  date: string;
  location: string;
  style: string;
  pieces: Piece[];
  cover: string;
  createdAt: string;
  category?: string;
  botanicalCategory?: string;
  complexity?: string;
  printFinish?: PrintFinish;
  story?: string;
  mood?: "joy" | "nostalgia" | "growth" | "special";
  plantKind?: "flower" | "tree" | "star";
  song?: { name: string; src: string };
};
function Picture({
  p,
  onSelect,
  onChange,
}: {
  p: Piece;
  onSelect: () => void;
  onChange: (p: Piece) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement>();
  useEffect(() => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = asset(p.src!);
  }, [p.src]);
  return (
    <KImage
      image={img}
      {...p}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ ...p, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const n = e.target;
        onChange({
          ...p,
          x: n.x(),
          y: n.y(),
          width: Math.max(20, n.width() * n.scaleX()),
          height: Math.max(20, n.height() * n.scaleY()),
          rotation: n.rotation(),
        });
        n.scaleX(1);
        n.scaleY(1);
      }}
    />
  );
}
const styles = [
  "Mixed Reality",
  "Digital Dream",
  "Film Memory",
  "Botanical Archive",
];
export default function Editor({
  memory,
  onSave,
  onClose,
}: {
  memory?: Memory;
  onSave: (m: Memory) => Promise<void>;
  onClose: () => void;
}) {
  const [pieces, setPieces] = useState<Piece[]>(memory?.pieces || []),
    [complexity, setComplexity] = useState(memory?.complexity || "Mixed"),
    [selected, setSelected] = useState(""),
    [title, setTitle] = useState(memory?.title || "Untitled fragments"),
    [style, setStyle] = useState(memory?.style || "Botanical Archive"),
    [date, setDate] = useState(
      memory?.date || new Date().toISOString().slice(0, 10),
    ),
    [location, setLocation] = useState(memory?.location || ""),
    [category, setCategory] = useState(memory?.category || "RANDOM FRAGMENTS"),
    [message, setMessage] = useState(""),
    [scale, setScale] = useState(0.8),
    [finish, setFinish] = useState<PrintFinish>(
      memory?.printFinish || "original",
    ),
    [printed, setPrinted] = useState(""),
    [developing, setDeveloping] = useState(false),
    [customArt, setCustomArt] = useState<CustomArt[]>([]),
    [artReady, setArtReady] = useState(false),
    [cutout, setCutout] = useState<Piece>(),
    [addingArt, setAddingArt] = useState(false);
  const stage = useRef<Konva.Stage>(null),
    transformer = useRef<Konva.Transformer>(null),
    container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resize = () =>
      setScale(
        Math.min(
          0.9,
          Math.max(0.25, ((container.current?.clientWidth || 800) - 80) / 1000),
        ),
      );
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const n = selected ? stage.current?.findOne("#" + selected) : undefined;
    transformer.current?.nodes(n ? [n] : []);
  }, [selected, pieces]);
  const update = (p: Piece) =>
    setPieces((a) => a.map((x) => (x.id === p.id ? p : x)));
  const active = pieces.find((p) => p.id === selected);
  const addText = (text = "somewhere between\nyesterday and tomorrow") => {
    const id = "p" + crypto.randomUUID();
    setPieces((a) => [
      ...a,
      {
        id,
        type: "text",
        text,
        x: 160,
        y: 170,
        width: 360,
        height: 100,
        rotation: -3,
        color: style === "Botanical Archive" ? "#354131" : "#c9dce5",
        fontSize: 36,
        fontFamily: "Caveat",
      },
    ]);
    setSelected(id);
  };
  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const src = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      const i = new window.Image();
      await new Promise<void>((r, j) => {
        i.onload = () => r();
        i.onerror = j;
        i.src = src;
      });
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1600 / i.width, 1600 / i.height);
      canvas.width = i.width * ratio;
      canvas.height = i.height * ratio;
      canvas.getContext("2d")!.drawImage(i, 0, 0, canvas.width, canvas.height);
      const id = "p" + crypto.randomUUID();
      setPieces((a) => [
        ...a,
        {
          id,
          type: "image",
          src: canvas.toDataURL(
            f.type === "image/png" ? "image/png" : "image/jpeg",
            0.85,
          ),
          x: 100 + (a.length % 3) * 150,
          y: 100 + (a.length % 3) * 100,
          width: 280,
          height: (280 * i.height) / i.width,
          rotation: a.length % 2 ? 5 : -5,
        },
      ]);
      setSelected(id);
    }
  };
  useEffect(() => {
    loadCustomArt()
      .then((items) => {
        setCustomArt(items);
        setArtReady(true);
      })
      .catch(() => setMessage("自己的素材库暂时无法读取，请刷新后再试。"));
  }, []);
  const uploadArt = async (files: FileList | null) => {
    if (!files || !artReady) return;
    setAddingArt(true);
    try {
      const items: CustomArt[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = src;
        });
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 1400 / image.width, 1400 / image.height);
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        canvas
          .getContext("2d")!
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        items.push({
          name: f.name.replace(/\.[^.]+$/, ""),
          src: canvas.toDataURL("image/png"),
          width: 220,
          height: (220 * image.height) / image.width,
        });
      }
      const next = [...customArt, ...items].filter(
        (m, i, a) => a.findIndex((x) => x.src === m.src) === i,
      );
      await storeCustomArt(next);
      setCustomArt(next);
      setMessage("自己的艺术素材已加入，可点击放进画布。");
    } catch {
      setMessage("素材暂时没能保存，请尝试较小的图片。");
    } finally {
      setAddingArt(false);
    }
  };
  const addArt = (material: (typeof artMaterials)[number]) => {
    const id = "p" + crypto.randomUUID();
    setPieces((a) => [
      ...a,
      {
        id,
        type: "image",
        src: material.src,
        x: 600,
        y: 350,
        width: material.width,
        height: material.height,
        rotation: -5,
        decorative: true,
      },
    ]);
    setSelected(id);
  };
  useEffect(() => {
    if (!printed) return;
    const previous = document.activeElement as HTMLElement | null;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPrinted("");
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".print-booth button, .print-booth a",
          ),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [printed]);
  const generate = () => {
    setSelected("");
    setPieces((a) => {
      const userDecorations = a.filter((p) => p.decorative && !p.generated);
      const content = a.filter((p) => !p.decorative);
      const images = content.filter((p) => p.type === "image"),
        texts = content.filter((p) => p.type === "text");
      const cols = images.length <= 2 ? 2 : images.length <= 6 ? 3 : 4;
      const rows = Math.max(1, Math.ceil(images.length / cols));
      const cellW = (complexity === "Simple" ? 860 : 780) / cols,
        cellH = 470 / rows;
      const arranged = images.map((p, i) => {
        const ratio = p.height / p.width;
        const w = Math.min(cellW - 22, (cellH - 20) / ratio);
        return {
          ...p,
          x: 70 + (i % cols) * cellW + (cellW - w) / 2,
          y:
            115 +
            Math.floor(i / cols) * cellH +
            (i % 2 && complexity !== "Simple" ? 12 : 0),
          width: w,
          height: w * ratio,
          rotation:
            complexity === "Simple" || style === "Botanical Archive"
              ? 0
              : i % 2
                ? 5
                : -5,
        };
      });
      const words = texts.map((p, i) => ({
        ...p,
        x: 75 + (i % 2) * 440,
        y: 600 + Math.floor(i / 2) * 38,
        width: 410,
        height: 95,
        fontSize: Math.min(p.fontSize || 32, 28),
        color: style === "Botanical Archive" ? "#354131" : "#c9dce5",
        fontFamily:
          style === "Digital Dream"
            ? "monospace"
            : style === "Film Memory"
              ? "Courier New"
              : "Caveat",
        rotation: complexity === "Layered" ? -3 : 0,
      }));
      const decorations =
        complexity === "Simple"
          ? []
          : (complexity === "Layered"
              ? [artMaterials[0], artMaterials[1], artMaterials[4]]
              : [
                  style === "Botanical Archive"
                    ? artMaterials[0]
                    : artMaterials[1],
                ]
            ).map((m, i) => ({
              id: "p" + crypto.randomUUID(),
              type: "image" as const,
              src: m.src,
              x: i === 0 ? 820 : i === 1 ? 740 : 30,
              y: i === 0 ? 380 : i === 1 ? 70 : 530,
              width: m.width * (i === 2 ? 0.65 : 0.8),
              height: m.height * (i === 2 ? 0.65 : 0.8),
              rotation: i === 1 ? 12 : -6,
              decorative: true,
              generated: true,
            }));
      return [...arranged, ...words, ...userDecorations, ...decorations];
    });
    setMessage("Fragments assembled. Make it yours.");
    setTimeout(() => setMessage(""), 3500);
  };
  const snapshot = () => {
    setSelected("");
    transformer.current?.nodes([]);
    return developPrint(
      stage.current!.toCanvas({ pixelRatio: 2 / scale }),
      finish,
    ).toDataURL("image/png");
  };
  const save = async () => {
    try {
      setSelected("");
      transformer.current?.nodes([]);
      await onSave({
        id: memory?.id || crypto.randomUUID(),
        ...memory,
        title,
        date,
        location,
        style,
        category,
        complexity,
        pieces,
        printFinish: finish,
        cover: developPrint(
          stage.current!.toCanvas({ pixelRatio: 0.5 / scale }),
          finish,
        ).toDataURL("image/jpeg", 0.8),
        createdAt: memory?.createdAt || new Date().toISOString(),
      });
      setMessage("Saved to your personal archive.");
    } catch {
      setMessage(
        "Could not save. Browser storage may be full. Export a PNG to keep your work.",
      );
    }
  };
  return (
    <div className="editor-shell">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE CREATIVE CORNER</span>
          <input
            aria-label="Memory title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}>← 返回剪贴簿</button>
          <button
            onClick={() => {
              try {
                const a = document.createElement("a");
                a.download = title + ".png";
                a.href = snapshot();
                a.click();
              } catch {
                setMessage("Export failed. Please try using uploaded images.");
              }
            }}
          >
            ↓ 下载 PNG
          </button>
          <button
            onClick={() => {
              if (!pieces.some((p) => p.type === "image" && !p.decorative)) {
                setMessage("先放入一张照片，再开始冲印。");
                return;
              }
              try {
                setSelected("");
                transformer.current?.nodes([]);
                setPrinted(
                  developReceipt(
                    stage.current!.toCanvas({ pixelRatio: 2 / scale }),
                    title,
                    date,
                  ).toDataURL("image/png"),
                );
                setDeveloping(true);
              } catch {
                setMessage("冲印暂时失败，请再试一次。");
              }
            }}
          >
            小票冲印 ✦
          </button>
          <button className="primary" onClick={save}>
            保存拼贴 ↗
          </button>
        </div>
      </div>
      <div className="editor-body">
        <aside className="editor-tools">
          <span className="eyebrow">YOUR MATERIALS</span>
          <label className="upload">
            ＋ Upload photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                void upload(e.target.files).catch(() =>
                  setMessage(
                    "This image could not be opened. Please try a JPG, PNG or WebP file.",
                  ),
                );
                e.target.value = "";
              }}
            />
          </label>
          <button onClick={() => addText()}>T　Add a text fragment</button>
          <div className="sticker-row">
            {["✦", "☆", "🦋", "🌿", "♡", "▧"].map((s) => (
              <button key={s} onClick={() => addText(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="eyebrow">ART MATERIALS / 艺术素材</span>
          <label className="upload">
            ＋ 添加自己的艺术素材
            <input
              aria-label="添加自己的艺术素材"
              type="file"
              multiple
              accept="image/*"
              disabled={!artReady || addingArt}
              onChange={(e) => {
                void uploadArt(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <div className="art-materials">
            {[...artMaterials, ...customArt].map((m) => (
              <button
                title={m.name}
                aria-label={m.name}
                key={m.src}
                onClick={() => addArt(m)}
              >
                <img src={m.src} alt="" />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
          <span className="eyebrow">冲印色调 / PRINT FINISH</span>
          <select
            aria-label="冲印风格"
            value={finish}
            onChange={(e) => setFinish(e.target.value as PrintFinish)}
          >
            {printFinishes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <p className="print-help">
            选择色调，自动拼贴或自由摆放。下载 PNG 保留所选色调；小票冲印会生成黑白网点的长条记忆小票。
          </p>
          <span className="eyebrow">MEMORY STYLE</span>
          <select
            aria-label="Memory style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {styles.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="eyebrow">COMPOSITION / 拼贴密度</span>
          <div className="density-picker">
            {["Simple", "Mixed", "Layered"].map((c, i) => (
              <button
                aria-pressed={complexity === c}
                key={c}
                onClick={() => setComplexity(c)}
              >
                {["简约", "混合", "层叠"][i]}
              </button>
            ))}
          </div>
          <button className="primary" onClick={generate}>
            ✧ 自动拼贴 / Auto arrange
          </button>
          <span className="eyebrow">ARCHIVE CHAPTER</span>
          <select
            aria-label="Archive chapter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["TRAVEL", "PEOPLE", "THINGS I LOVE", "RANDOM FRAGMENTS"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
          <span className="eyebrow">WHEN & WHERE</span>
          <input
            aria-label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            aria-label="Location"
            placeholder="A place worth remembering…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {active && (
            <>
              <span className="eyebrow">SELECTED FRAGMENT</span>
              {active.type === "image" && (
                <div className="subject-tools">
                  <button onClick={() => setCutout(active)}>
                    ✂ 圈选主体 / 抠图
                  </button>
                  {active.originalSrc && (
                    <button
                      onClick={() =>
                        update({
                          ...active,
                          src: active.originalSrc,
                          height: active.originalHeight || active.height,
                          originalSrc: undefined,
                          originalHeight: undefined,
                        })
                      }
                    >
                      恢复原图
                    </button>
                  )}
                </div>
              )}
              {active.type === "text" && (
                <>
                  <textarea
                    aria-label="Text content"
                    value={active.text}
                    onChange={(e) =>
                      update({ ...active, text: e.target.value })
                    }
                  />
                  <select
                    aria-label="Font style"
                    value={active.fontFamily || "Georgia"}
                    onChange={(e) =>
                      update({ ...active, fontFamily: e.target.value })
                    }
                  >
                    {[
                      "Caveat",
                      "Ma Shan Zheng",
                      "Georgia",
                      "monospace",
                      "Courier New",
                      "cursive",
                      "Impact",
                    ].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    aria-label="Text color"
                    type="color"
                    value={active.color || "#ffffff"}
                    onChange={(e) =>
                      update({ ...active, color: e.target.value })
                    }
                  />
                  <label>
                    Text size
                    <input
                      aria-label="Text size"
                      type="range"
                      min="14"
                      max="100"
                      value={active.fontSize || 32}
                      onChange={(e) =>
                        update({ ...active, fontSize: +e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              <button
                onClick={() =>
                  setPieces((a) => [
                    ...a.filter((p) => p.id !== selected),
                    active,
                  ])
                }
              >
                Bring to front ↑
              </button>
              <button
                onClick={() =>
                  setPieces((a) => [
                    active,
                    ...a.filter((p) => p.id !== selected),
                  ])
                }
              >
                Send to back ↓
              </button>
              <button
                onClick={() => {
                  setPieces((a) => a.filter((p) => p.id !== selected));
                  setSelected("");
                }}
              >
                Delete fragment ×
              </button>
            </>
          )}
        </aside>
        <div className="canvas-area" ref={container}>
          <div className="canvas-status">
            <span>CANVAS_01 • {style.toUpperCase()}</span>
            <span>
              <button onClick={() => setScale((s) => Math.max(0.25, s - 0.1))}>
                −
              </button>{" "}
              {Math.round(scale * 100)}%{" "}
              <button onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}>
                ＋
              </button>
            </span>
          </div>
          <div
            className="canvas-scroll"
            style={{
              filter: printFinishes.find((f) => f.id === finish)?.filter,
            }}
          >
            <Stage
              width={1000 * scale}
              height={750 * scale}
              scaleX={scale}
              scaleY={scale}
              ref={stage}
              onMouseDown={(e) => {
                if (
                  e.target === e.target.getStage() ||
                  e.target.name() === "background"
                )
                  setSelected("");
              }}
            >
              <Layer>
                <Rect
                  name="background"
                  width={1000}
                  height={750}
                  fill={
                    style === "Botanical Archive"
                      ? "#f1eadb"
                      : style === "Film Memory"
                        ? "#262626"
                        : "#0b1723"
                  }
                />
                <Rect
                  listening={false}
                  x={24}
                  y={24}
                  width={952}
                  height={702}
                  stroke={style === "Botanical Archive" ? "#727b5a" : "#6d8eaa"}
                  opacity={0.4}
                  strokeWidth={1}
                />
                {style === "Botanical Archive" &&
                  Array.from({ length: 40 }, (_, i) => (
                    <Rect
                      key={i}
                      listening={false}
                      x={35}
                      y={110 + i * 14}
                      width={930}
                      height={0.4}
                      fill="#827554"
                      opacity={0.1}
                    />
                  ))}
                <Text
                  text={title.toUpperCase()}
                  x={45}
                  y={35}
                  fill={style === "Botanical Archive" ? "#333d2f" : "#91b4c9"}
                  fontFamily="monospace"
                  fontSize={22}
                />
                <Text
                  text={date + "  /  " + location}
                  x={45}
                  y={710}
                  fill="#748b96"
                  fontFamily="monospace"
                  fontSize={14}
                />
                {pieces.map((p) =>
                  p.type === "image" ? (
                    <Picture
                      key={p.id}
                      p={p}
                      onSelect={() => setSelected(p.id)}
                      onChange={update}
                    />
                  ) : (
                    <Text
                      key={p.id}
                      {...p}
                      fill={p.color}
                      fontFamily={p.fontFamily || "Georgia"}
                      draggable
                      onClick={() => setSelected(p.id)}
                      onTap={() => setSelected(p.id)}
                      onDragEnd={(e) =>
                        update({ ...p, x: e.target.x(), y: e.target.y() })
                      }
                      onTransformEnd={(e) => {
                        const n = e.target;
                        update({
                          ...p,
                          x: n.x(),
                          y: n.y(),
                          width: n.width() * n.scaleX(),
                          fontSize: (p.fontSize || 32) * n.scaleY(),
                          rotation: n.rotation(),
                        });
                        n.scaleX(1);
                        n.scaleY(1);
                      }}
                    />
                  ),
                )}
                <Transformer
                  ref={transformer}
                  borderStroke="#b9e5ff"
                  anchorStroke="#b9e5ff"
                  anchorFill="#122633"
                />
              </Layer>
            </Stage>
            {pieces.length === 0 && (
              <div className="empty-canvas">
                ✧<h3>A place for your fragments.</h3>
                <p>Upload a photograph or add a thought to begin.</p>
              </div>
            )}
          </div>
          <p className="canvas-hint">
            Drag to move · Select to resize & rotate · Scroll to explore
          </p>
          {message && (
            <div role="status" className="toast">
              {message}
            </div>
          )}
        </div>
      </div>
      {printed && (
        <div
          className="print-booth"
          role="dialog"
          aria-modal="true"
          aria-label="记忆小票冲印成品"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPrinted("");
          }}
        >
          <button
            autoFocus
            className="print-close"
            onClick={() => setPrinted("")}
          >
            关闭 ×
          </button>
          <h2>{developing ? "正在打印这一刻…" : "你的记忆小票，打印好了。"}</h2>
          <div className="ccd-machine receipt-printer" aria-hidden="true">
            <span className="printer-indicator" />
            <b>MEMORY PRINT</b>
            <i />
            <div className="ccd-slot" />
          </div>
          <div className="print-output-window">
            <motion.figure
              className="developed-paper receipt-paper"
              initial={{ y: "-105%", rotate: 0, opacity: 0.3 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              transition={{ duration: 2.8, ease: "easeInOut" }}
              onAnimationComplete={() => setDeveloping(false)}
            >
              <img src={printed} alt={`${title}的黑白网点记忆小票`} />
            </motion.figure>
          </div>
          <p role="status">
            {developing
              ? "小票慢慢吐出，旧时光慢慢回来。"
              : "900 × 1500 · 把这一段时光收进口袋。"}
          </p>
          <a
            className="print-download"
            href={printed}
            download={`${title}-记忆小票.png`}
            aria-disabled={developing}
            onClick={(e) => {
              if (developing) e.preventDefault();
            }}
          >
            下载记忆小票 ↓
          </a>
        </div>
      )}
      {cutout && (
        <SubjectCutout
          src={cutout.src!}
          onClose={() => setCutout(undefined)}
          onApply={(src, ratio) => {
            update({
              ...cutout,
              originalSrc: cutout.originalSrc || cutout.src,
              originalHeight: cutout.originalHeight || cutout.height,
              src,
              height: cutout.width * ratio,
            });
            setCutout(undefined);
            setMessage("主体已变成透明剪贴，可以拖动、旋转和叠放。");
          }}
        />
      )}
    </div>
  );
}
