export type PrintFinish =
  "blueprint" | "film" | "halftone" | "ccd" | "original";
export const printFinishes: {
  id: PrintFinish;
  name: string;
  filter: string;
}[] = [
  {
    id: "blueprint",
    name: "蓝色网点印刷",
    filter: "grayscale(1) sepia(.4) hue-rotate(175deg) contrast(1.4)",
  },
  {
    id: "film",
    name: "褪色胶片",
    filter: "sepia(.32) saturate(.5) contrast(.88) brightness(1.04)",
  },
  {
    id: "halftone",
    name: "Old School 网点版画",
    filter: "sepia(.55) saturate(.3) contrast(1.22)",
  },
  {
    id: "ccd",
    name: "古早 CCD",
    filter: "saturate(.65) contrast(.92) brightness(1.06) sepia(.14)",
  },
  { id: "original", name: "保留原色", filter: "none" },
];
// Bake the finish into the downloaded pixels, not only the browser preview.
export function developPrint(
  source: HTMLCanvasElement,
  finish: PrintFinish,
): HTMLCanvasElement {
  const output = document.createElement("canvas");
  output.width = source.width;
  output.height = source.height;
  const ctx = output.getContext("2d")!;
  ctx.fillStyle = "#e6ddc9";
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.filter = printFinishes.find((f) => f.id === finish)?.filter || "none";
  if (finish === "ccd") {
    const small = document.createElement("canvas");
    small.width = 640;
    small.height = Math.round((640 * source.height) / source.width);
    small.getContext("2d")!.drawImage(source, 0, 0, small.width, small.height);
    ctx.drawImage(small, 0, 0, output.width, output.height);
  } else ctx.drawImage(source, 0, 0);
  ctx.filter = "none";
  if (finish === "original") return output;
  const data = ctx.getImageData(0, 0, output.width, output.height);
  let seed = 17;
  for (let i = 0; i < data.data.length; i += 4) {
    if (finish === "blueprint") {
      const luminance =
        (data.data[i] * 0.2126 +
          data.data[i + 1] * 0.7152 +
          data.data[i + 2] * 0.0722) /
        255;
      const tone = Math.round(luminance * 6) / 6;
      data.data[i] = 7 + tone * 216;
      data.data[i + 1] = 16 + tone * 215;
      data.data[i + 2] = 42 + tone * 203;
    }
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const grain = (seed / 4294967296 - 0.5) * (finish === "ccd" ? 13 : 19);
    for (let channel = 0; channel < 3; channel++)
      data.data[i + channel] += grain;
  }
  ctx.putImageData(data, 0, 0);
  if (finish === "halftone" || finish === "blueprint") {
    const gap = Math.max(4, output.width / 300);
    ctx.fillStyle = finish === "blueprint" ? "#070c22" : "#463c2b";
    for (let y = gap / 2; y < output.height; y += gap) {
      for (let x = gap / 2; x < output.width; x += gap) {
        const i = (Math.floor(y) * output.width + Math.floor(x)) * 4;
        const shade =
          (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 765;
        ctx.globalAlpha = 0.18 + (1 - shade) * 0.22;
        ctx.beginPath();
        ctx.arc(x, y, gap * (0.12 + (1 - shade) * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  const vignette = ctx.createRadialGradient(
    output.width / 2,
    output.height / 2,
    output.width * 0.15,
    output.width / 2,
    output.height / 2,
    output.width * 0.7,
  );
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#66523822");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, output.width, output.height);
  return output;
}

// The receipt is the actual exported image, including its printed metadata.
export function developReceipt(
  source: HTMLCanvasElement,
  title: string,
  date: string,
): HTMLCanvasElement {
  const paper = document.createElement("canvas");
  paper.width = 900;
  paper.height = 1500;
  const ctx = paper.getContext("2d")!;
  ctx.fillStyle = "#f5f1e7";
  ctx.fillRect(0, 0, 900, 1500);
  ctx.fillStyle = "#383631";
  ctx.textAlign = "center";
  ctx.font = "bold 48px monospace";
  ctx.fillText("MEMORY GARDEN", 450, 125);
  ctx.font = "24px monospace";
  ctx.fillText("A LITTLE RECEIPT OF MY LIFE", 450, 172);
  const rule = (y: number) => {
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = "#77736b";
    ctx.beginPath();
    ctx.moveTo(65, y);
    ctx.lineTo(835, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  rule(210);
  ctx.font = "30px monospace";
  // Wrap long titles so personal text stays inside the narrow paper.
  const lines: string[] = [];
  let line = "";
  for (const character of title || "UNTITLED FRAGMENTS") {
    if (ctx.measureText(line + character).width > 750) {
      lines.push(line);
      line = "";
    }
    line += character;
  }
  lines.push(line);
  lines.slice(0, 3).forEach((text, i) => ctx.fillText(text, 450, 270 + i * 40));
  ctx.font = "24px monospace";
  ctx.fillText(date, 450, 400);
  const photo = document.createElement("canvas");
  photo.width = 750;
  photo.height = Math.round((750 * source.height) / source.width);
  const pc = photo.getContext("2d")!;
  pc.fillStyle = "white";
  pc.fillRect(0, 0, photo.width, photo.height);
  pc.drawImage(source, 0, 0, photo.width, photo.height);
  const pixels = pc.getImageData(0, 0, photo.width, photo.height);
  ctx.fillStyle = "#f5f1e7";
  ctx.fillRect(75, 450, photo.width, photo.height);
  ctx.fillStyle = "#34332f";
  for (let y = 2; y < photo.height; y += 4)
    for (let x = 2; x < photo.width; x += 4) {
      const i = (y * photo.width + x) * 4;
      const darkness =
        1 -
        (pixels.data[i] * 0.2126 +
          pixels.data[i + 1] * 0.7152 +
          pixels.data[i + 2] * 0.0722) /
          255;
      ctx.beginPath();
      ctx.arc(75 + x, 450 + y, Math.sqrt(darkness) * 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
  rule(1080);
  ctx.font = "26px monospace";
  ctx.fillText("1 MEMORY / PRICELESS", 450, 1140);
  ctx.font = "24px monospace";
  ctx.fillText("KEEP THIS MOMENT.", 450, 1195);
  ctx.fillText("THANK YOU FOR REMEMBERING", 450, 1235);
  for (let x = 160; x < 740; x += 7) {
    ctx.fillRect(x, 1300, (x % 3) + 2, 75);
  }
  ctx.font = "20px monospace";
  ctx.fillText("FRAGMENTS OF ME", 450, 1420);
  // A small perforated edge is part of the PNG, rather than a CSS-only effect.
  ctx.globalCompositeOperation = "destination-out";
  for (let x = 0; x < 900; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 1500);
    ctx.lineTo(x + 12, 1486);
    ctx.lineTo(x + 24, 1500);
    ctx.fill();
  }
  return paper;
}
