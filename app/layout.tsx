import type { Metadata } from "next";
import "./globals.css";
import "./scrapbook.css";
import "./garden.css";
export const metadata: Metadata = {
  title: "Memory Garden — 一本会生长的私人故事书",
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
