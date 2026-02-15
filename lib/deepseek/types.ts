export interface VocabularyEntry {
  word: string;
  reading: string;
  pitch?: string;
  partOfSpeech: string;
  meaning: string;
  context: string;
}

export interface GrammarPoint {
  name: string;
  form: string;
  usage: string;
  function: string;
  commonConfusion?: string;
}

export interface Translation {
  literal: string;
  natural: string;
  original: string;
  kana: string;
}

export interface LearningMaterial {
  originalText: string;
  vocabulary: VocabularyEntry[];
  grammar: GrammarPoint[];
  translation: Translation;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    }>;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
