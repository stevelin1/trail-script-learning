import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP, Noto_Serif_JP, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
});
const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-jp',
});
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
});

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
      <body className={`${inter.className} ${notoSansJP.variable} ${notoSansSC.variable}`}>{children}</body>
    </html>
  );
}
