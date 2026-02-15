export interface CsvRow {
  gameId: number;
  fname: string;
  scene: string;
  row: number;
  engChrName: string;
  engSearchText: string;
  engHtmlText: string;
  jpnChrName: string;
  jpnSearchText: string;
  jpnHtmlText: string;
  opName?: string;
  pcIconHtml?: string;
  evoIconHtml?: string;
}

export interface ParsedScript {
  gameId: number;
  scene: string;
  row: number;
  characterName: string;
  japaneseText: string;
  englishText: string;
}

export interface CsvParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  scripts: ParsedScript[];
  errors?: string[];
}
