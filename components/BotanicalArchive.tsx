"use client";
import { botanicalCategories, botanicalCategory } from "../lib/botanical";
import { asset } from "../lib/assets";
import type { Memory } from "./Editor";
export default function BotanicalArchive({
  memories,
  onCategory,
}: {
  memories: Memory[];
  onCategory: (id: string) => void;
}) {
  return (
    <div className="botanical-index">
      <div className="specimen-paper">
        <span className="specimen-number">FIG. 02 / MEMORY STRUCTURE</span>
        <svg
          viewBox="0 0 600 680"
          role="img"
          aria-label="黑色墨线构成的抽象记忆植物标本"
        >
          <g fill="none" stroke="#121828" strokeWidth="1.5">
            <path d="M303 636C264 510 352 401 288 302S330 140 286 35M303 636C330 506 242 377 353 264S430 104 493 52M292 448C235 349 143 366 88 230M318 533C415 449 476 427 510 312M283 299C185 238 214 135 141 87M312 211C393 204 380 126 414 103" />
            {Array.from({ length: 16 }, (_, i) => (
              <path
                key={i}
                d="M0 0C-54 -70 -82 -21 0 0C54 -70 82 -21 0 0"
                transform={`translate(${i % 2 ? 328 - i * 3 : 266 + i * 3} ${105 + i * 29}) rotate(${i % 2 ? -40 : 35}) scale(${0.55 + (i % 3) * 0.15})`}
              />
            ))}
            {[
              [88, 230],
              [141, 87],
              [493, 52],
              [510, 312],
              [353, 264],
              [286, 35],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                {Array.from({ length: 5 }, (_, j) => (
                  <path
                    key={j}
                    d="M0 0C-33 -18 -54 -74 -6 -66C18 -54 20 -24 0 0"
                    transform={`rotate(${j * 72})`}
                  />
                ))}
                <circle r="7" fill="#1428ff" />
              </g>
            ))}
            <path d="M239 640h115M303 636l-35 23m35-23l28 26" />
          </g>
        </svg>
        <span className="specimen-caption">
          NOT A TREE. A MAP OF WHAT REMAINS.
        </span>
      </div>
      <img
        className="index-flower"
        src={asset("/prints/blue-lilies.png")}
        alt="银蓝色花瓣标本"
      />
      <div className="specimen-tags">
        {botanicalCategories.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onCategory(c.id)}
            className={"specimen-tag tag-" + i}
          >
            <small>
              ARCHIVE / 0{i + 1}{" "}
              <span>
                {String(
                  memories.filter((m) => botanicalCategory(m) === c.id).length,
                ).padStart(2, "0")}
              </span>
            </small>
            <strong>{c.title}</strong>
            <em>{c.note} ↗</em>
          </button>
        ))}
      </div>
    </div>
  );
}
