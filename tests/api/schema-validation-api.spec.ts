/**
 * FakeStore JSON Schema Validation API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 29) Product Response Schema
 * 30) User Response Schema
 * 31) Cart Response Schema
 *
 * Schemas live in api/schemas/ and are validated with AJV (draft-07).
 */

import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import { DataProvider } from '../../utils/DataReader';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Schema Validation API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
    const USER_ID = Number(process.env.USER_ID ?? 1);
    const CART_ID = Number(process.env.CART_ID ?? 1);

    const ajv = new Ajv({ allErrors: true });

    // ---------------------------------------------------------
    // GET - Product Response Schema
    // ---------------------------------------------------------

    test('GET - Product Response Schema @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET product by id should return 200').toBe(200);

        const responseBody = await response.json();

        const schema = DataProvider.readJson('./api/schemas/product_api_schema.json');
        const validate = ajv.compile(schema);
        const isValid = validate(responseBody);

        if (!isValid) {
            console.log('Product schema validation errors:', validate.errors);
        }

        expect(isValid, `Product response should match the schema: ${ajv.errorsText(validate.errors)}`).toBeTruthy();
    });

    // ---------------------------------------------------------
    // GET - User Response Schema
    // ---------------------------------------------------------

    test('GET - User Response Schema @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET user by id should return 200').toBe(200);

        const responseBody = await response.json();

        const schema = DataProvider.readJson('./api/schemas/user_api_schema.json');
        const validate = ajv.compile(schema);
        const isValid = validate(responseBody);

        if (!isValid) {
            console.log('User schema validation errors:', validate.errors);
        }

        expect(isValid, `User response should match the schema: ${ajv.errorsText(validate.errors)}`).toBeTruthy();
    });

    // ---------------------------------------------------------
    // GET - Cart Response Schema
    // ---------------------------------------------------------

    test('GET - Cart Response Schema @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET cart by id should return 200').toBe(200);

        const responseBody = await response.json();

        const schema = DataProvider.readJson('./api/schemas/cart_api_schema.json');
        const validate = ajv.compile(schema);
        const isValid = validate(responseBody);

        if (!isValid) {
            console.log('Cart schema validation errors:', validate.errors);
        }

        expect(isValid, `Cart response should match the schema: ${ajv.errorsText(validate.errors)}`).toBeTruthy();
    });
});
