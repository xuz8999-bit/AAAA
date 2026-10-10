import type { Metadata } from "next";
import "./globals.css";
import "./scrapbook.css";
import "./garden.css";
import "./print.css";
import "./botanical.css";
export const metadata: Metadata = {
  title: "MEMORY GARDEN — Digital Botanical Archive",
  description:
    "Forgotten memories preserved as blue botanical specimens. 照片、声音与情绪构成的私人植物档案。",
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
