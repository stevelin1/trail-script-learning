import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { generateLearningMaterial } from '@/lib/deepseek/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId } = body;

    if (!scriptId) {
      return NextResponse.json(
        { error: 'scriptId is required' },
        { status: 400 }
      );
    }

    // Check if script exists
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Check if learning material already exists
    const existingMaterial = await prisma.learningMaterial.findUnique({
      where: { scriptId },
      include: {
        script: true,
      },
    });

    if (existingMaterial) {
      return NextResponse.json({
        success: true,
        cached: true,
        learningMaterial: existingMaterial,
      });
    }

    // Generate learning material using DeepSeek
    const content = await generateLearningMaterial(
      script.japaneseText,
      script.characterName
    );

    // Save to database (handle race condition where another request may have created it)
    let learningMaterial;
    try {
      learningMaterial = await prisma.learningMaterial.create({
        data: {
          scriptId,
          content: content as Prisma.JsonValue,
          generatedBy: 'deepseek-chat',
          status: 'completed',
        },
        include: {
          script: true,
        },
      });
    } catch (e: any) {
      // If unique constraint violated, another request already created it
      if (e.code === 'P2002') {
        learningMaterial = await prisma.learningMaterial.findUnique({
          where: { scriptId },
          include: { script: true },
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json({
      success: true,
      cached: false,
      learningMaterial,
    });
  } catch (error) {
    console.error('Error generating learning material:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate learning material',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
