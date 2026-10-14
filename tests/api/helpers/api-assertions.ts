import { expect, type APIResponse } from '@playwright/test';

export type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function expectJsonArray(response: APIResponse): Promise<ApiRecord[]> {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isRecord)) {
    throw new Error('Expected the API to return a JSON array of objects');
  }

  expect(body.length).toBeGreaterThan(0);
  return body;
}

export function expectString(value: unknown): void {
  expect(typeof value).toBe('string');
  expect(value).not.toBe('');
}

export function expectUrl(value: unknown): void {
  expectString(value);
  if (typeof value === 'string') {
    expect(() => new URL(value)).not.toThrow();
  }
}

export function expectNumber(value: unknown): void {
  expect(typeof value).toBe('number');
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
}

export function expectStringArray(value: unknown): void {
  expect(Array.isArray(value)).toBe(true);
  if (Array.isArray(value)) {
    expect(value.every((item: unknown) => typeof item === 'string')).toBe(true);
  }
}
