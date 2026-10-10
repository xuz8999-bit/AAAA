"use client";
import { asset } from "../lib/assets";
export function PixelFolder() {
  return (
    <svg viewBox="0 0 40 32" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M2 5h14v4h21v21H2Z" fill="#6c7059" />
      <path d="M3 3h12v5h21v20H3Z" fill="#c5ba88" />
      <path d="M3 11h34v17H3Z" fill="#d3c797" />
      <path d="M3 11h34v2H3Z" fill="#e8ddb9" />
      <path d="M35 13h2v15H3v-2h32Z" fill="#9c946f" />
    </svg>
  );
}
export default function MemoryDesktop({
  onOpen,
  count,
}: {
  onOpen: (view: string) => void;
  count: number;
}) {
  const folders = [
    ["garden", "Memory Garden"],
    ["photos", "Photo Archive"],
    ["timeline", "Little Stories"],
    ["collection", "Things I Love"],
    ["diary", "Diary"],
  ];
  return (
    <section className="memory-desktop" aria-label="旧电脑记忆桌面">
      <div className="desktop-meta">
        <span>PERSONAL COMPUTER / PRIVATE FILES</span>
        <span>somewhere, long ago.</span>
      </div>
      <div className="desktop-folders">
        {folders.map(([view, title]) => (
          <button key={view} onClick={() => onOpen(view)}>
            <PixelFolder />
            <span>{title}</span>
            <small>{view === "garden" ? ".exe" : "folder"}</small>
          </button>
        ))}
      </div>
      <article className="desktop-browser">
        <div className="retro-titlebar">
          <span>▧ welcome_to_my_world.html</span>
          <div>
            <button aria-label="打开记忆花园" onClick={() => onOpen("garden")}>
              ↗
            </button>
          </div>
        </div>
        <div className="browser-menu">
          File　 Edit　 View　 Favorites{" "}
          <span>personal homepage / est. 1998</span>
        </div>
        <div className="browser-address">
          <span>Address</span>
          <span>C:\ memories\ home\</span>
        </div>
        <div className="desktop-paper">
          <span className="desktop-edition">
            A FORGOTTEN PERSONAL ARCHIVE / NO. 03
          </span>
          <h1>
            Memory
            <br />
            <em>Garden.</em>
          </h1>
          <p>
            一台旧电脑，
            <br />
            保存着一些没有被时间带走的事。
          </p>
          <button className="desktop-enter" onClick={() => onOpen("garden")}>
            打开我的记忆花园 ↗
          </button>
          <span className="desktop-note">please keep these little things.</span>
          <img
            src={asset("/art/botanical-page.svg")}
            className="desktop-botanical-page"
            alt="扫描的植物旧书页"
          />
          <img
            src={asset("/prints/blue-lilies.png")}
            className="desktop-flower-photo"
            alt="旧档案里的一张百合照片"
          />
        </div>
        <div className="browser-status">
          <span>✓ {count} memories preserved</span>
          <span>local archive · yours only</span>
        </div>
      </article>
      <button className="desktop-note-file" onClick={() => onOpen("diary")}>
        <span>▤</span>
        <strong>read_me.txt</strong>
        <p>
          有些小事，
          <br />
          只想写给自己。
        </p>
      </button>
      <div className="desktop-taskbar">
        <span>✦ MEMORY GARDEN</span>
        <button onClick={() => onOpen("plant")}>＋ Plant a Memory</button>
        <span>OFFLINE MEMORIES / LOCAL STORAGE</span>
      </div>
    </section>
  );
}
