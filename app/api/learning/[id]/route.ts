import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const learningMaterial = await prisma.learningMaterial.findUnique({
      where: { id: params.id },
      include: {
        script: {
          select: {
            id: true,
            gameId: true,
            scene: true,
            row: true,
            characterName: true,
            japaneseText: true,
            englishText: true,
          },
        },
      },
    });

    if (!learningMaterial) {
      return NextResponse.json(
        { error: 'Learning material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      learningMaterial,
    });
  } catch (error) {
    console.error('Error fetching learning material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning material' },
      { status: 500 }
    );
  }
}
