/**
 * Type definitions for Japanese learning materials parser
 */

/**
 * Main learning material structure matching the JSON format
 */
export interface LearningMaterial {
  originalText: string;
  vocabulary: VocabularyItem[];
  grammar: GrammarItem[];
  translation: Translation;
}

/**
 * Vocabulary item with all required fields
 */
export interface VocabularyItem {
  word: string;
  reading: string; // 仅假名，不含音调数字
  pitch: string;   // 仅音调数字，如①②③
  partOfSpeech: string;
  verbForms?: string; // 可选，仅动词有
  meaning: string;
  context: string;
}

/**
 * Grammar point structure
 */
export interface GrammarItem {
  name: string;
  form: string;
  usage: string;
  function: string;
  commonConfusion?: string; // 可选
  speechNote?: string; // 可选，口语缩略说明
}

/**
 * Translation with all four formats
 */
export interface Translation {
  literal: string;
  natural: string;
  original: string;
  kana: string;
}

/**
 * Result of parsing a single sentence block
 */
export interface ParseResult {
  success: boolean;
  sentenceNumber?: number;
  data?: LearningMaterial;
  errors: string[];
  warnings: string[];
}

/**
 * Report for full file testing
 */
export interface TestReport {
  total: number;
  success: number;
  failed: number;
  failures: ParseResult[];
}
