import Papa from 'papaparse';
import { CsvRow, ParsedScript, CsvParseResult } from './types';

export function parseCSV(csvContent: string): CsvParseResult {
  const result: CsvParseResult = {
    success: false,
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    scripts: [],
    errors: [],
  };

  try {
    const parseResult = Papa.parse<CsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      result.errors = parseResult.errors.map((e) => e.message);
      return result;
    }

    const rows = parseResult.data;
    result.totalRows = rows.length;

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.gameId || !row.scene || row.row === undefined || row.row === null) {
          result.errorRows++;
          result.errors?.push(`Row missing required fields: gameId=${row.gameId}, scene=${row.scene}, row=${row.row}`);
          continue;
        }

        if (!row.jpnSearchText || !row.engSearchText) {
          result.errorRows++;
          result.errors?.push(`Row missing text fields: row=${row.row}`);
          continue;
        }

        const parsed: ParsedScript = {
          gameId: parseInt(row.gameId.toString()),
          scene: row.scene,
          row: parseInt(row.row.toString()),
          characterName: row.jpnChrName || 'Unknown',
          japaneseText: row.jpnSearchText,
          englishText: row.engSearchText,
        };

        result.scripts.push(parsed);
        result.validRows++;
      } catch (error) {
        result.errorRows++;
        result.errors?.push(`Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.validRows > 0;
    return result;
  } catch (error) {
    result.errors?.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

export function validateCSVStructure(csvContent: string): { valid: boolean; error?: string } {
  try {
    const parseResult = Papa.parse(csvContent, {
      preview: 1,
      header: true,
    });

    if (!parseResult.meta.fields) {
      return { valid: false, error: 'CSV has no headers' };
    }

    const requiredFields = ['gameId', 'scene', 'row', 'jpnSearchText', 'engSearchText', 'jpnChrName'];
    const missingFields = requiredFields.filter((field) => !parseResult.meta.fields?.includes(field));

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `CSV is missing required fields: ${missingFields.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
