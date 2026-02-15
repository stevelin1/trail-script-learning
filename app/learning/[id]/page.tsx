import { Metadata } from 'next';
import { LearningMaterialView } from '@/components/learning-material/learning-material';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const script = await prisma.script.findUnique({
    where: { id: params.id },
  });

  if (!script) {
    return {
      title: 'Not Found',
    };
  }

  const truncatedText = script.japaneseText.substring(0, 50);

  return {
    title: `${script.characterName} - Japanese Script Learning`,
    description: truncatedText,
  };
}

export default async function LearningPage({ params }: PageProps) {
  const script = await prisma.script.findUnique({
    where: { id: params.id },
  });

  if (!script) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <LearningMaterialView scriptId={params.id} />
      </div>
    </div>
  );
}
