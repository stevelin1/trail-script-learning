import OpenAI from 'openai';
import { LearningMaterial, DeepSeekResponse } from './types';
import { LEARNING_MATERIAL_SYSTEM_PROMPT, buildLearningMaterialUserPrompt } from './prompts';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  maxRetries: 3,
  timeout: 60000,
});

export async function generateLearningMaterial(
  japaneseText: string,
  characterName?: string,
): Promise<LearningMaterial> {
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: LEARNING_MATERIAL_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildLearningMaterialUserPrompt(japaneseText, characterName),
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }) as DeepSeekResponse;

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('No content in DeepSeek response');
    }

    const parsed = JSON.parse(content) as LearningMaterial;

    // Validate response structure
    if (!parsed.originalText || !Array.isArray(parsed.vocabulary) || !Array.isArray(parsed.grammar) || !parsed.translation) {
      throw new Error('Invalid response structure from DeepSeek');
    }

    return parsed;
  } catch (error) {
    console.error('Error generating learning material:', error);
    throw error;
  }
}

export async function isDeepSeekAvailable(): Promise<boolean> {
  try {
    await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    });
    return true;
  } catch {
    return false;
  }
}
