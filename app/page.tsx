import Link from 'next/link';
import { BookOpen, Upload, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Japanese Script Learning
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              日本語台詞学習アプリ
            </p>
            <p className="text-gray-500">
              トレルス（軌跡）シリーズの台詞で日本語を学ぶ
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Link
              href="/script"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-purple-200"
            >
              <div className="flex flex-col items-center text-center">
                <Upload className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">CSVアップロード</h3>
                <p className="text-gray-500 text-sm">
                  ゲーム台詞のCSVファイルをアップロードして学習データを作成
                </p>
              </div>
            </Link>

            <Link
              href="/script"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-blue-200"
            >
              <div className="flex flex-col items-center text-center">
                <BookOpen className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">台詞を閲覧</h3>
                <p className="text-gray-500 text-sm">
                  登録された台詞を検索・閲覧して学びたいものを選択
                </p>
              </div>
            </Link>

            <Link
              href="/script"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-pink-200"
            >
              <div className="flex flex-col items-center text-center">
                <Sparkles className="w-12 h-12 text-pink-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">学習資料生成</h3>
                <p className="text-gray-500 text-sm">
                  AIで語彙・文法・翻訳の詳細な学習資料を生成
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">使い方</h2>
            <ol className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </span>
                <p>CSVファイルをアップロードする</p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </span>
                <p>台詞リストから学びたい台詞を選択する</p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </span>
                <p>AIが生成した学習資料で語彙・文法・翻訳を学習する</p>
              </li>
            </ol>
          </div>

          <footer className="mt-16 text-center text-gray-400 text-sm">
            <p>Built with Next.js, Prisma, and DeepSeek</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
