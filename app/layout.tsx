import type { Metadata } from 'next';
import './globals.css';
import './scrapbook.css';
export const metadata: Metadata = { title: 'Fragments of Me — A Personal Scrapbook', description: 'A handwritten collection of photographs, words, and little things worth keeping.', icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/art/pixel-butterfly.svg` } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
