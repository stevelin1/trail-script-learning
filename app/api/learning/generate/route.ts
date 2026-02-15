import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { generateLearningMaterial } from '@/lib/deepseek/client';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { scriptId } = body;

    console.log('=== Learning Generate API called at:', new Date().toISOString(), 'scriptId:', scriptId, '==');

    if (!scriptId) {
      console.log('Step 1: Error: scriptId is required');
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
      console.log('Step 2: Error: Script not found');
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    console.log('Step 3: Script found:', { id: script.id, fileName: script.fileName, characterName: script.characterName });

    // Check if learning material already exists
    const existingMaterial = await prisma.learningMaterial.findUnique({
      where: { scriptId },
      include: {
        script: true,
      },
    });

    if (existingMaterial) {
      console.log('Step 4: Learning material already exists, id:', existingMaterial.id);
      return NextResponse.json({
        success: true,
        cached: true,
        learningMaterial: existingMaterial,
      });
    }

    // Generate learning material using DeepSeek
    console.log('Step 5: Calling DeepSeek API...');
    const content = await generateLearningMaterial(
      script.japaneseText,
      script.characterName
    );

    console.log('Step 6: DeepSeek response received, content keys:', Object.keys(content));

    // Save to database (handle race condition where another request may have created it)
    let learningMaterial;
    try {
      console.log('Step 7: Creating learning material in database...');
      learningMaterial = await prisma.learningMaterial.create({
        data: {
          scriptId,
          content: content as unknown as Prisma.InputJsonValue,
          generatedBy: 'deepseek-chat',
          status: 'completed',
        },
        include: {
          script: true,
        },
      });
      console.log('Step 8: Successfully created learning material, id:', learningMaterial.id, 'scriptId:', scriptId);
    } catch (e: any) {
      console.log('Step 9: Error creating learning material:', e);
      // If unique constraint violated, another request already created it
      if (e.code === 'P2002') {
        console.log('Step 10: Learning material already exists (P2002), fetching existing: ', scriptId);
        learningMaterial = await prisma.learningMaterial.findUnique({
          where: { scriptId },
          include: { script: true },
        });
        console.log('Step 11: Found existing learning material:', learningMaterial?.id);
      } else {
        console.log('Step 12: Other error, rethrowing:', e);
        throw e;
      }
    }

    const processingTime = Date.now() - startTime;
    console.log('=== Learning Generate API completed, processing time:', processingTime, 'ms', '===');

    const response = NextResponse.json({
      success: true,
      cached: false,
      learningMaterial,
    });

    console.log('Step 13: Returning response, learningMaterial id:', learningMaterial?.id);

    return response;
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
