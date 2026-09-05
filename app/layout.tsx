import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Trivia Showdown', description: 'Take the stage against two AI contestants. Play your own categories and clues.', icons: {icon:'/favicon.svg'} };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
