import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Japanese Script Learning - トレルス（軌跡）シリーズ 日本語学習アプリ',
  description: 'Learn Japanese dialogue from the Trails (Kiseki) series',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
