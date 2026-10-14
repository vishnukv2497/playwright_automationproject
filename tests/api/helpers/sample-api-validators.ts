import { expect } from '@playwright/test';
import {
  expectNumber,
  expectString,
  expectStringArray,
  expectUrl,
  type ApiRecord,
} from './api-assertions';

export function validateUsers(users: ApiRecord[]): void {
  for (const user of users) {
    expectNumber(user.id);
    expectString(user.name);
    expectString(user.username);
    expectString(user.email);
    expectString(user.company);
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expectUrl(user.photo);
  }
}

export function validateCompanies(companies: ApiRecord[]): void {
  for (const company of companies) {
    expectNumber(company.id);
    expectString(company.name);
    expectString(company.industry);
    expectString(company.country);
    expectNumber(company.employeeCount);
    expectNumber(company.marketCap);
    expectString(company.domain);
  }
}

export function validateTodos(todos: ApiRecord[]): void {
  for (const todo of todos) {
    expectNumber(todo.id);
    expectNumber(todo.userId);
    expectString(todo.title);
    expect(typeof todo.completed).toBe('boolean');
  }
}

export function validatePosts(posts: ApiRecord[]): void {
  for (const post of posts) {
    expectNumber(post.id);
    expectNumber(post.userId);
    expectString(post.title);
    expectString(post.body);
    expectUrl(post.link);
    expectNumber(post.comment_count);
  }
}

export function validateContinents(continents: ApiRecord[]): void {
  for (const continent of continents) {
    expectString(continent.code);
    expectString(continent.name);
    expectNumber(continent.areaSqKm);
    expectNumber(continent.population);
    expectNumber(continent.countries);
    expectStringArray(continent.lines);
    expectStringArray(continent.oceans);
    expectStringArray(continent.developedCountries);
  }
}
