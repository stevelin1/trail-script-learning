import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

interface FileGroup {
  fileName: string;
  totalScripts: number;
  learnedScripts: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get all unique file names with counts
    const files = await prisma.script.groupBy({
      by: ['fileName'],
      _count: {
        id: true,
      },
      orderBy: {
        fileName: 'asc',
      },
    });

    // Get learning material counts for each file
    const fileNames = files.map(f => f.fileName);
    const learningCounts = await Promise.all(
      fileNames.map(async (fileName) => {
        const count = await prisma.learningMaterial.count({
          where: {
            script: {
              fileName,
            },
          },
        });
        return { fileName, count };
      })
    );

    // Combine results
    const fileGroups: FileGroup[] = files.map(file => ({
      fileName: file.fileName,
      totalScripts: file._count.id,
      learnedScripts: learningCounts.find(lc => lc.fileName === file.fileName)?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      files: fileGroups,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
