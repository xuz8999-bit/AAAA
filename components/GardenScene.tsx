"use client";
import { motion } from "framer-motion";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Plant = {
  id: string;
  title: string;
  kind: "flower" | "tree" | "star";
};
export function LittlePlant({
  kind = "flower",
  color = "#b9897c",
}: {
  kind?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 120" fill="none" aria-hidden="true">
      {kind === "star" ? (
        <>
          <path
            d="M50 13L59 37 85 39 65 56 71 81 50 68 28 81 35 56 15 39 41 37Z"
            fill="#e6cf91"
            stroke="#9c906e"
            strokeWidth="1.2"
          />
          <path d="M50 80v30" stroke="#afa889" strokeDasharray="2 4" />
        </>
      ) : kind === "tree" ? (
        <>
          <path
            d="M49 110V47m0 30L29 59m20 5l23-20"
            stroke="#8a7860"
            strokeWidth="4"
          />
          <path
            d="M15 59C2 37 25 25 31 25 29 7 55 4 65 18 85 12 100 43 82 52 92 76 65 87 52 75 32 91 12 81 15 59Z"
            fill="#98aa81"
            fillOpacity=".6"
            stroke="#8d9777"
          />
          <path d="M10 111Q48 104 90 113" stroke="#b7b595" />
        </>
      ) : (
        <>
          <path
            d="M49 110Q45 78 51 43M49 88Q21 67 19 83Q33 96 49 88M49 74Q75 49 82 67Q71 83 49 74"
            stroke="#839276"
            strokeWidth="1.6"
            fill="#a0b291"
            fillOpacity=".35"
          />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="26"
              rx="10"
              ry="18"
              transform={`rotate(${a} 50 43)`}
              fill={color}
              fillOpacity=".48"
              stroke={color}
              strokeWidth=".6"
            />
          ))}
          <circle cx="50" cy="43" r="8" fill="#d9ba7d" stroke="#b19b76" />
          <path d="M15 112Q51 106 83 113" stroke="#a5a888" />
        </>
      )}
    </svg>
  );
}
export default function GardenScene({
  season,
  weather,
  years,
  selectedYear,
  onYear,
  plants,
  onPlant,
  onAnimal,
}: {
  season: Season;
  weather: string;
  years: number[];
  selectedYear: number;
  onYear: (y: number) => void;
  plants: Plant[];
  onPlant: (id: string) => void;
  onAnimal: (s: string) => void;
}) {
  const palettes = {
    spring: ["#bac69a", "#a1b386", "#ccd1ab", "#d6baa9"],
    summer: ["#9eb083", "#8eaa77", "#b5c19a", "#ccd1a5"],
    autumn: ["#d0af7e", "#b5956c", "#dac093", "#c9a287"],
    winter: ["#b2bbc0", "#a4b0ac", "#c6cfc6", "#dbd5c4"],
  };
  const colors = palettes[season];
  const points = [
    { x: 40, y: 35 },
    { x: 53, y: 23 },
    { x: 64, y: 37 },
    { x: 54, y: 51 },
    { x: 36, y: 54 },
    { x: 65, y: 56 },
    { x: 44, y: 19 },
  ];
  return (
    <div className={`garden-scene ${season} ${weather}`}>
      <svg
        className="garden-landscape"
        viewBox="0 0 1200 650"
        role="img"
        aria-label="A watercolor memory tree in a quiet storybook garden"
      >
        <defs>
          <filter id="watercolor">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".018 .026"
              numOctaves="3"
              seed="14"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
          <pattern
            id="bark"
            width="14"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M4 0Q12 16 3 26M10 2Q3 15 13 24"
              stroke="#796f55"
              strokeWidth=".6"
              opacity=".3"
            />
          </pattern>
          <linearGradient id="trunk">
            <stop stopColor="#c3b393" />
            <stop offset=".5" stopColor="#d6c7a5" />
            <stop offset="1" stopColor="#ad9b79" />
          </linearGradient>
        </defs>
        <g
          className="distant-garden"
          fill="none"
          stroke="#afa98e"
          opacity=".35"
        >
          <path
            d="M0 534Q193 467 355 520Q500 565 700 511Q955 443 1200 521"
            fill="#d9debc"
            fillOpacity=".28"
            stroke="none"
          />
          <path d="M77 430v95m27-99v95m29-105v101m28-104v96m29-83v90m25-92v90M71 450l156-8M74 485l154-7M937 426v83m28-82v86m29-79v84m29-76v77m28-79v87m29-82v87M932 453l157 14m-155 23l155 15" />
          <path d="M857 423Q866 378 899 371Q929 369 940 414M874 417Q879 389 900 388Q919 386 925 418" />
          <path d="M869 410l64 6m-63-17l54 5" />
        </g>
        <path
          d="M155 568Q319 535 493 557Q654 581 791 547Q935 524 1045 566"
          fill="none"
          stroke="#b9c09d"
          strokeWidth="3"
          opacity=".5"
        />
        <ellipse
          cx="592"
          cy="554"
          rx="310"
          ry="23"
          fill="#bbc49d"
          opacity=".15"
          filter="url(#watercolor)"
        />
        <g className="tree-crown" filter="url(#watercolor)">
          {Array.from({ length: 62 }, (_, i) => {
            const angle = i * 2.39996;
            const radius = 30 + Math.sqrt(i / 62) * 232;
            const x = 600 + Math.cos(angle) * radius;
            const y = 246 + Math.sin(angle) * radius * 0.73;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx={41 + (i % 5) * 5}
                ry={32 + (i % 4) * 4}
                fill={colors[i % 4]}
                opacity={0.2 + (i % 3) * 0.05}
                transform={`rotate(${(i % 3) * 15 - 15} ${x} ${y})`}
              />
            );
          })}
        </g>
        <g stroke="#8f8064" strokeLinecap="round" fill="none">
          <path
            d="M575 553Q611 477 586 402Q560 338 602 256Q625 185 616 116"
            strokeWidth="22"
            opacity=".45"
          />
          <path
            d="M597 447Q659 343 710 281Q741 238 748 180M586 402Q512 322 474 233Q452 192 433 170M599 321Q531 259 523 185Q518 145 493 116M597 293Q671 240 690 177Q710 140 723 133M584 379Q549 314 427 291M617 389Q702 351 787 321M604 243Q590 186 569 148"
            strokeWidth="8"
            opacity=".45"
          />
          <path
            d="M574 550Q597 508 586 461Q575 430 573 393Q559 352 577 311L595 285Q586 343 601 394Q616 437 607 482Q600 520 626 550L600 552 582 570 586 551Z"
            fill="url(#trunk)"
            strokeWidth="1.3"
          />
          <path
            d="M574 550Q597 508 586 461Q575 430 573 393Q559 352 577 311L595 285Q586 343 601 394Q616 437 607 482Q600 520 626 550L600 552 582 570 586 551Z"
            fill="url(#bark)"
            stroke="none"
          />
          <path
            d="M591 462Q593 497 589 520M586 373Q578 414 592 442M601 475Q597 532 608 546M573 551l-39 14m51-13l-17 25m46-27l39 11M588 375Q524 322 482 260M603 396Q657 350 720 280M590 307Q604 211 617 148M597 272Q660 233 682 186M558 333l-85-20m14-46l-16-34m49 78l-3-36m150 67l67-2m-30-42l41-5m-88 15l2-36M605 220l-31-42"
            strokeWidth="1.6"
          />
        </g>
        <g className="tree-leaves">
          {Array.from({ length: 112 }, (_, i) => {
            const angle = i * 2.39996;
            const radius = 35 + Math.sqrt(i / 112) * 233;
            const x = 600 + Math.cos(angle) * radius;
            const y = 233 + Math.sin(angle) * radius * 0.73;
            return (
              <g
                key={i}
                transform={`translate(${x} ${y}) rotate(${(i * 53) % 360})`}
              >
                <path
                  d="M0 0Q-20 -14 -9 -31Q9 -21 0 0Z"
                  fill={colors[i % 4]}
                  fillOpacity={0.46}
                  stroke="#8c9676"
                  strokeOpacity={0.23}
                  strokeWidth=".6"
                />
                <path
                  d="M0 0l-8-24"
                  stroke="#7b8b6d"
                  opacity=".22"
                  strokeWidth=".6"
                />
              </g>
            );
          })}
        </g>
        {season === "spring" && (
          <g fill="#d4b7a6" opacity=".75">
            {Array.from({ length: 24 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${415 + ((i * 67) % 340)} ${135 + ((i * 43) % 230)})`}
              >
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse
                    key={a}
                    cx="0"
                    cy="-4"
                    rx="3"
                    ry="5"
                    transform={`rotate(${a})`}
                  />
                ))}
                <circle r="2" fill="#eee3b1" />
              </g>
            ))}
          </g>
        )}
        <g fill="none" stroke="#8e9a78" strokeWidth="1" opacity=".8">
          {Array.from({ length: 18 }, (_, i) => (
            <path
              key={i}
              d={`M${220 + i * 44} ${563 + (i % 3) * 7}q-5 -${15 + (i % 5) * 4} -12 -${24 + (i % 5) * 5}m12 ${24 + (i % 5) * 5}q2 -20 10 -28`}
            />
          ))}
        </g>
        <g transform="translate(255 498)">
          <path
            d="M0 0h34l-5 39H7Z"
            fill="#c9a58b"
            fillOpacity=".55"
            stroke="#aa8b70"
          />
          <path
            d="M16 0q-4-35 6-59m-4 42q-20-17-24-7q3 13 24 7m2-15q16-23 22-11q-2 12-22 11"
            stroke="#8e9f7b"
            fill="#b0ba91"
            fillOpacity=".4"
          />
          <path
            d="M23-55q-22-11-9-18q6-1 10 13q1-20 12-15q10 8-10 19q22-3 17 8q-9 7-19-7q-3 19-11 13q-8-10 10-13"
            fill="#c9a899"
            stroke="#b69b83"
            strokeWidth=".7"
          />
        </g>
        <g transform="translate(916 518)">
          <path
            d="M0 0h40v23H0z"
            fill="#b1b491"
            fillOpacity=".4"
            stroke="#9f9c7d"
          />
          <path d="M3 0v-8h33v8M6 12h26" fill="none" stroke="#9f9c7d" />
          <path
            d="M17-8v-29q-20-3-12-11q11-2 12 11q1-24 12-20q8 10-12 20"
            fill="#afba96"
            fillOpacity=".6"
            stroke="#8e9c7c"
          />
        </g>
        <path
          d="M499 597Q558 575 641 599Q700 617 753 608"
          stroke="#baa991"
          strokeWidth="2"
          opacity=".4"
          fill="none"
        />
        <path
          d="M520 609Q594 595 633 611"
          stroke="#baa991"
          strokeWidth="1"
          opacity=".3"
          fill="none"
        />
      </svg>
      <div className="garden-years">
        {years.slice(0, 7).map((y, i) => (
          <motion.button
            key={y}
            className={"year-fruit " + (y === selectedYear ? "selected" : "")}
            style={{ left: points[i].x + "%", top: points[i].y + "%" }}
            whileHover={{ y: -4, rotate: 3 }}
            onClick={() => onYear(y)}
            aria-label={`打开 ${y} 年的记忆`}
          >
            <span className="fruit-stem" />
            <span>{y}</span>
          </motion.button>
        ))}
      </div>
      {plants.slice(0, 9).map((p, i) => (
        <motion.button
          key={p.id}
          className="planted-memory"
          style={{ left: 24 + i * 6 + "%", top: 76 + (i % 3) * 2 + "%" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: i * 0.1 }}
          onClick={() => onPlant(p.id)}
          title={p.title}
          aria-label={`重访记忆：${p.title}`}
        >
          <LittlePlant kind={p.kind} />
          <span>{p.title}</span>
        </motion.button>
      ))}
      <button
        className="garden-animal bird"
        onClick={() => onAnimal("bird")}
        aria-label="听小鸟的故事"
      >
        <svg viewBox="0 0 75 55">
          <path
            d="M14 37Q1 17 21 14Q31 12 39 26L58 19 46 34Q40 49 23 43L8 49Z"
            fill="#a9b4a0"
            stroke="#83907e"
          />
          <path d="M17 29Q27 23 34 35" stroke="#889982" fill="none" />
          <circle cx="17" cy="20" r="1.5" fill="#646f5e" />
          <path d="M8 23L1 25 9 27" fill="#b89d78" />
        </svg>
        <span>♪</span>
      </button>
      <button
        className="garden-animal rabbit"
        onClick={() => onAnimal("rabbit")}
        aria-label="听小兔的故事"
      >
        <svg viewBox="0 0 95 110">
          <path
            d="M42 55Q18 8 31 4Q41 0 47 44Q49 4 58 7Q69 12 57 52Q83 59 72 83Q85 101 49 101Q12 102 23 78Q19 57 42 55Z"
            fill="#e5dfcc"
            stroke="#a69b84"
            strokeWidth="1.2"
          />
          <path d="M37 19l7 23m13-22l-4 21" stroke="#cab6a3" strokeWidth="2" />
          <circle cx="38" cy="66" r="1.8" fill="#8c806b" />
          <circle cx="54" cy="66" r="1.8" fill="#8c806b" />
          <path
            d="M44 74l3 2 3-2m-3 2v4m-2-2l-9-2m13 2l10-2"
            fill="none"
            stroke="#b59e8e"
          />
          <ellipse cx="29" cy="86" rx="8" ry="7" fill="#f3eedf" />
          <path d="M42 96h15" stroke="#b5a68e" />
        </svg>
      </button>
      <button
        className="garden-animal butterfly"
        onClick={() => onAnimal("butterfly")}
        aria-label="听蝴蝶的故事"
      >
        <svg viewBox="0 0 95 70">
          <path
            d="M46 34Q0-20 7 25Q10 41 42 37Q2 41 21 61Q35 66 46 40Q59 70 76 56Q87 39 52 36Q97 37 86 5Q74-11 51 33Z"
            fill="#d6b6a1"
            fillOpacity=".55"
            stroke="#b39d83"
          />
          <path
            d="M49 24v25m0-25l-7-9m7 9l8-8"
            stroke="#9d927b"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <button
        className="garden-animal dog"
        onClick={() => onAnimal("dog")}
        aria-label="听小狗的故事"
      >
        <svg viewBox="0 0 110 95">
          <path
            d="M23 47Q15 25 29 24L44 31Q57 15 74 29L85 25Q101 37 90 57L80 63Q94 90 56 88Q24 89 30 62Z"
            fill="#d4bc97"
            fillOpacity=".7"
            stroke="#a68f6b"
          />
          <path
            d="M29 30Q16 40 24 58L36 42m45-10Q101 42 87 59L75 44"
            fill="#b19b7a"
            fillOpacity=".5"
            stroke="#a68f6b"
          />
          <circle cx="46" cy="46" r="2" fill="#7e725d" />
          <circle cx="68" cy="46" r="2" fill="#7e725d" />
          <path d="M54 55q3-5 8 0l-4 4z" fill="#8c7b60" />
          <path
            d="M58 60v5m-7 0q7 7 14 0m-25 17h14m10 0h12"
            stroke="#9c8869"
            fill="none"
          />
        </svg>
      </button>
      {weather === "rain" && (
        <div className="gentle-rain" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => (
            <i
              key={i}
              style={{ left: i * 4.7 + "%", animationDelay: i * 0.13 + "s" }}
            />
          ))}
        </div>
      )}
      {weather === "stars" && (
        <div className="garden-starlight" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={{
                left: 8 + ((i * 37) % 85) + "%",
                top: 10 + ((i * 23) % 55) + "%",
                animationDelay: i * 0.25 + "s",
              }}
            >
              ✧
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
