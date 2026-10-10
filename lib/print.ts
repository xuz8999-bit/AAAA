export type PrintFinish = "film" | "halftone" | "ccd" | "original";
export const printFinishes: {
  id: PrintFinish;
  name: string;
  filter: string;
}[] = [
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
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const grain = (seed / 4294967296 - 0.5) * (finish === "ccd" ? 13 : 19);
    for (let channel = 0; channel < 3; channel++)
      data.data[i + channel] += grain;
  }
  ctx.putImageData(data, 0, 0);
  if (finish === "halftone") {
    const gap = Math.max(4, output.width / 300);
    ctx.fillStyle = "#463c2b";
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
