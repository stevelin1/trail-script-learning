import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const gameId = searchParams.get('gameId');
    const scene = searchParams.get('scene');
    const character = searchParams.get('character');
    const search = searchParams.get('search');
    const fileName = searchParams.get('fileName');

    const where: any = {};

    if (fileName) {
      where.fileName = fileName;
    }

    if (gameId) {
      where.gameId = parseInt(gameId);
    }

    if (scene) {
      where.scene = scene;
    }

    if (character) {
      where.characterName = {
        contains: character,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        {
          japaneseText: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          englishText: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          characterName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where,
        orderBy: [
          { gameId: 'asc' },
          { scene: 'asc' },
          { row: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          gameId: true,
          scene: true,
          row: true,
          characterName: true,
          japaneseText: true,
          englishText: true,
          fileName: true,
        },
      }),
      prisma.script.count({ where }),
    ]);

    const scriptsWithLearningStatus = await Promise.all(
      scripts.map(async (script) => {
        const learningMaterial = await prisma.learningMaterial.findUnique({
          where: { scriptId: script.id },
        });
        return {
          ...script,
          hasLearningMaterial: !!learningMaterial,
        };
      })
    );

    return NextResponse.json({
      success: true,
      scripts: scriptsWithLearningStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}
