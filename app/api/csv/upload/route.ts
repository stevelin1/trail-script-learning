import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, validateCSVStructure } from '@/lib/csv/parser';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    const content = await file.text();

    // Validate CSV structure
    const validation = validateCSVStructure(content);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Parse CSV
    const parseResult = parseCSV(content);

    if (!parseResult.success || parseResult.validRows === 0) {
      return NextResponse.json(
        {
          error: 'Failed to parse CSV',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Insert scripts into database
    const batchSize = 100;
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < parseResult.scripts.length; i += batchSize) {
      const batch = parseResult.scripts.slice(i, i + batchSize);

      const result = await Promise.allSettled(
        batch.map(async (script) => {
          try {
            await prisma.script.upsert({
              where: {
                gameId_scene_row: {
                  gameId: script.gameId,
                  scene: script.scene,
                  row: script.row,
                },
              },
              update: {
                characterName: script.characterName,
                japaneseText: script.japaneseText,
                englishText: script.englishText,
              },
              create: {
                gameId: script.gameId,
                scene: script.scene,
                row: script.row,
                characterName: script.characterName,
                japaneseText: script.japaneseText,
                englishText: script.englishText,
              },
            });
            return { success: true };
          } catch (error) {
            return { success: false, error };
          }
        })
      );

      insertedCount += result.filter((r) => r.status === 'fulfilled' && r.value.success).length;
      skippedCount += result.filter((r) => r.status === 'fulfilled' && !r.value.success).length;
    }

    return NextResponse.json({
      success: true,
      message: 'CSV uploaded successfully',
      stats: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        inserted: insertedCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to upload CSV' },
      { status: 500 }
    );
  }
}
