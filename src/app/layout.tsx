import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: "GapFinder AI – Find What the Student Doesn't Know",
  description:
    'AI-powered diagnostic learning system that takes a student syllabus, textbooks, notes, and past exam papers, identifies topic-level weaknesses, and builds an adaptive revision plan with verifiable citations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-brand-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
