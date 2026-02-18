/**
 * Regular expression constants for Japanese learning materials parser
 */

// ============================================================================
// SECTION 1: Sentence separation
// ============================================================================

/**
 * Match sentence header: ### 句 N or 句 N or ### 句 **N** (with optional bold markers)
 * Captures the sentence number in group 2
 * Updated to NOT match lines like "句76以..." that start with "句" followed by a number but are part of extended explanations
 */
export const SENTENCE_HEADER_REGEX = /^(###\s+)?句\s*\*?(\d+)\*?\s*(?:\*\*)?\s*$/m;

/**
 * Match original text line: 原文：...
 * Captures the text in group 1
 */
export const ORIGINAL_TEXT_REGEX = /^原文[：:]\s*(.+)$/m;

/**
 * Match extended explanation section: **🎯 扩展讲解（句 N）：**
 */
export const EXTENDED_EXPLANATION_REGEX = /^\*\*🎯 扩展讲解[^\*]*\*\*/;

/**
 * Match progress indicator: 已处理到第 X 句（总句数 Y）
 */
export const PROGRESS_INDICATOR_REGEX = /^已处理到第\s*(\d+)\s*句/;

// ============================================================================
// SECTION 2: Vocabulary table parsing
// ============================================================================

/**
 * Match the vocabulary table header row
 * | 单词 / 短语 | 读音（含数字音调） | 词性 | 释义 | 语境说明 |
 */
export const VOCAB_TABLE_HEADER_REGEX =
  /^\|\s*单词\s*[^|]*\|\s*读音\s*[^|]*\|\s*词性\s*\|\s*释义\s*\|\s*语境说明\s*\|/m;

/**
 * Match the separator row with alignment markers (e.g., | :--- |)
 */
export const VOCAB_TABLE_SEPARATOR_REGEX = /^\|\s*:-+.*\|$/m;

/**
 * Extract each row data from vocabulary table
 * Groups: 1=word, 2=reading, 3=partOfSpeech, 4=meaning, 5=context
 */
export const VOCAB_TABLE_ROW_REGEX =
  /^\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|$/m;

/**
 * Alternative vocab table regex without escaping pipe inside character class
 */
export const VOCAB_TABLE_ROW_REGEX_ALT =
  /^\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|$/m;

/**
 * Separate reading (kana) and pitch number
 * e.g., ゆうげきしきょうかい⑤ → {reading: "ゆうげきしきょうかい", pitch: "⑤"}
 * Groups: 1=reading (kana only), 2=pitch (number with circle)
 */
export const READING_WITH_PITCH_REGEX = /^(.+?)([①-⑩]+)$/;

/**
 * Match verb forms: 原形：XXX / ます形：XXX / た形：XXX
 * Supports both / and 。 as separators
 * Groups: 1=dictionary form, 2=masu form, 3=ta form
 */
export const VERB_FORMS_REGEX =
  /原形[：:]\s*([^。/／\s]+)\s*(?:[。/／]\s*ます形[：:]\s*([^。/／\s]+)\s*)?(?:[。/／]\s*た形[：:]\s*([^。/／\s]+)\s*)?/;

/**
 * Alternative verb format: 原形：揃う / ます形：揃います / た形：揃った
 * Using full-width or half-width slashes
 */
export const VERB_FORMS_ALT_REGEX =
  /(?:动词|他动词|自動詞)[（\(][^））]+[））][\s\S]*?原形[：:]\s*([^\s/＜＜]+)/;

/**
 * Match verb identification in part of speech field
 * Matches: 動詞, 动词（五段）, 他动词（五段）, 自動詞, etc.
 */
export const IS_VERB_REGEX =
  /^(动詞|動詞|动词[（\(][^））]+[））]|他动词|自動詞|他動詞)/;

/**
 * Detect no vocabulary message: *（本句为无实义的语气词或沉默表达，无具体词汇需要解析。）*
 */
export const NO_VOCAB_MESSAGE_REGEX = /^\*\([^)]*无.*词[^\)]*\)\*$/;

// ============================================================================
// SECTION 3: Grammar section parsing
// ============================================================================

/**
 * Match grammar section header: **第二部分 — 语法要点拆解** (with optional bold markers)
 */
export const GRAMMAR_SECTION_REGEX = /^\*{0,2}第二部分[^\*]*\**[^\n]*\n/m;

/**
 * Match grammar point name (asterisk format)
 * Groups: 1=grammar point name
 */
export const GRAMMAR_NAME_REGEX =
  /^\*\s*\*\*语法点名称\*\*[：:]\s*(.+)$/m;

/**
 * Alternative grammar name format with different numbering
 */
export const GRAMMAR_NAME_ALT_REGEX =
  /^\d+\.\s*\*\*语法点名称\*\*[：:]\s*(.+)$/m;

/**
 * Match grammar field with bold key (asterisk format) - UPDATED
 * Groups: 1=field name, 2=field value (may include bold markers)
 * Format: *   **形式与构成**：XXX or **形式与构成**：XXX
 */
export const GRAMMAR_FIELD_REGEX =
  /^\s*\*\s*\*\*([^*]+)\*\*[：:]\s*([^\n]+)/m;

/**
 * Match grammar field with numbered format - UPDATED
 */
export const GRAMMAR_FIELD_NUMBERED_REGEX =
  /^\s*\*\*\*([^*]+)\*\*[：:]\s*([^\n]+)/m;

/**
 * Detect common confusion section
 */
export const HAS_COMMON_CONFUSION_REGEX = /\*\*常见混淆点对比\*\*/;

/**
 * Detect speech note section
 */
export const HAS_SPEECH_NOTE_REGEX = /口语缩略|省略|倒装|speechNote/i;

/**
 * Match expression analysis (special format for non-grammar sentences)
 */
export const EXPRESSION_ANALYSIS_REGEX = /^\*\*\*\*\*表达分析\*\*\*\*\*[：:]\s*/;

// ============================================================================
// SECTION 4: Translation section parsing
// ============================================================================

/**
 * Match translation section header: **第三部分 — 整句翻译** (with optional bold markers)
 */
export const TRANSLATION_SECTION_REGEX = /^\*{0,2}第三部分[^\*]*\**[^\n]*\n/m;

/**
 * Match numbered translation item: 1. **直译**：...
 * Groups: 1=label (直译, 自然中文翻译, etc.), 2=value
 * UPDATED to handle field names with parentheses and bold markers in values
 */
export const TRANSLATION_ITEM_REGEX = /^\d+\.\s*\*\*([^*（]*[^*）]*[）]*[^*]*?)\*\*[：:]\s*(.+)$/m;

/**
 * Alternative simple translation format: 直译：...
 * Groups: 1=label, 2=value
 */
export const TRANSLATION_SIMPLE_REGEX = /^([^*\n]+?)[：:]\s*(.+)$/m;

/**
 * Translation field names
 */
export const TRANSLATION_FIELD_NAMES = {
  LITERAL: '直译',
  NATURAL: '自然中文翻译',
  ORIGINAL: '原文',
  KANA: '整句假名读音',
} as const;

// ============================================================================
// SECTION 5: Utility patterns
// ============================================================================

/**
 * Clean up whitespace and line breaks
 */
export const CLEAN_WHITESPACE_REGEX = /\s+/g;

/**
 * Match full-width and half-width colons
 */
export const COLON_REGEX = /[：:]/g;

/**
 * Match full-width and half-width slashes
 */
export const SLASH_REGEX = /[／/]/g;

/**
 * Match section dividers: ---
 */
export const SECTION_DIVIDER_REGEX = /^---$/m;

/**
 * Match any section header with asterisks
 */
export const SECTION_HEADER_REGEX = /^\*\*[^\*]+\*\*/m;

// ============================================================================
// SECTION 6: Sentence block splitting
// ============================================================================

/**
 * Split markdown into sentence blocks based on "### 句 N" headers
 */
export function splitIntoSentenceBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split('\n');
  let currentBlock: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const match = line.match(SENTENCE_HEADER_REGEX);
    if (match) {
      // Save previous block if exists
      if (inBlock && currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
      }
      // Start new block
      currentBlock = [line];
      inBlock = true;
    } else if (inBlock) {
      currentBlock.push(line);
    }
  }

  // Don't forget the last block
  if (inBlock && currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  return blocks;
}

/**
 * Extract section content between two markers
 */
export function extractSection(
  content: string,
  startMarker: RegExp,
  endMarker?: RegExp
): string | null {
  const startIndex = content.search(startMarker);
  if (startIndex === -1) return null;

  let endIndex = content.length;
  if (endMarker) {
    const endMatch = content.substring(startIndex).search(endMarker);
    if (endMatch !== -1) {
      endIndex = startIndex + endMatch;
    }
  }

  return content.substring(startIndex, endIndex).trim();
}
