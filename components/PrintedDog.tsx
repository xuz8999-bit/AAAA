"use client";
import { useId } from "react";
import { asset } from "../lib/assets";
const dogs = {
  corgi: {
    src: "/prints/dog1.jpg",
    box: "200 160 215 235",
    width: 500,
    height: 500,
    path: "M215 167Q203 167 209 198L216 221Q205 236 211 254L225 269 235 292Q232 324 242 351L236 368Q247 382 266 375L284 379Q313 387 336 381L388 391 414 382Q402 362 391 338Q369 311 343 295L317 281Q300 264 289 252Q313 235 308 217L304 177Q295 164 280 184L267 203 245 203Q225 175 215 167Z",
  },
  shepherd: {
    src: "/prints/dog2.jpg",
    box: "60 130 410 365",
    width: 500,
    height: 500,
    path: "M272 141L278 178Q301 165 319 181L349 139 354 190Q372 211 384 238L404 248Q414 268 393 282L380 299 375 326Q389 362 386 394L401 428 454 463 471 486 444 497 367 480 303 474 273 472 249 483 212 480 176 474 141 477 68 466 75 449 106 436Q108 390 131 363L182 332 209 304Q220 259 248 217L262 196Z",
  },
  samoyed: {
    src: "/prints/dog.jpg",
    box: "135 20 1270 1140",
    width: 1546,
    height: 1213,
    path: "M405 37Q373 71 355 142L329 166 307 198 276 235 256 274 252 325 247 355 210 380 190 429 175 481Q143 573 195 647L245 688Q320 776 340 854L337 1008 357 1086 430 1094 475 1087 502 1108 638 1129 770 1134 880 1110 989 1094 1091 1080 1228 1094Q1390 1091 1362 995L1393 967 1374 937 1333 926 1365 886 1310 883 1340 850 1277 854 1270 819 1238 838 1215 800 1167 827 1136 804 1100 833 1048 807Q960 732 914 655L877 583 846 538 790 490 746 444 706 427 686 393 653 351 641 309 610 281 603 243 593 192 592 151 565 148 530 166 503 177 473 157 447 149 431 107 422 67Z",
  },
};
export default function PrintedDog({
  kind,
  className = "",
  label,
}: {
  kind: keyof typeof dogs;
  className?: string;
  label: string;
}) {
  const id = "cutout" + useId().replace(/:/g, "");
  const d = dogs[kind];
  return (
    <svg className={className} viewBox={d.box} role="img" aria-label={label}>
      <defs>
        <clipPath id={id}>
          <path d={d.path} />
        </clipPath>
      </defs>
      <image
        href={asset(d.src)}
        width={d.width}
        height={d.height}
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}
