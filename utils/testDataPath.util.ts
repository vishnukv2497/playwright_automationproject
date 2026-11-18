import path from 'path';

/**
 * Resolves a file under /testdata/files by name, so specs and Page Objects
 * never hardcode absolute or relative paths to upload fixtures (SIF, CSV, PDF, ...).
 */
export function testDataFilePath(fileName: string): string {
  return path.resolve(__dirname, '..', 'testdata', 'files', fileName);
}
