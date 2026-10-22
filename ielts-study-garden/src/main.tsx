import { VocabularyFileImport } from "./components/VocabularyFileImport";
import { vocabularyText } from "./import-text";
import { Stat } from "./components/Stat";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  LayoutDashboard,
  Archive,
  ArrowUpRight,
  Volume2,
  Plus,
  Check,
  Leaf,
  Download,
  Upload,
  Search,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  empty,
  key,
  id,
  load,
  validate,
  parseWords,
  review,
  type State,
  type Word,
  type Note,
} from "./store";
import "./style.css";
type Result = {
  summary: string;
  items: Omit<Note, "id" | "skill" | "favorite" | "created">[];
  correct?: boolean;
};
const sections = [
  "Dashboard",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Library",
];
const icons = [LayoutDashboard, Headphones, BookOpen, PenLine, Mic, Archive];
const staticMode = import.meta.env.MODE === "pages";
function App() {
  const [initial] = useState(() => {
    try {
      return { data: load(), error: "" };
    } catch (e) {
      return { data: structuredClone(empty), error: String(e) };
    }
  });
  const [fatal] = useState(initial.error);
  const [state, setState] = useState<State>(initial.data);
  const [page, setPage] = useState("Dashboard");
  const [tab, setTab] = useState("practice");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [current, setCurrent] = useState<string>("");
  const [mode, setMode] = useState("中译英");
  const [filter, setFilter] = useState("全部");
  const [speed, setSpeed] = useState(0.85);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [part, setPart] = useState("Part 1");
  const [task, setTask] = useState("Task 2");
  const [hint, setHint] = useState("完整稿");
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    if (fatal) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      setError("");
    } catch {
      setError("保存失败：浏览器存储空间不足或被禁用。请立即导出备份。");
    }
  }, [state, fatal]);
  useEffect(() => {
    if (staticMode) return;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setConfigured(d.aiConfigured))
      .catch(() => {});
  }, []);
  function navigate(p: string) {
    setPage(p);
    setTab("practice");
    setInput("");
    setFeedback("");
    setAnswer("");
    setCurrent("");
    setResult(null);
    setFilter("全部");
    setSearch("");
  }
  async function ai(kind: string, text: string, context = "") {
    if (staticMode) {
      setError(
        "GitHub Pages 版不运行 AI 服务端。请使用本地词汇练习和材料保存；AI 分析需要单独部署 Node.js 服务。密钥不能填写在网页中。",
      );
      return null;
    }
    if (!text.trim()) {
      setError("请先输入学习材料或回答。");
      return null;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: kind, text, context }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      return d as Result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络请求失败");
      return null;
    } finally {
      setBusy(false);
    }
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setError("此浏览器不支持语音合成，请更换浏览器。");
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = speed;
    u.voice =
      speechSynthesis.getVoices().find((v) => v.lang === "en-GB") || null;
    u.onerror = (event) => {
      if (!["canceled", "interrupted"].includes(event.error))
        setError("发音播放失败，请检查设备语音设置。");
    };
    speechSynthesis.speak(u);
  }
  const words = state.words.filter((w) => w.skill === page);
  const pool = words.filter((w) =>
    filter === "错词"
      ? w.wrong > 0
      : filter === "到期"
        ? w.due <= Date.now()
        : true,
  );
  const word = words.find((w) => w.id === current) || pool[0];
  const scoredEvents = state.events.filter((e) => e.kind !== "material");
  const total = scoredEvents.length;
  const accuracy = total
    ? Math.round((scoredEvents.filter((e) => e.correct).length / total) * 100)
    : 0;
  const today = state.events.filter(
    (e) =>
      new Date(e.at).toLocaleDateString() === new Date().toLocaleDateString(),
  ).length;
  const due = state.words.filter(
    (w) => w.due <= Date.now() && w.wrong > 0,
  ).length;
  function addWords(items: Word[]) {
    setState((s) => ({
      ...s,
      words: [
        ...s.words.map((w) => {
          const n = items.find(
            (x) =>
              x.skill === w.skill &&
              x.word.toLowerCase() === w.word.toLowerCase(),
          );
          return n
            ? {
                ...w,
                meaning: n.meaning || w.meaning,
                example: n.example || w.example,
                synonyms: n.synonyms.length ? n.synonyms : w.synonyms,
              }
            : w;
        }),
        ...items.filter(
          (w, i) =>
            !s.words.some(
              (x) =>
                x.skill === w.skill &&
                x.word.toLowerCase() === w.word.toLowerCase(),
            ) &&
            !items
              .slice(0, i)
              .some((x) => x.word.toLowerCase() === w.word.toLowerCase()),
        ),
      ],
    }));
  }
  function saveResult(r: Result, skill = page) {
    setResult(r);
    setState((s) => ({
      ...s,
      notes: [
        ...s.notes,
        ...r.items.map((n) => ({
          ...n,
          id: id(),
          skill,
          favorite: false,
          created: Date.now(),
        })),
      ],
      events: [
        ...s.events,
        { skill, at: Date.now(), correct: true, kind: "material" },
      ],
    }));
  }
  async function check(value = answer) {
    if (!word || feedback) return;
    if (!value.trim()) {
      setError("请输入答案");
      return;
    }
    let correct = false;
    if (page === "Reading" && mode === "英译中") {
      const r = await ai("grade", value, JSON.stringify(word));
      if (!r) return;
      correct = !!r.correct;
    } else
      correct =
        value.trim().toLowerCase() ===
        (page === "Reading" && mode === "同义替换" ? "" : word.word)
          .trim()
          .toLowerCase();
    finish(correct);
  }
  function finish(correct: boolean) {
    if (!word) return;
    setCurrent(word.id);
    setFeedback(
      `${correct ? "✓ 回答正确，继续生长！" : "还差一点，下次会更好。"} 正确答案：${page === "Reading" && mode === "英译中" ? word.meaning : mode === "同义替换" && page === "Reading" ? word.synonyms[0] : word.word}`,
    );
    setState((s) => ({
      ...s,
      words: s.words.map((w) => (w.id === word.id ? review(w, correct) : w)),
      events: [...s.events, { at: Date.now(), skill: page, correct }],
    }));
  }
  function next() {
    const i = pool.findIndex((w) => w.id === word?.id);
    const following = pool[(i + 1) % pool.length];
    setCurrent(following?.id || "");
    setAnswer("");
    setFeedback("");
    if (page === "Listening" && following) speak(following.word);
  }
  function download(raw?: string) {
    const url = URL.createObjectURL(
      new Blob([raw || JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ielts-garden-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const notes = state.notes.filter(
    (n) =>
      (page === "Library" || n.skill === page) &&
      `${n.title} ${n.text} ${n.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter !== "收藏" || n.favorite),
  );
  return (
    <div className="shell">
      <aside>
        <a className="brand" onClick={() => navigate("Dashboard")}>
          <span className="brand-icon">
            <Sprout size={30} />
          </span>
          <span>
            IELTS<span className="brand-sub">STUDY GARDEN</span>
          </span>
        </a>
        <div className="side-caption">YOUR LEARNING SPACE</div>
        <nav>
          {sections.map((p, i) => {
            const Icon = icons[i];
            return (
              <button
                className={page === p ? "active" : ""}
                onClick={() => navigate(p)}
                key={p}
              >
                <Icon size={19} />
                {p}
                <span>
                  {i === 0
                    ? ""
                    : ["", "听力", "阅读", "写作", "口语", "资料库"][i]}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="side-note">
          <Leaf size={22} />
          <p>
            A little progress,
            <br />
            every single day.
          </p>
          <small>慢慢来，也是一种进步。</small>
        </div>
        <div className="profile">
          <span>Y</span>
          <div>
            My little garden<small>目标 IELTS 6.0 · 坚持生长</small>
          </div>
          <Sprout size={16} />
        </div>
      </aside>
      <main>
        <header>
          <span>
            My workspace <ChevronRight size={13} /> {page}
          </span>
          <div>
            <span className="status-dot" />{" "}
            {staticMode
              ? "GitHub Pages · 本地练习"
              : configured
                ? "AI connected"
                : "Local learning mode"}
            <span className="avatar">Y</span>
          </div>
        </header>
        <div className="content">
          {staticMode && (
            <div className="pages-notice">
              GitHub Pages 学习版 · 听写、词汇、素材保存和备份可用；AI
              分析需要独立服务端。学习数据仅保存在当前浏览器，请定期导出。
            </div>
          )}
          {fatal && (
            <div className="alert">
              {fatal}
              <button onClick={() => download(localStorage.getItem(key) || "")}>
                导出原始存档
              </button>
            </div>
          )}
          {error && (
            <div role="alert" className="alert">
              {error}
              <button onClick={() => setError("")}>关闭</button>
            </div>
          )}
          {page === "Dashboard" ? (
            <>
              <div className="welcome">
                <div>
                  <div className="eyebrow">GROW AT YOUR OWN PACE</div>
                  <h1>
                    A little better, every day<span className="flower">✳</span>
                  </h1>
                  <p>欢迎回到你的学习花园。今天，也为梦想浇一点水。</p>
                  <div className="date">
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "Asia/Shanghai",
                    }).format(new Date())}{" "}
                    <span>·</span> Let's make it count.
                  </div>
                </div>
                <div className="plant-art">
                  <span>✧</span>
                  <Sprout />
                  <i />
                  <small>keep growing</small>
                </div>
              </div>
              <div className="stats">
                <Stat
                  label="TODAY'S PRACTICE"
                  value={today.toString().padStart(2, "0")}
                  unit="次练习"
                  note="每一次练习都算数"
                />
                <Stat
                  label="WORDS IN YOUR GARDEN"
                  value={state.words.length.toString().padStart(2, "0")}
                  unit="个单词"
                  note="慢慢积累，自有回响"
                />
                <Stat
                  label="OVERALL ACCURACY"
                  value={`${accuracy}%`}
                  unit="正确率"
                  note="来自你的实际练习"
                />
                <Stat
                  label="READY TO REVIEW"
                  value={due.toString().padStart(2, "0")}
                  unit="待复习"
                  note="和旧知识再见一面"
                />
              </div>
              <div className="section-heading">
                <div>
                  <h2>Your learning paths</h2>
                  <p>四个小花园，一起慢慢耕耘。</p>
                </div>
                <span>MAKE ROOM FOR GROWTH ↗</span>
              </div>
              <div className="paths">
                {["Listening", "Reading", "Writing", "Speaking"].map((p, i) => {
                  const Icon = icons[i + 1];
                  return (
                    <button
                      key={p}
                      className={`path path-${i}`}
                      onClick={() => navigate(p)}
                    >
                      <div className="path-top">
                        <span className="path-icon">
                          <Icon size={26} />
                        </span>
                        <span className="number">0{i + 1}</span>
                      </div>
                      <h2>{p}</h2>
                      <p>
                        {
                          [
                            "听见每一个进步",
                            "让词汇生根发芽",
                            "把灵感写成句子",
                            "自信地说出自己",
                          ][i]
                        }
                      </p>
                      <div className="path-tags">
                        {
                          [
                            "听写练习 · 错词复习",
                            "词汇积累 · 同义替换",
                            "句型收藏 · 写作素材",
                            "素材整理 · 关键词练习",
                          ][i]
                        }
                      </div>
                      <div className="path-bottom">
                        <span>进入学习</span>
                        <ArrowUpRight size={19} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="dashboard-bottom">
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      Today's little goals <span>今日计划</span>
                    </h2>
                    <Sprout size={19} />
                  </div>
                  {["Listening", "Reading", "Writing", "Speaking"].map(
                    (p, i) => {
                      const count = state.events.filter(
                        (e) =>
                          e.skill === p &&
                          new Date(e.at).toDateString() ===
                            new Date().toDateString(),
                      ).length;
                      return (
                        <button
                          className="goal"
                          key={p}
                          onClick={() => navigate(p)}
                        >
                          <span className={count ? "tick done" : "tick"}>
                            {count ? <Check size={13} /> : null}
                          </span>
                          <div>
                            {
                              [
                                "听写 10 个单词",
                                "复习 10 个阅读词汇",
                                "积累 1 个自然句型",
                                "整理 1 份口语素材",
                              ][i]
                            }
                            <small>
                              {p} · {count} / {i < 2 ? 10 : 1}
                            </small>
                          </div>
                          <div className="mini-progress">
                            <i
                              style={{
                                width: `${Math.min(100, (count / (i < 2 ? 10 : 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </button>
                      );
                    },
                  )}
                </section>
                <section className="panel review-panel">
                  <div className="section-heading">
                    <h2>A gentle reminder</h2>
                    <span>✧</span>
                  </div>
                  <div className="reminder-icon">
                    <BookOpen size={35} />
                    <Leaf size={24} />
                  </div>
                  <h3>复习，是记忆的养分。</h3>
                  <p>
                    {due
                      ? `你的花园里有 ${due} 个错词等待再次相遇。`
                      : "新的花园，从你的第一个单词开始。"}
                    <br />
                    不用急，一点一点就很好。
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      navigate("Library");
                      setFilter("错词");
                    }}
                  >
                    打开我的资料库 <ArrowUpRight size={16} />
                  </button>
                </section>
              </div>
              <footer>
                Made for your own journey. <Sprout size={13} /> Small steps,
                beautiful growth.
              </footer>
            </>
          ) : (
            <>
              <div className="page-title">
                <div className="eyebrow">YOUR {page.toUpperCase()} GARDEN</div>
                <h1>
                  {page}
                  <span className="flower">✳</span>
                </h1>
                <p>
                  {
                    (
                      {
                        Listening: "听见、拼写、记住。让每个单词慢慢熟悉。",
                        Reading: "从词汇到同义替换，让理解更进一步。",
                        Writing: "收集自然表达，写出自己的声音。",
                        Speaking: "保留真实经历，练习自信表达。",
                        Library: "你的积累，都在这里生根。",
                      } as any
                    )[page]
                  }
                </p>
              </div>
              {page !== "Library" && (
                <div className="tabs">
                  {(page === "Listening"
                    ? ["practice", "import"]
                    : page === "Reading"
                      ? ["practice", "import", "analysis", "notes"]
                      : page === "Speaking"
                        ? ["materials", "notes"]
                        : ["analysis", "notes"]
                  ).map((t) => (
                    <button
                      key={t}
                      className={tab === t ? "selected" : ""}
                      onClick={() => {
                        setTab(t);
                        setResult(null);
                        setFeedback("");
                      }}
                    >
                      {
                        (
                          {
                            practice: "开始练习",
                            import: "导入词汇",
                            analysis:
                              page === "Writing" ? "句型提炼" : "阅读错题分析",
                            notes: "我的素材",
                            materials: "真实经历整理",
                          } as any
                        )[t]
                      }
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {["Listening", "Reading"].includes(page) && tab === "import" && (
            <section className="panel form">
              <h2>
                Plant new words <Sprout size={21} />
              </h2>
              <p>
                支持 Word（.docx）、JPG / PNG
                图片和文本词汇表。自动提取英文与中文，先核对下方结果再保存。图片只在浏览器识别，不上传；旧版
                .doc 请另存为 .docx。
              </p>
              <VocabularyFileImport
                onExtract={(text) => {
                  setInput(text);
                  setFeedback("");
                }}
                onError={setError}
                disabled={busy}
                onWorkingChange={setFileBusy}
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={fileBusy}
                placeholder={
                  "accommodation | 住宿\nsustainable | 可持续的\nextraordinary"
                }
              />
              <button
                className="primary"
                disabled={fileBusy}
                onClick={() => {
                  if (!input.trim()) return setError("请先输入单词");
                  const extracted = vocabularyText(input);
                  if (!extracted.entries.length)
                    return setError(
                      "没有识别到英文单词，请检查导入内容。只有英文的词条也可以保存。",
                    );
                  addWords(parseWords(extracted.text, page as Word["skill"]));
                  setInput("");
                  setFeedback("已导入，重复单词已跳过。");
                }}
              >
                保存到词库
              </button>
              {page === "Reading" && (
                <button
                  disabled={busy || fileBusy}
                  onClick={async () => {
                    const r = await ai("vocabulary", input);
                    if (r) {
                      addWords(
                        r.items.map((n) => ({
                          ...parseWords(n.title, "Reading")[0],
                          meaning: n.text,
                          example: n.explanation,
                          synonyms: n.synonyms,
                        })),
                      );
                      setFeedback("AI 释义已保存到词库");
                    }
                  }}
                >
                  AI 补全释义与同义词
                </button>
              )}
              <p>{feedback}</p>
            </section>
          )}
          {["Listening", "Reading"].includes(page) && tab === "practice" && (
            <section className="panel practice">
              <div className="toolbar">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrent("");
                    setFeedback("");
                  }}
                >
                  {["全部", "错词", "到期"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {page === "Reading" ? (
                  <select
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value);
                      setFeedback("");
                      setAnswer("");
                    }}
                  >
                    {["中译英", "英译中", "同义替换"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <label>
                    语速{" "}
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(+e.target.value)}
                    >
                      <option value="0.65">慢速</option>
                      <option value="0.85">适中</option>
                      <option value="1">正常</option>
                    </select>
                  </label>
                )}
                <span>{pool.length} 个单词</span>
              </div>
              {word ? (
                <>
                  <div className="eyebrow">
                    {page === "Listening"
                      ? "LISTEN CAREFULLY"
                      : "LET IT TAKE ROOT"}
                  </div>
                  {page === "Listening" ? (
                    <button
                      className="sound"
                      aria-label="播放单词"
                      onClick={() => speak(word.word)}
                    >
                      <Volume2 size={42} />
                    </button>
                  ) : (
                    <h2 className="prompt">
                      {mode === "中译英"
                        ? word.meaning ||
                          "此词缺少释义，请在词库编辑或用 AI 补全。"
                        : word.word}
                    </h2>
                  )}
                  <p>
                    {page === "Listening"
                      ? "只播报英文，拼写正确即可；点击下一题会自动播报。"
                      : "认真想一想，再写下你的答案。"}
                  </p>
                  {mode === "同义替换" && page === "Reading" ? (
                    word.synonyms.length ? (
                      <div className="choices">
                        {[
                          ...new Set([
                            word.synonyms[0],
                            ...state.words
                              .filter(
                                (w) =>
                                  w.word !== word.word &&
                                  !word.synonyms.includes(w.word),
                              )
                              .map((w) => w.word)
                              .slice(0, 3),
                          ]),
                        ]
                          .sort()
                          .map((s) => (
                            <button
                              disabled={!!feedback}
                              key={s}
                              onClick={() => finish(s === word.synonyms[0])}
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p>此词尚无同义词，请先通过 AI 补全或在词库编辑。</p>
                    )
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        check();
                      }}
                    >
                      <input
                        aria-label="练习答案"
                        placeholder="Your answer…"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={!!feedback}
                      />
                      <button
                        className="primary"
                        disabled={
                          busy ||
                          !!feedback ||
                          (page === "Reading" &&
                            mode === "中译英" &&
                            !word.meaning)
                        }
                      >
                        Check answer <Check size={16} />
                      </button>
                    </form>
                  )}
                  {feedback && (
                    <div className="answer-feedback" role="status">
                      {feedback}
                      <p>
                        {word.meaning} {word.example}
                      </p>
                    </div>
                  )}
                  <div className="practice-actions">
                    <button
                      onClick={() => {
                        setCurrent(
                          pool[Math.floor(Math.random() * pool.length)]?.id ||
                            "",
                        );
                        setFeedback("");
                        setAnswer("");
                      }}
                    >
                      随机练习
                    </button>
                    <button onClick={next}>下一题 →</button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <Sprout size={42} />
                  <h2>这里等待第一颗种子</h2>
                  <p>导入你的词汇，就能开始练习。</p>
                  <button className="primary" onClick={() => setTab("import")}>
                    导入单词 <Plus size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          {((page === "Reading" && tab === "analysis") ||
            (page === "Writing" && tab !== "notes") ||
            (page === "Speaking" &&
              ["materials", "practice"].includes(tab))) && (
            <section className="panel form">
              <h2>
                {page === "Reading"
                  ? "Reading mistake notebook"
                  : page === "Writing"
                    ? "A sentence worth keeping"
                    : "Your stories, your voice"}
              </h2>
              <div className="toolbar">
                {page === "Writing" ? (
                  <select
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                  >
                    <option>Task 1</option>
                    <option>Task 2</option>
                  </select>
                ) : page === "Speaking" ? (
                  <select
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                  >
                    {["Part 1", "Part 2", "Part 3"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                ) : null}
              </div>
              <p>
                {page === "Reading"
                  ? "请包含：原文、题目、你的答案、正确答案。AI 将定位原句、分析错误与同义替换。"
                  : page === "Writing"
                    ? "粘贴题目、作文、范文或句子，提炼适合 6–6.5 分的自然表达。"
                    : "输入真实经历、题目和自己的回答。AI 只整理你提供的事实，并生成可复用话题匹配。"}
              </p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="在这里种下你的学习材料…"
              />
              <button
                onClick={() => {
                  if (!input.trim()) return setError("请先输入材料");
                  saveResult({
                    summary: "原始材料已保存，可随时编辑或稍后使用 AI 整理。",
                    items: [
                      {
                        title:
                          (page === "Writing"
                            ? task
                            : page === "Speaking"
                              ? part
                              : "阅读错题") +
                          " · " +
                          new Date().toLocaleDateString(),
                        text: input,
                        explanation: "个人导入的原始材料",
                        tags: [page === "Writing" ? task : part],
                        synonyms: [],
                      },
                    ],
                  });
                }}
              >
                保存原始材料
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  const r = await ai(
                    page.toLowerCase(),
                    input,
                    page === "Writing" ? task : part,
                  );
                  if (r) saveResult(r);
                }}
              >
                {busy ? "正在整理…" : "AI 整理并保存"} <Sprout size={16} />
              </button>
              {result && (
                <div className="result">
                  <p>{result.summary}</p>
                  {result.items.map((n, i) => (
                    <article key={i}>
                      <h3>{n.title}</h3>
                      <p>{n.text}</p>
                      <p>{n.explanation}</p>
                      <small>{n.tags.join(" · ")}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {(page === "Library" || tab === "notes") && (
            <>
              <section className="panel">
                <div className="toolbar">
                  <Search size={18} />
                  <input
                    placeholder="搜索单词、素材、同义替换…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {["全部", "收藏", "错词", "到期"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <button onClick={() => download()}>
                    <Download size={16} /> 导出 JSON
                  </button>
                  <label className="file-button">
                    <Upload size={16} /> 导入 JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        try {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const d = JSON.parse(await f.text());
                          if (!validate(d))
                            throw Error("格式不符合 IELTS Garden v1");
                          if (
                            confirm(
                              "合并导入学习数据？已有相同 ID 的记录会保留。",
                            )
                          )
                            setState((s) => ({
                              ...s,
                              words: [
                                ...s.words,
                                ...d.words.filter(
                                  (w) => !s.words.some((x) => x.id === w.id),
                                ),
                              ],
                              notes: [
                                ...s.notes,
                                ...d.notes.filter(
                                  (n) => !s.notes.some((x) => x.id === n.id),
                                ),
                              ],
                              events: [
                                ...s.events,
                                ...d.events.filter(
                                  (e) =>
                                    !s.events.some(
                                      (x) =>
                                        x.at === e.at &&
                                        x.skill === e.skill &&
                                        x.correct === e.correct,
                                    ),
                                ),
                              ],
                            }));
                        } catch (e) {
                          setError("导入失败：" + String(e));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {page === "Library" && (
                  <>
                    <h2>
                      Word collection <small>{state.words.length} words</small>
                    </h2>
                    <div className="word-list">
                      {state.words
                        .filter(
                          (w) =>
                            `${w.word} ${w.meaning} ${w.synonyms.join(" ")}`
                              .toLowerCase()
                              .includes(search.toLowerCase()) &&
                            (filter === "错词"
                              ? w.wrong > 0
                              : filter === "到期"
                                ? w.due <= Date.now()
                                : filter === "收藏"
                                  ? false
                                  : true),
                        )
                        .map((w) => (
                          <div className="word-row" key={w.id}>
                            <div>
                              <strong>{w.word}</strong>
                              <span>{w.meaning}</span>
                              <small>
                                {w.skill} · ✓ {w.correct} / ✗ {w.wrong} ·{" "}
                                {w.last
                                  ? new Date(w.last).toLocaleString()
                                  : "尚未练习"}{" "}
                                · {w.synonyms.join(", ")}
                              </small>
                            </div>
                            <button
                              onClick={() => speak(w.word)}
                              aria-label={`朗读 ${w.word}`}
                            >
                              <Volume2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const meaning = prompt("中文释义", w.meaning);
                                if (meaning === null) return;
                                const syn = prompt(
                                  "同义词（英文逗号分隔）",
                                  w.synonyms.join(","),
                                );
                                if (syn === null) return;
                                setState((s) => ({
                                  ...s,
                                  words: s.words.map((x) =>
                                    x.id === w.id
                                      ? {
                                          ...x,
                                          meaning,
                                          synonyms: syn
                                            .split(",")
                                            .map((v) => v.trim())
                                            .filter(Boolean),
                                        }
                                      : x,
                                  ),
                                }));
                              }}
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("删除这个单词及其单词统计？"))
                                  setState((s) => ({
                                    ...s,
                                    words: s.words.filter((x) => x.id !== w.id),
                                  }));
                              }}
                            >
                              删除
                            </button>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </section>
              <div className="toolbar">
                <h2>Collected expressions</h2>
                {page === "Speaking" && (
                  <select
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                  >
                    {["完整稿", "关键词提示", "无提示"].map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="note-grid">
                {notes.map((n) => (
                  <article className="panel note" key={n.id}>
                    <small>
                      {n.skill} · {n.tags.join(" · ")}
                    </small>
                    <h3>{n.title}</h3>
                    {hint !== "无提示" && (
                      <p>{hint === "完整稿" ? n.text : n.tags.join(" · ")}</p>
                    )}
                    {hint === "完整稿" && (
                      <p className="muted">{n.explanation}</p>
                    )}
                    <div className="toolbar">
                      <button
                        aria-label="收藏素材"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            notes: s.notes.map((x) =>
                              x.id === n.id
                                ? { ...x, favorite: !x.favorite }
                                : x,
                            ),
                          }))
                        }
                      >
                        <Star
                          size={16}
                          fill={n.favorite ? "#c5a368" : "none"}
                        />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(n.text);
                            setFeedback("已复制");
                          } catch {
                            setError("复制失败，请手动选择文本复制");
                          }
                        }}
                      >
                        复制
                      </button>
                      <button
                        onClick={() => {
                          const text = prompt("编辑内容", n.text);
                          if (text !== null)
                            setState((s) => ({
                              ...s,
                              notes: s.notes.map((x) =>
                                x.id === n.id ? { ...x, text } : x,
                              ),
                            }));
                        }}
                      >
                        编辑
                      </button>
                      {n.skill === "Reading" && (
                        <button
                          onClick={() =>
                            addWords([
                              {
                                ...parseWords(n.title, "Reading")[0],
                                meaning: n.text,
                                example: n.explanation,
                                synonyms: n.synonyms,
                              },
                            ])
                          }
                        >
                          加入词汇
                        </button>
                      )}
                      {n.skill === "Writing" && (
                        <button
                          onClick={() => {
                            const parts = n.text.split(" ");
                            const i = parts.findIndex((s) => s.length > 4);
                            if (i < 0)
                              return setError("句子过短，无法生成填空");
                            const a = prompt(
                              parts
                                .map((s, j) => (j === i ? "_____" : s))
                                .join(" "),
                            );
                            if (a !== null) {
                              const correct =
                                a.trim().toLowerCase() ===
                                parts[i].toLowerCase();
                              setFeedback(
                                correct
                                  ? "填空正确！"
                                  : `正确答案：${parts[i]}`,
                              );
                              setState((s) => ({
                                ...s,
                                events: [
                                  ...s.events,
                                  { at: Date.now(), skill: "Writing", correct },
                                ],
                              }));
                            }
                          }}
                        >
                          填空练习
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("删除这条素材？"))
                            setState((s) => ({
                              ...s,
                              notes: s.notes.filter((x) => x.id !== n.id),
                            }));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!notes.length && (
                <p className="empty">还没有保存的素材，去种下一点新灵感吧。</p>
              )}
              {feedback && <p role="status">{feedback}</p>}
              {page === "Library" && (
                <section className="panel">
                  <h2>Learning history</h2>
                  {state.events
                    .slice(-30)
                    .reverse()
                    .map((e, i) => (
                      <p key={i}>
                        {new Date(e.at).toLocaleString()} · {e.skill} ·{" "}
                        {e.correct ? "已完成 / 正确" : "需要复习"}
                      </p>
                    ))}
                  <button
                    className="danger"
                    onClick={() => {
                      if (
                        confirm(
                          "删除全部 IELTS 学习资料？请先导出备份。此操作不影响原剪贴簿。",
                        )
                      )
                        setState(structuredClone(empty));
                    }}
                  >
                    删除全部学习数据
                  </button>
                </section>
              )}
            </>
          )}
          {busy && (
            <div role="status" className="busy">
              ✳ 正在悉心整理，请稍等…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
