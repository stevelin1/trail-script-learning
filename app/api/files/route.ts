import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

interface FileGroup {
  fileName: string;
  totalScripts: number;
  learnedScripts: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('=== Files API called at:', new Date().toISOString());

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

    console.log('Step 1: Grouped files:', files.map(f => ({ fileName: f.fileName, count: f._count.id })));

    // Get learning material counts for each file
    // Query by fileName and count only completed learning materials
    const fileNames = files.map(f => f.fileName);
    const learningCounts = await Promise.all(
      fileNames.map(async (fileName) => {
        const count = await prisma.learningMaterial.count({
          where: {
            script: {
              fileName,
              learningMaterial: {
                status: 'completed',
              },
            },
          },
        });
        console.log(`Step 2: File: ${fileName}, Learning count: ${count}`);
        return { fileName, count };
      })
    );

    console.log('Step 3: All learning counts:', learningCounts.map(lc => ({ fileName: lc.fileName, count: lc.count })));

    // Combine results
    const fileGroups: FileGroup[] = files.map(file => ({
      fileName: file.fileName,
      totalScripts: file._count.id,
      learnedScripts: learningCounts.find(lc => lc.fileName === file.fileName)?.count || 0,
    }));

    console.log('Step 4: Final file groups:', fileGroups.map(f => ({ fileName: f.fileName, learnedScripts: f.learnedScripts })));

    const response = NextResponse.json({
      success: true,
      files: fileGroups,
    });

    const processingTime = Date.now() - startTime;
    console.log('Step 5: Response ready, processing time:', processingTime, 'ms');

    return response;
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
