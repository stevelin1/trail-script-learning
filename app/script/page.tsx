import { Metadata } from 'next';
import { CsvUpload } from '@/components/csv-upload/csv-upload';
import { MdUpload } from '@/components/md-upload/md-upload';
import { ScriptList } from '@/components/script-list/script-list';

export const metadata: Metadata = {
  title: '台詞一覧 - Japanese Script Learning',
  description: 'Browse and learn Japanese dialogue from the Trails series',
};

export default function ScriptPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">台詞一覧</h1>
          <p className="text-gray-600">
            台詞を閲覧・学習する
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <CsvUpload />
            <MdUpload />
          </div>
          <div className="lg:col-span-2">
            <ScriptList />
          </div>
        </div>
      </div>
    </div>
  );
}
