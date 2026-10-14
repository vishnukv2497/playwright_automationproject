/**
 * FakeStore Auth API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 1) Successful Login
 * 2) Invalid Login
 */

import { test, expect } from '@playwright/test';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Auth API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const API_USERNAME = process.env.API_USERNAME ?? '';
    const API_PASSWORD = process.env.API_PASSWORD ?? '';

    // ---------------------------------------------------------
    // POST - Successful Login
    // ---------------------------------------------------------

    test('POST - Successful Login @master @sanity @api', async ({ request }) => {

        expect(API_USERNAME, 'API_USERNAME must be set in .env').not.toBe('');
        expect(API_PASSWORD, 'API_PASSWORD must be set in .env').not.toBe('');

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: { username: API_USERNAME, password: API_PASSWORD },
        });

        expect(response.status(), 'Login with valid credentials should return 201').toBe(201);

        const responseBody = await response.json();

        expect(responseBody, 'Login response should contain a token').toHaveProperty('token');
        expect(typeof responseBody.token, 'Token should be a string').toBe('string');
        expect(responseBody.token.length, 'Token should not be empty').toBeGreaterThan(0);
    });

    // ---------------------------------------------------------
    // POST - Invalid Login
    // ---------------------------------------------------------

    test('POST - Invalid Login @master @regression @api', async ({ request }) => {

        const invalidLoginPayload = RandomDataUtil.generateInvalidLoginPayload();

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: invalidLoginPayload,
        });

        expect(response.status(), 'Login with invalid credentials should return 401').toBe(401);

        // FakeStore returns the error as plain text (Content-Type: text/html), not JSON
        const responseText = await response.text();

        expect(responseText, 'Invalid login should return the authentication error message')
            .toBe('username or password is incorrect');
    });
});
