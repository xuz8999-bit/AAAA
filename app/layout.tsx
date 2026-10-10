import type { Metadata } from "next";
import "./globals.css";
import "./scrapbook.css";
import "./garden.css";
import "./print.css";
export const metadata: Metadata = {
  title: "拾光剪贴簿 — 去过的地方，喜欢的事物，关于我",
  description:
    "种下一段记忆，探索属于自己的花园。A gentle interactive storybook of your life.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/art/pixel-butterfly.svg`,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
