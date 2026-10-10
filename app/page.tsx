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
import AnimalVisitors from "../components/AnimalVisitors";
import BotanicalArchive from "../components/BotanicalArchive";
import { botanicalCategories, botanicalCategory } from "../lib/botanical";
import { LittlePlant } from "../components/GardenScene";
import { asset } from "../lib/assets";
import {
  loadMemories,
  storeMemories,
  loadCollection,
  loadGardenYears,
  storeGardenYears,
  storeCollection,
  type Keepsake,
} from "../lib/storage";
import type { Memory } from "../components/Editor";
const Editor = dynamic(() => import("../components/Editor"), { ssr: false });
type View =
  | "garden"
  | "places"
  | "timeline"
  | "room"
  | "plant"
  | "collection"
  | "editor"
  | "about";
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
const animalStories: { [key: string]: { title: string; story: string } } = {
  cat: {
    title: "花猫替你留着的位置",
    story:
      "窗边总有一小块阳光。花猫把它留给你，也留给那些没有说完的话。等你回来，我们再慢慢讲。",
  },
  whitecat: {
    title: "白猫的午后",
    story:
      "今天什么也不用赶。听一首喜欢的歌，看一张旧照片，或者只是坐一会儿。那些安静的日子，也值得被记住。",
  },
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
      "每一次回到档案，小狗都像第一次见到你那样高兴。有些爱，从来不问你离开了多久。",
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
  botanicalCategory: "remember",
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
    [archiveCategory, setArchiveCategory] = useState(""),
    [memories, setMemories] = useState<Memory[]>([]),
    [collection, setCollection] = useState<Keepsake[]>([]),
    [year, setYear] = useState(new Date().getFullYear()),
    [addedYears, setAddedYears] = useState<number[]>([]),
    [removedYears, setRemovedYears] = useState<number[]>([]),
    [newYear, setNewYear] = useState(String(new Date().getFullYear() + 1)),
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
      audio: "",
    }),
    [collectionForm, setCollectionForm] = useState(false),
    [playing, setPlaying] = useState(false),
    [bio, setBio] = useState(
      "这里收藏着我去过的地方、喜欢的声音，还有一些舍不得忘记的小事。",
    ),
    [editingBio, setEditingBio] = useState(false),
    [collectionScope, setCollectionScope] = useState("全部");
  const audio = useRef<HTMLAudioElement>(null),
    growthTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    Promise.all([
      loadMemories(),
      loadCollection(),
      loadGardenYears(),
      loadGardenYears("removed-years"),
    ])
      .then(([m, c, y, removed]) => {
        setRemovedYears(removed);
        const available = [
          ...new Set([
            2016,
            2018,
            2022,
            2024,
            2026,
            new Date().getFullYear(),
            ...y,
            ...m.map(yearOf),
          ]),
        ]
          .filter(
            (v) =>
              !removed.includes(v) || m.some((memory) => yearOf(memory) === v),
          )
          .sort((a, b) => a - b);
        if (removed.includes(new Date().getFullYear()))
          setYear(available[available.length - 1] || new Date().getFullYear());
        setAddedYears(y);
        setMemories(m);
        setCollection(c);
        const profile = c.find((k) => k.id === "garden-about");
        if (profile) setBio(profile.note);
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
    new Set([
      2016,
      2018,
      2022,
      2024,
      2026,
      year,
      ...addedYears,
      ...memories.map(yearOf),
    ]),
  )
    .filter(
      (y) => !removedYears.includes(y) || memories.some((m) => yearOf(m) === y),
    )
    .sort((a, b) => a - b);
  const currentMemories = memories.filter((m) =>
    archiveCategory
      ? botanicalCategory(m) === archiveCategory
      : yearOf(m) === year,
  );
  const yearIndex = years.indexOf(year);
  const go = (v: View) => {
    if (["garden", "places", "timeline"].includes(v)) setArchiveCategory("");
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeYear = (y: number, open = false) => {
    setArchiveCategory("");
    setYear(y);
    const newest = memories.find((m) => yearOf(m) === y);
    setWeather(moods.find((m) => m.id === newest?.mood)?.weather || "sun");
    if (open) {
      setSelected(undefined);
      go("room");
    }
  };
  const addYear = async () => {
    const value = Number(newYear);
    if (!/^\d{4}$/.test(newYear) || value < 1000 || value > 9999) {
      setMessage("请输入四位年份，例如 2027。");
      return;
    }
    if (!storageReady) return;
    try {
      const next = Array.from(new Set([...addedYears, value])).sort(
        (a, b) => a - b,
      );
      const restored = removedYears.filter((y) => y !== value);
      await storeGardenYears(next, restored);
      setRemovedYears(restored);
      setAddedYears(next);
      changeYear(value);
      setNewYear(String(Math.min(9999, value + 1)));
      setMessage(`${value} 年的新一页，已经留好了。`);
    } catch {
      setMessage("年份暂时没能保存，请再试一次。");
    }
  };
  const removeYear = async () => {
    if (!storageReady) return;
    if (memories.some((m) => yearOf(m) === year)) {
      setMessage("这一年还有记忆。请先在故事页移走这些记忆，再删除年份。");
      return;
    }
    if (years.length <= 1) {
      setMessage("请至少保留一个年份；可以先增加另一个年份。");
      return;
    }
    if (
      !confirm(
        `删除 ${year} 年这张空白页吗？以后可以通过「增加年份」重新加入。`,
      )
    )
      return;
    const deleted = year;
    try {
      const next = addedYears.filter((y) => y !== deleted);
      const removed = [...new Set([...removedYears, deleted])];
      await storeGardenYears(next, removed);
      setAddedYears(next);
      setRemovedYears(removed);
      changeYear(years.filter((y) => y !== deleted).at(-1)!);
      setMessage(`${deleted} 年的空白页已移除。`);
    } catch {
      setMessage("年份暂时没能删除，请再试一次。");
    }
  };
  const startPlant = () => {
    setForm({
      ...blank,
      botanicalCategory: archiveCategory || "remember",
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
        botanicalCategory: form.botanicalCategory,
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
      setKeepsake({ title: "", kind: "书", note: "", image: "", audio: "" });
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
    <main className={"storybook ivory-cover weather-" + weather}>
      <div className="paper-texture" />
      <svg className="print-filters" aria-hidden="true">
        <defs>
          <pattern
            id="ink-dots"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.65" fill="#514837" opacity=".45" />
          </pattern>
          <filter id="vintage-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer result="toned">
              <feFuncR type="discrete" tableValues=".17 .24 .42 .63 .76 .83" />
              <feFuncG type="discrete" tableValues=".17 .23 .39 .59 .72 .78" />
              <feFuncB type="discrete" tableValues=".16 .20 .27 .37 .56 .65" />
            </feComponentTransfer>
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".68"
              numOctaves="3"
              seed="8"
              result="grain"
            />
            <feColorMatrix in="grain" type="saturate" values="0" />
            <feBlend in2="toned" mode="soft-light" result="worn" />
            <feComposite in="worn" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>
      <header className="book-header">
        <button
          className="garden-brand"
          onClick={() => go("garden")}
          aria-label="返回记忆花园"
        >
          <span>✦</span>
          <span>
            MEMORY GARDEN<small>digital botanical archive / vol. 02</small>
          </span>
        </button>
        <nav aria-label="主要导航">
          {(
            [
              { v: "garden", label: "首页" },
              { v: "places", label: "去过的地方" },
              { v: "timeline", label: "我的故事" },
              { v: "collection", label: "喜欢的事物" },
              { v: "about", label: "关于我" },
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
            留下记忆
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
          {(view === "garden" || view === "places") && (
            <>
              {view === "garden" && (
                <section className="printed-poster">
                  <div className="poster-copy">
                    <span className="poster-prelude">
                      FIELD NOTES / FORGOTTEN & PRESERVED
                    </span>
                    <h1>
                      MEMORY
                      <br />
                      GARDEN<span>digital botanical archive</span>
                    </h1>
                    <p>
                      把遗忘的片刻，
                      <br />
                      保存成蓝色的植物标本。
                    </p>
                    <button onClick={startPlant} className="poster-oval">
                      留下一段记忆 <ArrowRight size={18} />
                    </button>
                    <button
                      className="poster-print-link"
                      onClick={() => {
                        setSelected(undefined);
                        go("editor");
                      }}
                    >
                      制作复古拼贴 · 相机冲印 ↗
                    </button>
                    <span className="poster-edition">
                      ISSUE 002 · BLUE SPECIMENS · PRIVATE ARCHIVE
                    </span>
                  </div>
                  <div className="poster-collage">
                    <div className="print-landscape">
                      <img src={asset("/sky.jpg")} alt="收藏的一片山林风景" />
                      <span>somewhere I felt alive.</span>
                    </div>
                    <img
                      className="hero-silver-flower"
                      src={asset("/prints/blue-lilies.png")}
                      alt="银白与冰蓝交叠的梦境花瓣"
                    />
                    <span className="blue-registration">＋</span>
                    <span className="poster-scan-line" />
                    <span className="poster-scribble">
                      some things never really leave.
                    </span>
                    <span className="poster-doodle">✦</span>
                  </div>
                </section>
              )}
              <div className="places-heading">
                <span>01 / THE BOTANICAL INDEX</span>
                <h2>Fragments that still bloom.</h2>
                <p>选择一种情绪，进入记忆标本。</p>
              </div>
              <section className="garden-world" aria-label="互动记忆花园">
                <BotanicalArchive
                  memories={memories}
                  onCategory={(id) => {
                    setArchiveCategory(id);
                    setSelected(undefined);
                    go("room");
                  }}
                />
                <div className="garden-marginalia">
                  <span>
                    the archive remembers
                    <br />
                    what the world forgets.
                  </span>
                  <small>
                    蓝色标本，封存那些仍有回声的片刻。
                    <br />
                    SELECT A FRAGMENT TO OPEN.
                  </small>
                </div>
                <AnimalVisitors onAnimal={setAnimal} />
                <div className="garden-caption">
                  <span className="tiny-flower">✦</span>
                  <span>
                    {loading
                      ? "正在读取私人档案…"
                      : currentMemories.length
                        ? `${memories.length} 件记忆标本 / 私人收藏`
                        : "空白档案，等待第一个视觉碎片。"}
                  </span>
                  <button onClick={startPlant}>
                    Preserve a fragment <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              {view === "places" && (
                <section className="time-and-seed">
                  <div className="time-device">
                    <div className="time-copy">
                      <span className="chapter-label">
                        THE LITTLE TIMEKEEPER
                      </span>
                      <h2>DATE INDEX / 时间索引</h2>
                      <p>按日期保存，按情绪重新发现。</p>
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
                      <button
                        className="remove-garden-year"
                        disabled={!storageReady}
                        onClick={() => void removeYear()}
                      >
                        移除 {year} 年 <Trash2 size={12} />
                      </button>
                      <form
                        className="add-garden-year"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void addYear();
                        }}
                      >
                        <input
                          aria-label="新增记忆年份"
                          type="number"
                          min="1000"
                          max="9999"
                          step="1"
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                        />
                        <button disabled={!storageReady} type="submit">
                          ＋ 增加年份
                        </button>
                        <small>未来，也可以留下一页。</small>
                      </form>
                    </div>
                  </div>
                  <div className="seed-invitation">
                    <span className="invitation-star">✧</span>
                    <span className="chapter-label">
                      ONE IMAGE. ONE FEELING. ONE FRAGMENT.
                    </span>
                    <h2>
                      有些日子，
                      <br />
                      值得开成一朵花。
                    </h2>
                    <p>
                      一张照片，一句话，一种心情。
                      <br />
                      保存为一件私人的视觉标本。
                    </p>
                    <button className="garden-button" onClick={startPlant}>
                      {memories.length
                        ? "再留下一段记忆"
                        : "保存我的第一段记忆"}{" "}
                      <Plus size={15} />
                    </button>
                  </div>
                </section>
              )}
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
                我的故事 <em> / MY STORY</em>
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
                {selected ? "回到记忆索引" : "回到档案"}
              </button>
              <span className="chapter-label">
                ARCHIVE / {archiveCategory || year} · PERSONAL SPECIMENS
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
                          复古拼贴与相机冲印
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
                    {archiveCategory
                      ? botanicalCategories.find(
                          (c) => c.id === archiveCategory,
                        )?.title
                      : year}
                    <em>
                      {archiveCategory
                        ? " / visual fragments"
                        : " / preserved moments"}
                    </em>
                  </h1>
                  <p className="page-subtitle">
                    照片、文字与声音，保存为仍有回声的片刻。
                  </p>
                  {currentMemories.length ? (
                    <div className="memory-meadow">
                      {currentMemories.map((m) => (
                        <button key={m.id} onClick={() => openMemory(m)}>
                          <img
                            className="memory-specimen-cover"
                            src={asset(m.cover || "/prints/blue-lilies.png")}
                            alt={m.title}
                          />
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
                      <h2>NO SPECIMENS YET.</h2>
                      <p>
                        {archiveCategory
                          ? "这个分类还没有记忆标本。"
                          : `你还没有在 ${year} 年留下记忆。`}
                        <br />
                        将照片、文字和声音收录在这一页。
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
                回到档案
              </button>
              <span className="chapter-label">
                NEW SPECIMEN · PERSONAL ARCHIVE
              </span>
              <h1>
                Preserve a <em>fragment.</em>
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
                  <h2>正在保存你的记忆标本。</h2>
                  <p>你的记忆，正在归入私人档案。</p>
                </div>
              ) : (
                <div className="plant-form">
                  <div className="plant-progress">
                    {["收集碎片", "标注情绪", "归入档案"].map((s, i) => (
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
                      <label className="form-label">
                        情绪档案分类
                        <select
                          aria-label="记忆档案分类"
                          value={form.botanicalCategory}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              botanicalCategory: e.target.value,
                            }))
                          }
                        >
                          {botanicalCategories.map((c) => (
                            <option value={c.id} key={c.id}>
                              {c.title} / {c.note}
                            </option>
                          ))}
                        </select>
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
                        标注这份情绪 <ArrowRight size={15} />
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
                            min="1000-01-01"
                            max="9999-12-31"
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
                              form.date < "1000-01-01" ||
                              form.date > "9999-12-31"
                            ) {
                              setMessage("请选择 1000 至 9999 年之间的日期。");
                              return;
                            }
                            setStep(3);
                          }}
                        >
                          预览记忆标本 <ArrowRight size={15} />
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
                          保存这段记忆 <Leaf size={16} />
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
                喜欢的事物 <em> / LITTLE TREASURES</em>
              </h1>
              <p className="page-subtitle">
                照片、音乐和心爱的小东西，都值得留一个位置。
              </p>
              <button
                className="garden-button"
                onClick={() => {
                  setKeepsake((k) => ({
                    ...k,
                    kind: collectionScope === "音乐" ? "音乐" : k.kind,
                  }));
                  setCollectionForm(true);
                }}
              >
                收藏喜欢的事物 <Plus size={15} />
              </button>
              <div className="music-page-tabs">
                <button
                  aria-pressed={collectionScope === "音乐"}
                  onClick={() => setCollectionScope("音乐")}
                >
                  喜欢的音乐
                </button>
                <button
                  aria-pressed={collectionScope === "全部"}
                  onClick={() => setCollectionScope("全部")}
                >
                  全部事物
                </button>
              </div>
              {memories.some((m) => m.song) && (
                <div className="memory-song-list">
                  {memories
                    .filter((m) => m.song)
                    .map((m) => (
                      <article key={m.id}>
                        <span className="song-index">♫</span>
                        <div>
                          <h3>{m.song!.name}</h3>
                          <button onClick={() => openMemory(m)}>
                            来自「{m.title}」的声音 →
                          </button>
                        </div>
                        <audio
                          controls
                          preload="none"
                          src={m.song!.src}
                          aria-label={`播放 ${m.song!.name}`}
                        />
                      </article>
                    ))}
                </div>
              )}
              {collection.filter(
                (k) =>
                  k.id !== "garden-about" &&
                  (collectionScope === "全部" || k.kind === "音乐"),
              ).length ? (
                <div className="keepsake-shelf">
                  {collection
                    .filter(
                      (k) =>
                        k.id !== "garden-about" &&
                        (collectionScope === "全部" || k.kind === "音乐"),
                    )
                    .map((k, i) => (
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
                        {k.audio && (
                          <audio
                            controls
                            preload="none"
                            src={k.audio}
                            aria-label={`播放收藏：${k.title}`}
                          />
                        )}
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
                  <h2>留一个位置，给心动的小事物。</h2>
                  <p>上传照片或音乐，把喜欢的事物收进这本剪贴簿。</p>
                </div>
              )}
            </section>
          )}
          {view === "about" && (
            <section className="inside-page about-page">
              <span className="chapter-label">03 / A FEW THINGS ABOUT ME</span>
              <h1>
                关于我 <em> / HELLO, YOU.</em>
              </h1>
              <div className="about-spread">
                <div className="about-print">
                  <img
                    src={asset("/prints/blue-lilies.png")}
                    alt="私人档案中的银蓝花瓣"
                  />
                  <span>still figuring it all out.</span>
                </div>
                <div className="about-writing">
                  <span className="about-handwriting">a work in progress.</span>
                  {editingBio ? (
                    <label className="form-label">
                      写一点关于自己的话
                      <textarea
                        aria-label="关于我的介绍"
                        value={bio}
                        maxLength={4000}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                  ) : (
                    <p>{bio}</p>
                  )}
                  <button
                    className="garden-button"
                    disabled={!storageReady}
                    onClick={async () => {
                      if (!editingBio) {
                        setEditingBio(true);
                        return;
                      }
                      try {
                        const next = [
                          ...collection.filter((k) => k.id !== "garden-about"),
                          {
                            id: "garden-about",
                            title: "关于我",
                            kind: "关于我",
                            note: bio,
                          },
                        ];
                        await storeCollection(next);
                        setCollection(next);
                        setEditingBio(false);
                        setMessage("关于你的这一页，已保存。");
                      } catch {
                        setMessage("暂时没能保存介绍，请稍后再试。");
                      }
                    }}
                  >
                    {editingBio ? "保存这一页" : "写一点关于我"}{" "}
                    <BookOpen size={15} />
                  </button>
                  <p className="about-footnote">
                    不用把自己介绍得很完整。
                    <br />
                    去过的地方、喜欢的歌，已经在说话了。
                  </p>
                </div>
              </div>
            </section>
          )}
          {view === "editor" && (
            <div className="garden-editor">
              <Editor
                memory={selected}
                onSave={saveBoard}
                onClose={() => go(selected ? "room" : "garden")}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <footer className="book-footer">
        <span>MEMORY GARDEN / PRIVATE PRESS</span>
        <p>
          Some things are too small to explain.
          <br />
          Too important to forget.
        </p>
        <span>PLACES · TREASURES · LITTLE THINGS / 本地保存</span>
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
            <label className="music-seed-upload">
              <Music size={15} />
              {keepsake.audio
                ? "已放入音乐 · 可重新选择"
                : "可选：上传一首音乐"}
              <input
                type="file"
                accept="audio/*"
                aria-label="收藏音乐"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    setMessage("请选择 10MB 以内的音乐。");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setKeepsake((k) => ({
                      ...k,
                      audio: String(reader.result),
                      kind: "音乐",
                      title: k.title || file.name.replace(/\.[^.]+$/, ""),
                    }));
                  reader.onerror = () =>
                    setMessage("音乐没能读取，请再试一次。");
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {keepsake.audio && (
              <button onClick={() => setKeepsake((k) => ({ ...k, audio: "" }))}>
                移除音乐
              </button>
            )}
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
