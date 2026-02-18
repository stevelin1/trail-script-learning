/**
 * Core parser for Japanese learning materials
 */

import type {
  LearningMaterial,
  VocabularyItem,
  GrammarItem,
  Translation,
  ParseResult,
} from './types';
import {
  SENTENCE_HEADER_REGEX,
  ORIGINAL_TEXT_REGEX,
  VOCAB_TABLE_HEADER_REGEX,
  VOCAB_TABLE_ROW_REGEX,
  READING_WITH_PITCH_REGEX,
  VERB_FORMS_REGEX,
  VERB_FORMS_ALT_REGEX,
  IS_VERB_REGEX,
  NO_VOCAB_MESSAGE_REGEX,
  GRAMMAR_SECTION_REGEX,
  GRAMMAR_NAME_REGEX,
  GRAMMAR_NAME_ALT_REGEX,
  GRAMMAR_FIELD_REGEX,
  GRAMMAR_FIELD_NUMBERED_REGEX,
  HAS_COMMON_CONFUSION_REGEX,
  HAS_SPEECH_NOTE_REGEX,
  EXPRESSION_ANALYSIS_REGEX,
  TRANSLATION_SECTION_REGEX,
  TRANSLATION_ITEM_REGEX,
  TRANSLATION_SIMPLE_REGEX,
  TRANSLATION_FIELD_NAMES,
  splitIntoSentenceBlocks,
  extractSection,
} from './constants';

/**
 * Main function to parse entire markdown content
 */
export function parseLearningMaterials(markdown: string): ParseResult[] {
  const blocks = splitIntoSentenceBlocks(markdown);
  return blocks.map((block, index) => {
    const headerMatch = block.match(SENTENCE_HEADER_REGEX);
    const sentenceNumber = headerMatch ? parseInt(headerMatch[2], 10) : index + 1;
    return parseSentenceBlock(block, sentenceNumber);
  });
}

/**
 * Parse a single sentence block
 */
export function parseSentenceBlock(
  block: string,
  sentenceNumber: number
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract original text
  const originalTextMatch = block.match(ORIGINAL_TEXT_REGEX);
  if (!originalTextMatch) {
    errors.push('No original text found');
  }

  // Parse vocabulary section
  const vocabSection = extractSection(
    block,
    VOCAB_TABLE_HEADER_REGEX,
    GRAMMAR_SECTION_REGEX
  );
  let vocabulary: VocabularyItem[] = [];
  if (vocabSection) {
    vocabulary = parseVocabularyTable(vocabSection, warnings);
  } else {
    warnings.push('No vocabulary section found');
  }

  // Parse grammar section
  const grammarSection = extractSection(
    block,
    GRAMMAR_SECTION_REGEX,
    TRANSLATION_SECTION_REGEX
  );
  let grammar: GrammarItem[] = [];
  if (grammarSection) {
    grammar = parseGrammarSection(grammarSection, warnings);
  } else {
    warnings.push('No grammar section found');
  }

  // Parse translation section
  const translation = parseTranslationSection(block, warnings);

  // Validate required fields
  if (!originalTextMatch) {
    return {
      success: false,
      sentenceNumber,
      errors,
      warnings,
    };
  }

  const data: LearningMaterial = {
    originalText: originalTextMatch[1].trim(),
    vocabulary,
    grammar,
    translation,
  };

  return {
    success: true,
    sentenceNumber,
    data,
    errors,
    warnings,
  };
}

/**
 * Parse vocabulary table from section
 */
function parseVocabularyTable(
  section: string,
  warnings: string[]
): VocabularyItem[] {
  const vocabulary: VocabularyItem[] = [];

  // Check for no vocab message (special case)
  if (NO_VOCAB_MESSAGE_REGEX.test(section.trim())) {
    return vocabulary;
  }

  // Extract data rows from table
  const lines = section.split('\n');
  for (const line of lines) {
    const rowMatch = line.match(VOCAB_TABLE_ROW_REGEX);
    if (rowMatch) {
      // Skip header row (contains "单词") and separator row (contains ":---")
      const firstCol = rowMatch[1].trim();
      if (firstCol.includes('单词') || firstCol.startsWith(':')) {
        continue;
      }

      const item = parseVocabularyRow(rowMatch, warnings);
      if (item) {
        vocabulary.push(item);
      }
    }
  }

  return vocabulary;
}

/**
 * Parse a single vocabulary row
 */
function parseVocabularyRow(
  match: RegExpMatchArray,
  warnings: string[]
): VocabularyItem | null {
  const [, word, readingWithPitch, partOfSpeech, meaning, context] = match;

  // Clean up fields
  const cleanWord = word.replace(/\*\*/g, '').trim();
  const cleanReadingWithPitch = readingWithPitch.replace(/\*\*/g, '').trim();
  const cleanPartOfSpeech = partOfSpeech.trim();
  const cleanMeaning = meaning.replace(/\*\*/g, '').trim();
  const cleanContext = context.replace(/\*\*/g, '').trim();

  // Split reading and pitch
  let reading = cleanReadingWithPitch;
  let pitch = '';
  const pitchMatch = cleanReadingWithPitch.match(READING_WITH_PITCH_REGEX);
  if (pitchMatch) {
    reading = pitchMatch[1];
    pitch = pitchMatch[2];
  }

  // Extract verb forms if this is a verb
  let verbForms: string | undefined;
  if (IS_VERB_REGEX.test(cleanPartOfSpeech)) {
    verbForms = extractVerbForms(cleanContext, cleanPartOfSpeech);
    if (!verbForms) {
      warnings.push(`Could not extract verb forms for: ${cleanWord}`);
    }
  }

  return {
    word: cleanWord,
    reading,
    pitch,
    partOfSpeech: cleanPartOfSpeech,
    verbForms,
    meaning: cleanMeaning,
    context: cleanContext,
  };
}

/**
 * Extract verb forms from context or part of speech field
 */
function extractVerbForms(
  context: string,
  partOfSpeech: string
): string | undefined {
  // Try to find verb forms in context
  const verbMatch = context.match(VERB_FORMS_REGEX);
  if (verbMatch) {
    const forms: string[] = [];
    // Clean each form by removing parenthetical content like (はりだす③) or （はりだす③）
    const cleanForm = (s: string) => s.replace(/\s*[（\(][^））)]*[）\)]\s*/g, '');
    if (verbMatch[1]) forms.push(cleanForm(verbMatch[1]));
    if (verbMatch[2]) forms.push(cleanForm(verbMatch[2]));
    if (verbMatch[3]) forms.push(cleanForm(verbMatch[3]));
    if (forms.length >= 2) {
      return forms.join('/');
    }
  }

  // Try alternative format in part of speech field
  const altMatch = partOfSpeech.match(VERB_FORMS_ALT_REGEX);
  if (altMatch) {
    return altMatch[1];
  }

  return undefined;
}

/**
 * Parse grammar section
 */
function parseGrammarSection(
  section: string,
  warnings: string[]
): GrammarItem[] {
  const grammarItems: GrammarItem[] = [];

  // Detect format type (asterisk vs numbered)
  const hasNumberedFormat = /^\d+\.\s*\*\*语法点名称\*\*/.test(section);

  if (hasNumberedFormat) {
    return parseNumberedGrammarFormat(section, warnings);
  } else {
    return parseAsteriskGrammarFormat(section, warnings);
  }
}

/**
 * Parse grammar in numbered format (1. **语法点名称**: ...)
 */
function parseNumberedGrammarFormat(
  section: string,
  warnings: string[]
): GrammarItem[] {
  const grammarItems: GrammarItem[] = [];

  // Split by grammar point name markers
  const namePattern = /^\d+\.\s*\*\*语法点名称\*\*[：:]\s*/gm;
  const parts = section.split(namePattern).filter((p) => p.trim());

  for (const part of parts) {
    const item = parseGrammarItemBlock(part, warnings);
    if (item) {
      grammarItems.push(item);
    }
  }

  return grammarItems;
}

/**
 * Parse grammar in asterisk format (* **语法点名称**: ...)
 */
function parseAsteriskGrammarFormat(
  section: string,
  warnings: string[]
): GrammarItem[] {
  const grammarItems: GrammarItem[] = [];

  // Remove section header lines if present (e.g., "第二部分 — 语法要点拆解（结合原文）")
  // These lines don't contain grammar point information and should not be parsed
  const lines = section.split('\n');
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\*\s*\*\*语法点名称/)) {
      startIndex = i;
      break;
    }
  }
  const cleanedSection = startIndex > 0 ? lines.slice(startIndex).join('\n') : section;

  // Split by grammar point name markers
  const namePattern = /^\*\s*\*\*语法点名称\*\*[：:]\s*/gm;
  const parts = cleanedSection.split(namePattern).filter((p) => p.trim());

  for (const part of parts) {
    const item = parseGrammarItemBlock(part, warnings);
    if (item) {
      grammarItems.push(item);
    }
  }

  return grammarItems;
}

/**
 * Clean up multi-line field content by removing bullet points and extra spacing
 */
function cleanFieldContent(lines: string[]): string {
  return lines
    .map(line => {
      // Remove bullet point markers at the start (like "*   " or "* ")
      // Also handle indented bullet points like "    *   "
      const cleaned = line.replace(/^\s*\*\s+/, '').trim();
      return cleaned;
    })
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Parse a single grammar item block
 */
function parseGrammarItemBlock(
  block: string,
  warnings: string[]
): GrammarItem | null {
  const lines = block.split('\n');
  const fields: Record<string, string> = {};

  // First line should be the name
  const nameLine = lines[0];
  const nameMatch = nameLine.match(/^([^\n*]+)/);
  const name = nameMatch ? nameMatch[1].trim() : '';

  if (!name) {
    return null;
  }

  // Parse remaining fields with multi-line support
  let currentField: string | null = null;
  let currentContent: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Check for numbered field header
    const numberedMatch = line.match(GRAMMAR_FIELD_NUMBERED_REGEX);
    // Check for asterisk field header
    const asteriskMatch = !numberedMatch ? line.match(GRAMMAR_FIELD_REGEX) : null;

    if (numberedMatch || asteriskMatch) {
      // Save previous field content (clean up bullet points)
      if (currentField) {
        fields[currentField] = cleanFieldContent(currentContent);
      }

      // Start new field
      const match = numberedMatch || asteriskMatch;
      if (match) {
        currentField = match[1].trim();
        currentContent = [match[2].trim()];
      }
    } else if (currentField) {
      // Add line to current field content
      currentContent.push(line);
    }
  }

  // Don't forget the last field
  if (currentField) {
    fields[currentField] = cleanFieldContent(currentContent);
  }

  // Check for common confusion section (multi-line content) - override if exists
  if (HAS_COMMON_CONFUSION_REGEX.test(block)) {
    const confusionSection = extractMultiLineContent(
      block,
      HAS_COMMON_CONFUSION_REGEX
    );
    if (confusionSection) {
      fields['常见混淆点对比'] = confusionSection;
    }
  }

  // Check for speech note section (multi-line content) - override if exists
  if (HAS_SPEECH_NOTE_REGEX.test(block)) {
    const speechNoteSection = extractMultiLineContent(
      block,
      HAS_SPEECH_NOTE_REGEX
    );
    if (speechNoteSection) {
      fields['口语缩略'] = speechNoteSection;
    }
  }

  const grammarItem: GrammarItem = {
    name,
    form: fields['形式与构成'] || '',
    usage: fields['本句中的具体使用方式'] || fields['本句中的具体使用'] || '',
    function: fields['功能与语感'] || '',
  };

  if (fields['常见混淆点对比']) {
    grammarItem.commonConfusion = fields['常见混淆点对比'];
  }

  if (fields['口语缩略']) {
    grammarItem.speechNote = fields['口语缩略'];
  }

  return grammarItem;
}

/**
 * Extract multi-line content after a marker
 */
function extractMultiLineContent(block: string, marker: RegExp): string {
  const match = block.search(marker);
  if (match === -1) return '';

  const afterMarker = block.substring(match + marker.lastIndex || match);
  const lines = afterMarker.split('\n').slice(1);

  // Collect lines until next grammar section or end
  const content: string[] = [];
  for (const line of lines) {
    if (line.match(/^\s*[\*\d]+\.\s*\*\*/) || line.match(/^\*\*第二部分/)) {
      break;
    }
    content.push(line);
  }

  return content.join('\n').trim();
}

/**
 * Parse translation section
 * Returns translation object with empty strings for missing fields
 */
function parseTranslationSection(block: string, warnings: string[]): Translation {
  // Check if translation section exists
  const translationSection = extractSection(block, TRANSLATION_SECTION_REGEX);

  const translation: Translation = {
    literal: '',
    natural: '',
    original: '',
    kana: '',
  };

  if (!translationSection) {
    // No translation section - this is a special expression
    warnings.push('No translation section found (special expression)');
    return translation;
  }

  // Parse translation items
  const lines = translationSection.split('\n');
  const fieldMap: Record<string, string> = {};

  for (const line of lines) {
    // Try numbered format first
    let match = line.match(TRANSLATION_ITEM_REGEX);
    if (match) {
      const [, fieldName, fieldValue] = match;
      // Clean field name by removing ** markers
      const cleanFieldName = fieldName.replace(/\*\*/g, '').trim();
      // Clean field value by removing ** markers and extra whitespace
      const cleanFieldValue = fieldValue.replace(/\*\*/g, '').trim();
      fieldMap[cleanFieldName] = cleanFieldValue;
    } else {
      // Try simple format
      match = line.match(TRANSLATION_SIMPLE_REGEX);
      if (match) {
        const [, fieldName, fieldValue] = match;
        fieldMap[fieldName.trim()] = fieldValue.trim();
      }
    }
  }

  // Map to translation fields
  if (fieldMap[TRANSLATION_FIELD_NAMES.LITERAL]) {
    translation.literal = fieldMap[TRANSLATION_FIELD_NAMES.LITERAL];
  }
  if (fieldMap[TRANSLATION_FIELD_NAMES.NATURAL]) {
    translation.natural = fieldMap[TRANSLATION_FIELD_NAMES.NATURAL];
  }
  if (fieldMap[TRANSLATION_FIELD_NAMES.ORIGINAL]) {
    translation.original = fieldMap[TRANSLATION_FIELD_NAMES.ORIGINAL];
  }
  if (fieldMap[TRANSLATION_FIELD_NAMES.KANA]) {
    translation.kana = fieldMap[TRANSLATION_FIELD_NAMES.KANA];
  }

  // Check if we got any translation data
  if (Object.values(translation).every((v) => v === '')) {
    warnings.push('Translation section found but no translation fields extracted');
  }

  return translation;
}
