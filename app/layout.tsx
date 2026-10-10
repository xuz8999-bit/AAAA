import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Fragments of Me — Personal Memory OS', description: 'A private universe of photographs, words, and things worth keeping.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
