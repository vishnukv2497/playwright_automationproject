import fs from "fs";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export class DataProvider {
  /**
   * Reads a JSON file and returns the parsed data
   * @param filePath - Path to the JSON file
   */
  static readJson(filePath: string) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }

  /**
   * Reads a CSV file and returns one object per row (keys from the header row)
   * @param filePath - Path to the CSV file
   */
  static readCsv(filePath: string) {
    const data = fs.readFileSync(filePath);
    return parse(data, {
      columns: true,
      skip_empty_lines: true,
    });
  }

  /**
   * Reads the first worksheet of an Excel file and returns its rows as arrays (row 0 is the header)
   * @param filePath - Path to the Excel file
   */
  static readExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }
}
