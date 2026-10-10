"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  BookOpen,
  Music,
  Play,
  Pause,
  Heart,
  Sun,
  CloudRain,
  Sparkles,
  Leaf,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Check,
  Trash2,
} from "lucide-react";
import GardenScene, {
  LittlePlant,
  type Season,
} from "../components/GardenScene";
import { asset } from "../lib/assets";
import {
  loadMemories,
  storeMemories,
  loadCollection,
  storeCollection,
  type Keepsake,
} from "../lib/storage";
import type { Memory } from "../components/Editor";
const Editor = dynamic(() => import("../components/Editor"), { ssr: false });
type View = "garden" | "timeline" | "room" | "plant" | "collection" | "editor";
type Mood = "joy" | "nostalgia" | "growth" | "special";
const moods: {
  id: Mood;
  label: string;
  caption: string;
  icon: typeof Sun;
  weather: string;
}[] = [
  {
    id: "joy",
    label: "快乐",
    caption: "让阳光照进来",
    icon: Sun,
    weather: "sun",
  },
  {
    id: "nostalgia",
    label: "怀念",
    caption: "落一场温柔的雨",
    icon: CloudRain,
    weather: "rain",
  },
  {
    id: "growth",
    label: "成长",
    caption: "在风里慢慢长大",
    icon: Leaf,
    weather: "sun",
  },
  {
    id: "special",
    label: "特别",
    caption: "把这一刻变成星光",
    icon: Sparkles,
    weather: "stars",
  },
];
const seasonNames = {
  spring: "春天 · 有些故事正在发芽",
  summer: "夏天 · 阳光落在旧日子里",
  autumn: "秋天 · 收藏金色的回声",
  winter: "冬天 · 时间也会温柔地停留",
};
const animalStories: { [key: string]: { title: string; story: string } } = {
  bird: {
    title: "小鸟寄来的信",
    story:
      "有些声音，很多年以后还会在心里响起。也许是一句晚安，也许是有人叫你回家。小鸟替你把它们轻轻收好。",
  },
  rabbit: {
    title: "小兔的秘密",
    story:
      "树下埋着一颗小小的种子。小兔每天来看看它，直到有一天，种子开出了花。有些美好不需要着急。",
  },
  butterfly: {
    title: "蝴蝶记得的事",
    story:
      "她从未忘记自己还是毛毛虫的日子。那些慢慢走过的路，最后都变成了翅膀。",
  },
  dog: {
    title: "一直等你的小狗",
    story:
      "每一次回到花园，小狗都像第一次见到你那样高兴。有些爱，从来不问你离开了多久。",
  },
};
const blank = {
  title: "",
  story: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  mood: "joy" as Mood,
  kind: "flower" as "flower" | "tree" | "star",
  photos: [] as string[],
  song: undefined as Memory["song"],
};
async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件。");
  const src = await new Promise<string>((r, j) => {
    const f = new FileReader();
    f.onload = () => r(String(f.result));
    f.onerror = j;
    f.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise<void>((r, j) => {
    img.onload = () => r();
    img.onerror = j;
    img.src = src;
  });
  const c = document.createElement("canvas"),
    scale = Math.min(1, 1400 / img.width, 1400 / img.height);
  c.width = img.width * scale;
  c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL(
    file.type === "image/png" ? "image/png" : "image/jpeg",
    0.84,
  );
}
function yearOf(m: Memory) {
  return Number(m.date?.slice(0, 4)) || new Date(m.createdAt).getFullYear();
}
function kindOf(m: Memory) {
  return (
    m.plantKind ||
    (m.category === "PEOPLE"
      ? "tree"
      : m.mood === "special"
        ? "star"
        : "flower")
  );
}
export default function Home() {
  const [view, setView] = useState<View>("garden"),
    [memories, setMemories] = useState<Memory[]>([]),
    [collection, setCollection] = useState<Keepsake[]>([]),
    [year, setYear] = useState(2026),
    [season, setSeason] = useState<Season>("spring"),
    [weather, setWeather] = useState("sun"),
    [selected, setSelected] = useState<Memory>(),
    [animal, setAnimal] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [storageReady, setStorageReady] = useState(false),
    [form, setForm] = useState({ ...blank }),
    [step, setStep] = useState(1),
    [growing, setGrowing] = useState(false),
    [uploading, setUploading] = useState(false),
    [keepsake, setKeepsake] = useState({
      title: "",
      kind: "书",
      note: "",
      image: "",
    }),
    [collectionForm, setCollectionForm] = useState(false),
    [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null),
    growthTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    Promise.all([loadMemories(), loadCollection()])
      .then(([m, c]) => {
        setMemories(m);
        setCollection(c);
        setStorageReady(true);
      })
      .catch(() =>
        setMessage(
          "浏览器存储暂不可用，请允许本地存储后刷新；已有记忆不会被覆盖。",
        ),
      )
      .finally(() => setLoading(false));
    return () => {
      if (growthTimer.current) clearTimeout(growthTimer.current);
    };
  }, []);
  useEffect(() => {
    setPlaying(false);
  }, [selected?.id, view]);
  useEffect(() => {
    if (!animal && !collectionForm) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input,textarea,select",
        ) || [],
      );
    const timer = setTimeout(() => focusable()[0]?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAnimal("");
        setCollectionForm(false);
      }
      if (e.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
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
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [animal, collectionForm]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(t);
  }, [message]);
  const years = Array.from(
    new Set([2016, 2018, 2022, 2024, 2026, year, ...memories.map(yearOf)]),
  ).sort((a, b) => a - b);
  const currentMemories = memories.filter((m) => yearOf(m) === year);
  const yearIndex = years.indexOf(year);
  const treeYears = years.slice(
    Math.max(0, Math.min(yearIndex - 3, years.length - 7)),
    Math.max(7, yearIndex + 4),
  );
  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeYear = (y: number, open = false) => {
    setYear(y);
    setSeason(
      (["spring", "summer", "autumn", "winter"] as Season[])[
        Math.max(0, years.indexOf(y)) % 4
      ],
    );
    const newest = memories.find((m) => yearOf(m) === y);
    setWeather(moods.find((m) => m.id === newest?.mood)?.weather || "sun");
    if (open) {
      setSelected(undefined);
      go("room");
    }
  };
  const startPlant = () => {
    setForm({
      ...blank,
      date: year === new Date().getFullYear() ? blank.date : `${year}-06-01`,
      photos: [],
    });
    setStep(1);
    go("plant");
  };
  const openMemory = (m: Memory) => {
    setSelected(m);
    setYear(yearOf(m));
    setWeather(moods.find((x) => x.id === m.mood)?.weather || "sun");
    go("room");
  };
  const persist = async (next: Memory[]) => {
    if (!storageReady) throw new Error("本地存储未就绪");
    await storeMemories(next);
    setMemories(next);
  };
  const saveBoard = async (m: Memory) => {
    await persist([m, ...memories.filter((x) => x.id !== m.id)]);
    setSelected(m);
  };
  const plant = async () => {
    if (growing || uploading) return;
    if (!form.title.trim() || !form.story.trim()) {
      setStep(1);
      setMessage("给这段记忆一个名字，留下一句话，再种下它。");
      return;
    }
    setGrowing(true);
    try {
      const m: Memory = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        story: form.story.trim(),
        date: form.date,
        location: form.location,
        mood: form.mood,
        plantKind: form.kind,
        song: form.song,
        style: "Botanical Archive",
        category:
          form.kind === "tree"
            ? "PEOPLE"
            : form.kind === "star"
              ? "THINGS I LOVE"
              : "TRAVEL",
        createdAt: new Date().toISOString(),
        cover: form.photos[0] || asset("/art/botanical-page.svg"),
        pieces: [
          ...form.photos.map((src, i) => ({
            id: "p" + crypto.randomUUID(),
            type: "image" as const,
            src,
            x: 65 + (i % 3) * 290,
            y: 95 + Math.floor(i / 3) * 175,
            width: 265,
            height: 160,
            rotation: i % 2 ? 4 : -3,
          })),
          {
            id: "p" + crypto.randomUUID(),
            type: "text",
            text: form.story,
            x: 65,
            y: 590,
            width: 850,
            height: 100,
            rotation: 0,
            color: "#526046",
            fontSize: 28,
            fontFamily: "Ma Shan Zheng",
          },
        ],
      };
      await persist([m, ...memories]);
      setYear(yearOf(m));
      setSelected(m);
      setWeather(moods.find((x) => x.id === form.mood)!.weather);
      setGrowing(true);
      growthTimer.current = setTimeout(() => {
        setGrowing(false);
        go("garden");
        setMessage("一段记忆，已经在你的花园里扎根。");
      }, 2400);
    } catch {
      setGrowing(false);
      setMessage("没能保存这颗种子。请检查浏览器存储空间，再试一次。");
    }
  };
  const uploadPhotos = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const remaining = 8 - form.photos.length;
      const photos = await Promise.all(
        Array.from(files).slice(0, remaining).map(readPhoto),
      );
      setForm((f) => ({ ...f, photos: [...f.photos, ...photos] }));
      if (files.length > remaining) setMessage("每段记忆最多收藏 8 张照片。");
    } catch {
      setMessage("有一张照片没有读出来，请试试 JPG、PNG 或 WebP。");
    } finally {
      setUploading(false);
    }
  };
  const saveKeepsake = async () => {
    if (!keepsake.title.trim()) {
      setMessage("先为这件小收藏起个名字。");
      return;
    }
    try {
      if (!storageReady) throw Error();
      const next = [{ ...keepsake, id: crypto.randomUUID() }, ...collection];
      await storeCollection(next);
      setCollection(next);
      setCollectionForm(false);
      setKeepsake({ title: "", kind: "书", note: "", image: "" });
      setMessage("你喜欢的小东西，已放进收藏匣。");
    } catch {
      setMessage("收藏暂时没能保存，请检查浏览器存储。");
    }
  };
  const deleteMemory = async (m: Memory) => {
    if (!confirm("要把这段记忆从花园中移走吗？")) return;
    try {
      await persist(memories.filter((x) => x.id !== m.id));
      setSelected(undefined);
      setMessage("记忆已移走。");
    } catch {
      setMessage("删除失败，请稍后再试。");
    }
  };
  return (
    <main className={"storybook weather-" + weather}>
      <div className="paper-texture" />
      <header className="book-header">
        <button
          className="garden-brand"
          onClick={() => go("garden")}
          aria-label="返回记忆花园"
        >
          <span>✳</span>
          <span>
            memory garden<small>a little life, gently growing</small>
          </span>
        </button>
        <nav aria-label="主要导航">
          {(
            [
              { v: "garden", label: "花园" },
              { v: "timeline", label: "时间树" },
              { v: "collection", label: "收藏匣" },
            ] as { v: View; label: string }[]
          ).map((n) => (
            <button
              key={n.v}
              aria-current={view === n.v ? "page" : undefined}
              onClick={() => go(n.v)}
            >
              {n.label}
            </button>
          ))}
          <button className="nav-plant" onClick={startPlant}>
            <Plus size={13} />
            种下记忆
          </button>
        </nav>
      </header>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          className="book-page"
          initial={{ opacity: 0, rotateY: -4, x: 12 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          exit={{ opacity: 0, rotateY: 4, x: -12 }}
          transition={{ duration: 0.4 }}
        >
          {view === "garden" && (
            <>
              <section className="garden-intro">
                <span className="chapter-label">
                  CHAPTER ONE · A PLACE TO RETURN TO
                </span>
                <h1>
                  Every memory deserves
                  <br />
                  <em>a little garden.</em>
                  <span className="ink-star">✧</span>
                </h1>
                <p>每个人的心里，都有一座慢慢生长的花园。</p>
                <span className="intro-handwriting">
                  Come in. Something lovely has been waiting for you.
                </span>
              </section>
              <section className="garden-world" aria-label="互动记忆花园">
                <GardenScene
                  season={season}
                  weather={weather}
                  years={treeYears}
                  selectedYear={year}
                  onYear={(y) => changeYear(y, true)}
                  plants={currentMemories.map((m) => ({
                    id: m.id,
                    title: m.title,
                    kind: kindOf(m),
                  }))}
                  onPlant={(id) => {
                    const m = memories.find((x) => x.id === id);
                    if (m) openMemory(m);
                  }}
                  onAnimal={setAnimal}
                />
                <div className="garden-marginalia">
                  <span>
                    the tree remembers
                    <br />
                    what the world forgets.
                  </span>
                  <small>
                    点一点年份的果实，重访那一年的故事。
                    <br />
                    小动物也藏着悄悄话。
                  </small>
                </div>
                <div className="garden-caption">
                  <span className="tiny-flower">✳</span>
                  <span>
                    {loading
                      ? "正在翻开你的故事书…"
                      : currentMemories.length
                        ? `${year} 年，${currentMemories.length} 段记忆正在生长。`
                        : "这里有空白的泥土，等你种下第一段记忆。"}
                  </span>
                  <button onClick={startPlant}>
                    Plant a memory <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              <section className="time-and-seed">
                <div className="time-device">
                  <div className="pocket-watch" aria-hidden="true">
                    <div className="watch-loop" />
                    <div className="watch-face">
                      <span>Ⅻ</span>
                      <i />
                      <b>{year}</b>
                      <small>memory time</small>
                    </div>
                  </div>
                  <div className="time-copy">
                    <span className="chapter-label">THE LITTLE TIMEKEEPER</span>
                    <h2>慢一点，再回头看看。</h2>
                    <p>{seasonNames[season]}</p>
                    <div className="year-control">
                      <button
                        aria-label="上一个年份"
                        disabled={yearIndex === 0}
                        onClick={() => changeYear(years[yearIndex - 1])}
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <input
                        aria-label="转动时光，选择年份"
                        type="range"
                        min={0}
                        max={years.length - 1}
                        value={yearIndex}
                        onChange={(e) => changeYear(years[+e.target.value])}
                      />
                      <button
                        aria-label="下一个年份"
                        disabled={yearIndex === years.length - 1}
                        onClick={() => changeYear(years[yearIndex + 1])}
                      >
                        <ChevronRight size={17} />
                      </button>
                      <select
                        aria-label="选择记忆年份"
                        value={year}
                        onChange={(e) => changeYear(+e.target.value)}
                      >
                        {years.map((y) => (
                          <option key={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="season-picker" aria-label="选择花园季节">
                      {(
                        ["spring", "summer", "autumn", "winter"] as Season[]
                      ).map((s, i) => (
                        <button
                          key={s}
                          aria-pressed={season === s}
                          onClick={() => setSeason(s)}
                        >
                          {["春", "夏", "秋", "冬"][i]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="seed-invitation">
                  <span className="invitation-star">✧</span>
                  <span className="chapter-label">
                    ONE PHOTO. ONE FEELING. ONE LITTLE SEED.
                  </span>
                  <h2>
                    有些日子，
                    <br />
                    值得开成一朵花。
                  </h2>
                  <p>
                    一张照片，一句话，一种心情。
                    <br />
                    让它在这本故事书里，慢慢长大。
                  </p>
                  <button className="garden-button" onClick={startPlant}>
                    {memories.length ? "再种下一段记忆" : "种下我的第一段记忆"}{" "}
                    <Plus size={15} />
                  </button>
                </div>
              </section>
              <div className="garden-closing">
                “ What is essential is invisible to the eye. ”
                <span>把重要的事，留在心里，也留在这里。</span>
              </div>
            </>
          )}
          {view === "timeline" && (
            <section className="inside-page timeline-page">
              <span className="chapter-label">
                CHAPTER TWO · THE TREE OF TIME
              </span>
              <h1>
                Once upon <em>a lifetime.</em>
              </h1>
              <p className="page-subtitle">沿着枝叶，回到那些曾经的自己。</p>
              <div className="time-tree-list">
                {years.map((y, i) => (
                  <motion.button
                    key={y}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="time-branch"
                    onClick={() => changeYear(y, true)}
                  >
                    <span className="branch-year">{y}</span>
                    <span className="branch-leaf">❧</span>
                    <span className="branch-story">
                      {memories.filter((m) => yearOf(m) === y).length
                        ? `${memories.filter((m) => yearOf(m) === y).length} 段记忆，在这里生长`
                        : "空白的一页，也是一种可能。"}
                    </span>
                    <ArrowRight size={17} />
                  </motion.button>
                ))}
              </div>
              <button className="garden-button" onClick={startPlant}>
                给时间树添一片叶子 <Plus size={15} />
              </button>
            </section>
          )}
          {view === "room" && (
            <section className={"inside-page memory-room " + weather}>
              <button
                className="back-link"
                onClick={() => {
                  if (selected) setSelected(undefined);
                  else go("garden");
                }}
              >
                <ArrowLeft size={15} />
                {selected ? "回到这一年的花园" : "回到花园"}
              </button>
              <span className="chapter-label">
                CHAPTER {year} · A WORLD OF ITS OWN
              </span>
              {selected ? (
                <>
                  <h1 className="memory-title">{selected.title}</h1>
                  <div className="memory-dateline">
                    {selected.date}{" "}
                    {selected.location && " / " + selected.location}{" "}
                    <span>
                      {moods.find((x) => x.id === selected.mood)?.label ||
                        "记忆"}
                    </span>
                  </div>
                  <div className="story-spread">
                    <div className="story-photographs">
                      {selected.pieces.filter(
                        (p) => p.type === "image" && !p.decorative,
                      ).length ? (
                        selected.pieces
                          .filter((p) => p.type === "image" && !p.decorative)
                          .map((p, i) => (
                            <figure
                              key={p.id}
                              style={{ rotate: (i % 2 ? 3 : -3) + "deg" }}
                            >
                              <img
                                src={asset(p.src!)}
                                alt={`${selected.title}，照片 ${i + 1}`}
                              />
                              <figcaption>
                                {i === 0
                                  ? "a moment, kept forever."
                                  : "another little piece of that day."}
                              </figcaption>
                            </figure>
                          ))
                      ) : (
                        <div className="story-plant">
                          <LittlePlant kind={kindOf(selected)} />
                          <span>words can grow flowers, too.</span>
                        </div>
                      )}
                    </div>
                    <div className="story-writing">
                      <span className="story-flower">❧</span>
                      <p>
                        {selected.story ||
                          selected.pieces
                            .filter((p) => p.type === "text")
                            .map((p) => p.text)
                            .join("\n\n") ||
                          "这段记忆，正在等你写下故事。"}
                      </p>
                      <span className="story-signature">
                        with love, my past self.
                      </span>
                      {selected.song && (
                        <div className="room-music">
                          <audio
                            ref={audio}
                            src={selected.song.src}
                            onEnded={() => setPlaying(false)}
                          />
                          <button
                            aria-label={
                              playing ? "暂停记忆音乐" : "播放记忆音乐"
                            }
                            onClick={() => {
                              if (playing) {
                                audio.current?.pause();
                                setPlaying(false);
                              } else
                                audio.current
                                  ?.play()
                                  .then(() => setPlaying(true))
                                  .catch(() =>
                                    setMessage("这首音乐暂时无法播放。"),
                                  );
                            }}
                          >
                            {playing ? <Pause size={17} /> : <Play size={17} />}
                          </button>
                          <span>
                            <small>A SONG THAT TAKES ME BACK</small>
                            {selected.song.name}
                          </span>
                          <Music size={17} />
                        </div>
                      )}
                      <div className="story-actions">
                        <button onClick={() => go("editor")}>
                          <BookOpen size={15} />
                          自由拼贴与 PNG 导出
                        </button>
                        <button onClick={() => void deleteMemory(selected)}>
                          <Trash2 size={13} />
                          移走这段记忆
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1>
                    {year}
                    <em>，那时候的我们。</em>
                  </h1>
                  <p className="page-subtitle">
                    这一年，有哪些片刻还在心里发光？
                  </p>
                  {currentMemories.length ? (
                    <div className="memory-meadow">
                      {currentMemories.map((m) => (
                        <button key={m.id} onClick={() => openMemory(m)}>
                          <LittlePlant kind={kindOf(m)} />
                          <h3>{m.title}</h3>
                          <span>{m.date}</span>
                          <p>
                            {(
                              m.story ||
                              m.pieces.find((p) => p.type === "text")?.text ||
                              ""
                            ).slice(0, 75)}
                          </p>
                          <small>翻开这个故事 →</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-year">
                      <LittlePlant />
                      <h2>这一页，等待一颗种子。</h2>
                      <p>
                        你还没有在 {year} 年种下记忆。
                        <br />
                        旧日子里的一个小片刻，也可以从今天开始生长。
                      </p>
                    </div>
                  )}
                  <button className="garden-button" onClick={startPlant}>
                    在 {year} 年种下一段记忆 <Plus size={15} />
                  </button>
                </>
              )}
            </section>
          )}
          {view === "plant" && (
            <section className="inside-page planting-page">
              <button
                className="back-link"
                onClick={() => go("garden")}
                disabled={growing}
              >
                <ArrowLeft size={15} />
                回到花园
              </button>
              <span className="chapter-label">
                A SMALL CEREMONY · PLANT A MEMORY
              </span>
              <h1>
                Let a little <em>memory grow.</em>
              </h1>
              <p className="page-subtitle">
                不必是惊天动地的大事。让你心动的小片刻，就很好。
              </p>
              {growing ? (
                <div className="growth-ceremony" role="status">
                  <motion.div
                    initial={{ scale: 0, y: 40 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                  >
                    <LittlePlant kind={form.kind} />
                  </motion.div>
                  <h2>从一颗种子，到一段故事。</h2>
                  <p>你的记忆，正在花园里扎根。</p>
                </div>
              ) : (
                <div className="plant-form">
                  <div className="plant-progress">
                    {["拾起片刻", "留住心情", "种进花园"].map((s, i) => (
                      <span key={s} className={step >= i + 1 ? "active" : ""}>
                        <b>{i + 1}</b>
                        {s}
                      </span>
                    ))}
                  </div>
                  {step === 1 ? (
                    <>
                      <label className="form-label">
                        为这段记忆起个名字
                        <input
                          aria-label="记忆的名字"
                          placeholder="比如：那个一起看海的下午"
                          value={form.title}
                          maxLength={100}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, title: e.target.value }))
                          }
                        />
                      </label>
                      <label className="form-label">
                        写下你想留住的故事
                        <textarea
                          aria-label="记忆的故事"
                          placeholder="那天的风、那个人说的话，或当时的你……"
                          value={form.story}
                          maxLength={8000}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, story: e.target.value }))
                          }
                        />
                      </label>
                      <label className="photo-seed-upload">
                        <ImagePlus size={23} />
                        <span>
                          {uploading ? "正在收好照片…" : "放进几张照片"}
                        </span>
                        <small>也可以只种下一句话 · 最多 8 张</small>
                        <input
                          aria-label="添加记忆照片"
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploading}
                          onChange={(e) => {
                            void uploadPhotos(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {form.photos.length > 0 && (
                        <div className="seed-photos">
                          {form.photos.map((src, i) => (
                            <div key={i}>
                              <img src={src} alt={`待种下的照片 ${i + 1}`} />
                              <button
                                aria-label={`移除照片 ${i + 1}`}
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    photos: f.photos.filter((_, n) => n !== i),
                                  }))
                                }
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        className="garden-button"
                        disabled={uploading}
                        onClick={() => {
                          if (!form.title.trim() || !form.story.trim()) {
                            setMessage("先起个名字，留下一句话。");
                            return;
                          }
                          setStep(2);
                        }}
                      >
                        把这份心情留下 <ArrowRight size={15} />
                      </button>
                    </>
                  ) : step === 2 ? (
                    <>
                      <div className="form-two-columns">
                        <label className="form-label">
                          这一天
                          <input
                            aria-label="记忆日期"
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={form.date}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, date: e.target.value }))
                            }
                          />
                        </label>
                        <label className="form-label">
                          发生在哪里
                          <input
                            aria-label="记忆地点"
                            placeholder="一个你记得的地方"
                            value={form.location}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                location: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                      <span className="form-label">它是什么样的心情？</span>
                      <div className="mood-choices">
                        {moods.map((m) => (
                          <button
                            key={m.id}
                            aria-pressed={form.mood === m.id}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                mood: m.id,
                                kind: m.id === "special" ? "star" : f.kind,
                              }))
                            }
                          >
                            <m.icon size={21} />
                            <strong>{m.label}</strong>
                            <small>{m.caption}</small>
                          </button>
                        ))}
                      </div>
                      <span className="form-label">想让它长成什么？</span>
                      <div className="plant-kind-choices">
                        {(
                          [
                            {
                              kind: "flower",
                              name: "一朵花",
                              caption: "旅行、日常与小美好",
                            },
                            {
                              kind: "tree",
                              name: "一棵树",
                              caption: "重要的人，陪伴与成长",
                            },
                            {
                              kind: "star",
                              name: "一颗星",
                              caption: "特别的瞬间，心里的光",
                            },
                          ] as const
                        ).map((k) => (
                          <button
                            aria-pressed={form.kind === k.kind}
                            key={k.kind}
                            onClick={() =>
                              setForm((f) => ({ ...f, kind: k.kind }))
                            }
                          >
                            <LittlePlant kind={k.kind} />
                            <strong>{k.name}</strong>
                            <small>{k.caption}</small>
                          </button>
                        ))}
                      </div>
                      <label className="music-seed-upload">
                        <Music size={16} />
                        {form.song
                          ? form.song.name
                          : "可选：留下一首属于那天的音乐"}
                        <input
                          aria-label="添加记忆音乐"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (
                              !f.type.startsWith("audio/") ||
                              f.size > 10 * 1024 * 1024
                            ) {
                              setMessage("请选择 10 MB 以内的音频文件。");
                              return;
                            }
                            const r = new FileReader();
                            r.onload = () =>
                              setForm((a) => ({
                                ...a,
                                song: { name: f.name, src: String(r.result) },
                              }));
                            r.onerror = () =>
                              setMessage("音乐没能读取，请再试一次。");
                            r.readAsDataURL(f);
                          }}
                        />
                      </label>
                      {form.song && (
                        <button
                          className="quiet-action"
                          onClick={() =>
                            setForm((f) => ({ ...f, song: undefined }))
                          }
                        >
                          移除音乐
                        </button>
                      )}
                      <div className="form-actions">
                        <button
                          className="back-link"
                          onClick={() => setStep(1)}
                        >
                          <ArrowLeft size={15} />
                          上一步
                        </button>
                        <button
                          className="garden-button"
                          onClick={() => {
                            if (
                              !form.date ||
                              form.date < "1900-01-01" ||
                              form.date > "2100-12-31"
                            ) {
                              setMessage("请选择 1900 至 2100 年之间的日期。");
                              return;
                            }
                            setStep(3);
                          }}
                        >
                          看看这颗种子 <ArrowRight size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="seed-preview">
                        <LittlePlant kind={form.kind} />
                        <h2>{form.title}</h2>
                        <span>
                          {form.date} {form.location && " · " + form.location}
                        </span>
                        <p>{form.story}</p>
                        <small>
                          {moods.find((x) => x.id === form.mood)?.caption} ·{" "}
                          {form.photos.length} 张照片
                        </small>
                      </div>
                      <div className="form-actions">
                        <button
                          className="back-link"
                          onClick={() => setStep(2)}
                        >
                          <ArrowLeft size={15} />
                          再看看
                        </button>
                        <button
                          className="garden-button"
                          disabled={!storageReady}
                          onClick={() => void plant()}
                        >
                          种下这段记忆 <Leaf size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <p className="private-note">
                <Heart size={11} />
                故事保存在当前浏览器里。珍贵的记忆，记得在故事页导出图片留一份备份。
              </p>
            </section>
          )}
          {view === "collection" && (
            <section className="inside-page collection-page">
              <span className="chapter-label">
                THE KEEPSAKE BOX · SMALL THINGS, BIG FEELINGS
              </span>
              <h1>
                The things <em>we love.</em>
              </h1>
              <p className="page-subtitle">
                一本书，一首歌，一个舍不得丢掉的小东西。
              </p>
              <button
                className="garden-button"
                onClick={() => setCollectionForm(true)}
              >
                放进一件小收藏 <Plus size={15} />
              </button>
              {collection.length ? (
                <div className="keepsake-shelf">
                  {collection.map((k, i) => (
                    <article
                      key={k.id}
                      className="keepsake"
                      style={{ rotate: (i % 2 ? 2 : -2) + "deg" }}
                    >
                      {k.image ? (
                        <img src={k.image} alt={k.title} />
                      ) : (
                        <span className="keepsake-icon">
                          {k.kind === "书"
                            ? "❧"
                            : k.kind === "音乐"
                              ? "♫"
                              : k.kind === "电影"
                                ? "✧"
                                : "✿"}
                        </span>
                      )}
                      <span className="keepsake-kind">{k.kind}</span>
                      <h3>{k.title}</h3>
                      <p>{k.note}</p>
                      <button
                        aria-label={`移走收藏：${k.title}`}
                        onClick={async () => {
                          if (!confirm("要移走这件收藏吗？")) return;
                          try {
                            const next = collection.filter(
                              (x) => x.id !== k.id,
                            );
                            await storeCollection(next);
                            setCollection(next);
                          } catch {
                            setMessage("暂时无法移走这件收藏。");
                          }
                        }}
                      >
                        <X size={13} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-keepsake">
                  <svg viewBox="0 0 200 140" aria-hidden="true">
                    <path
                      d="M35 54L143 43 166 66 57 80Z"
                      fill="#d6c4a3"
                      stroke="#ad9875"
                    />
                    <path
                      d="M57 80v47l108-17V66M35 54v49l22 24"
                      fill="#c7b491"
                      fillOpacity=".5"
                      stroke="#ad9875"
                    />
                    <path
                      d="M69 51l27-22 15 9 16-25 27 35"
                      fill="none"
                      stroke="#b2a085"
                    />
                    <path d="M109 93l16-3v12l-16 3Z" fill="#b19c71" />
                    <path
                      d="M143 26l5-10m10 20l11-4M57 25l-7-10"
                      stroke="#c2b28c"
                    />
                  </svg>
                  <h2>收藏匣里，还留着许多空位。</h2>
                  <p>从一件让你心动的小东西开始吧。</p>
                </div>
              )}
            </section>
          )}
          {view === "editor" && selected && (
            <div className="garden-editor">
              <Editor
                memory={selected}
                onSave={saveBoard}
                onClose={() => go("room")}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <footer className="book-footer">
        <span>❧ memory garden</span>
        <p>
          Some things are too small to explain.
          <br />
          Too important to forget.
        </p>
        <span>一本会生长的私人故事书 · 本地保存</span>
      </footer>
      <AnimatePresence>
        {animal && (
          <motion.div
            className="story-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAnimal("")}
          >
            <motion.div
              className="secret-story"
              role="dialog"
              aria-modal="true"
              aria-label={animalStories[animal].title}
              initial={{ y: 25, rotate: -3 }}
              animate={{ y: 0, rotate: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                aria-label="合上隐藏故事"
                onClick={() => setAnimal("")}
              >
                <X size={18} />
              </button>
              <span className="secret-illustration">
                {animal === "bird"
                  ? "♪"
                  : animal === "rabbit"
                    ? "❧"
                    : animal === "butterfly"
                      ? "✧"
                      : "♡"}
              </span>
              <span className="chapter-label">
                A SMALL SECRET IN THE GARDEN
              </span>
              <h2>{animalStories[animal].title}</h2>
              <p>{animalStories[animal].story}</p>
              <button className="garden-button" onClick={() => setAnimal("")}>
                把这句话放在心里 <Heart size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {collectionForm && (
        <div
          className="story-modal-backdrop"
          onClick={() => setCollectionForm(false)}
        >
          <div
            className="secret-story collection-form"
            role="dialog"
            aria-modal="true"
            aria-label="添加收藏"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="关闭收藏表单"
              onClick={() => setCollectionForm(false)}
            >
              <X size={18} />
            </button>
            <h2>放进一件心爱的小东西。</h2>
            <label className="form-label">
              名字
              <input
                aria-label="收藏名字"
                value={keepsake.title}
                onChange={(e) =>
                  setKeepsake((k) => ({ ...k, title: e.target.value }))
                }
              />
            </label>
            <label className="form-label">
              它是什么
              <select
                aria-label="收藏类型"
                value={keepsake.kind}
                onChange={(e) =>
                  setKeepsake((k) => ({ ...k, kind: e.target.value }))
                }
              >
                {["书", "音乐", "电影", "图片", "小物"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              为什么喜欢它
              <textarea
                aria-label="收藏描述"
                value={keepsake.note}
                onChange={(e) =>
                  setKeepsake((k) => ({ ...k, note: e.target.value }))
                }
              />
            </label>
            <label className="music-seed-upload">
              <ImagePlus size={15} />
              {keepsake.image ? "已放入一张图片" : "可选：放进一张图片"}
              <input
                aria-label="收藏图片"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    void readPhoto(f)
                      .then((image) => setKeepsake((k) => ({ ...k, image })))
                      .catch(() => setMessage("图片没能读取。"));
                }}
              />
            </label>
            <button
              className="garden-button"
              disabled={!storageReady}
              onClick={() => void saveKeepsake()}
            >
              收进小木盒 <Check size={15} />
            </button>
          </div>
        </div>
      )}
      {message && (
        <button
          className="garden-toast"
          role="status"
          onClick={() => setMessage("")}
        >
          {message}
          <X size={13} />
        </button>
      )}
    </main>
  );
}
