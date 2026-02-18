import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { parseLearningMaterials } from '@/lib/md-parser';

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'File must be a Markdown (.md) file' },
        { status: 400 }
      );
    }

    const content = await file.text();
    console.log('=== MD Upload API called at:', new Date().toISOString(), 'fileName:', file.name, '===');

    // Parse markdown content
    const parseResults = parseLearningMaterials(content);
    console.log('Parsed', parseResults.length, 'sentence blocks');

    const fileName = file.name; // Keep the full filename including .md extension

    // Find all scripts with matching filename
    const scripts = await prisma.script.findMany({
      where: { fileName },
    });

    if (scripts.length === 0) {
      return NextResponse.json(
        { error: `No scripts found for file: ${fileName}. Please upload the corresponding CSV file first.` },
        { status: 404 }
      );
    }

    console.log('Found', scripts.length, 'scripts with fileName:', fileName);

    // Process each parsed result
    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ sentenceNumber?: number; originalText?: string; errors: string[] }> = [];

    for (const parseResult of parseResults) {
      if (!parseResult.success || !parseResult.data) {
        failureCount++;
        failures.push({
          sentenceNumber: parseResult.sentenceNumber,
          errors: parseResult.errors,
        });
        console.log('Parse failed for sentence', parseResult.sentenceNumber, ':', parseResult.errors);
        continue;
      }

      const originalText = parseResult.data.originalText;

      // Find matching script by japaneseText (exact match with originalText)
      const script = scripts.find((s) => s.japaneseText === originalText);

      if (!script) {
        failureCount++;
        failures.push({
          sentenceNumber: parseResult.sentenceNumber,
          originalText,
          errors: [`No matching script found for japaneseText: ${originalText}`],
        });
        console.log('No matching script found for originalText:', originalText);
        continue;
      }

      // Convert parsed data to database format
      const learningMaterialContent: Prisma.InputJsonValue = {
        originalText: parseResult.data.originalText,
        vocabulary: parseResult.data.vocabulary.map((v) => {
          // Merge verbForms and pitch into context or use appropriate fields
          const contextParts: string[] = [v.context];
          if (v.verbForms) {
            contextParts.push(`活用形: ${v.verbForms}`);
          }
          return {
            word: v.word,
            reading: v.reading,
            pitch: v.pitch || undefined,
            partOfSpeech: v.partOfSpeech,
            meaning: v.meaning,
            context: contextParts.join('\n'),
          };
        }),
        grammar: parseResult.data.grammar.map((g) => {
          const grammarItem: Record<string, string> = {
            name: g.name,
            form: g.form,
            usage: g.usage,
            function: g.function,
          };
          if (g.commonConfusion) {
            grammarItem.commonConfusion = g.commonConfusion;
          }
          // speechNote is optional - if the existing structure doesn't support it, it will be included in the JSON
          if (g.speechNote) {
            grammarItem.speechNote = g.speechNote;
          }
          return grammarItem;
        }),
        translation: {
          literal: parseResult.data.translation.literal,
          natural: parseResult.data.translation.natural,
          original: parseResult.data.translation.original,
          kana: parseResult.data.translation.kana,
        },
      };

      // Save learning material (handle race condition with upsert)
      try {
        await prisma.learningMaterial.upsert({
          where: { scriptId: script.id },
          update: {
            content: learningMaterialContent,
            generatedBy: 'md-upload',
            status: 'completed',
          },
          create: {
            scriptId: script.id,
            content: learningMaterialContent,
            generatedBy: 'md-upload',
            status: 'completed',
          },
        });
        successCount++;
        console.log('Successfully saved learning material for scriptId:', script.id);
      } catch (e: any) {
        failureCount++;
        failures.push({
          sentenceNumber: parseResult.sentenceNumber,
          originalText,
          errors: [`Failed to save to database: ${e.message || 'Unknown error'}`],
        });
        console.error('Error saving learning material:', e);
      }
    }

    console.log('=== MD Upload completed:', successCount, 'success,', failureCount, 'failed ===');

    return NextResponse.json({
      success: true,
      message: 'Markdown file uploaded successfully',
      stats: {
        total: parseResults.length,
        success: successCount,
        failed: failureCount,
      },
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    console.error('Error uploading MD:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload Markdown file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
