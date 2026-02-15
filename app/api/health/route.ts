import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { isDeepSeekAvailable } from '@/lib/deepseek/client';

export async function GET() {
  try {
    const [dbHealth, deepseekHealth] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      isDeepSeekAvailable(),
    ]);

    const dbStatus = dbHealth.status === 'fulfilled';
    const deepseekStatus = deepseekHealth.status === 'fulfilled' && deepseekHealth.value;

    return NextResponse.json({
      status: dbStatus ? 'healthy' : 'unhealthy',
      database: dbStatus ? 'connected' : 'disconnected',
      deepseek: deepseekStatus ? 'available' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
