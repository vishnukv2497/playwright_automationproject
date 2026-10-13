/**
 * FakeStore Carts API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 20) Get All Carts             25) Sort Carts (ascending and descending)
 * 21) Get Cart by ID            26) Cart CRUD - Create
 * 22) Get Carts by Date Range   27) Cart CRUD - Update
 * 23) Get User Cart             28) Cart CRUD - Delete
 * 24) Get Carts with Limit
 */

import { test, expect } from '@playwright/test';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

type CartProduct = {
    productId: number;
    quantity: number;
};

type Cart = {
    id: number;
    userId: number;
    date: string;
    products: CartProduct[];
};

test.describe('Carts API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const CART_ID = Number(process.env.CART_ID ?? 1);
    const USER_ID = Number(process.env.USER_ID ?? 1);
    const LIMIT = Number(process.env.LIMIT ?? 3);
    const START_DATE = process.env.START_DATE || '2019-12-10';
    const END_DATE = process.env.END_DATE || '2020-10-10';

    // ---------------------------------------------------------
    // GET - All Carts
    // ---------------------------------------------------------

    test('GET - All Carts @master @sanity @api', async ({ request }) => {

        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);

        expect(response.status(), 'GET all carts should return 200').toBe(200);

        const carts: Cart[] = await response.json();

        expect(Array.isArray(carts), 'Response body should be an array').toBeTruthy();
        expect(carts.length, 'At least one cart should be returned').toBeGreaterThan(0);

        carts.forEach((cart) => {
            expect(typeof cart.id, 'Cart id should be a number').toBe('number');
            expect(typeof cart.userId, `Cart ${cart.id} userId should be a number`).toBe('number');
            expect(Array.isArray(cart.products), `Cart ${cart.id} products should be an array`).toBeTruthy();
        });
    });

    // ---------------------------------------------------------
    // GET - Cart by ID
    // ---------------------------------------------------------

    test('GET - Cart by ID @master @sanity @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET cart by id should return 200').toBe(200);

        const cart: Cart = await response.json();

        expect(cart.id, 'Returned cart id should match the requested id').toBe(CART_ID);
        expect(typeof cart.userId, 'Cart userId should be a number').toBe('number');
        expect(Array.isArray(cart.products), 'Cart products should be an array').toBeTruthy();
    });

    // ---------------------------------------------------------
    // GET - Carts by Date Range
    // ---------------------------------------------------------

    test('GET - Carts by Date Range @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startDate}', START_DATE)
            .replace('{endDate}', END_DATE)}`;
        const response = await request.get(url);

        expect(response.status(), 'GET carts by date range should return 200').toBe(200);

        const carts: Cart[] = await response.json();

        expect(Array.isArray(carts), 'Response body should be an array').toBeTruthy();
        expect(carts.length, `At least one cart should exist between ${START_DATE} and ${END_DATE}`).toBeGreaterThan(0);

        // Cart dates are returned as ISO timestamps, e.g. "2020-03-02T00:00:00.000Z"
        const startTime = new Date(START_DATE).getTime();
        const endTime = new Date(END_DATE).getTime();

        carts.forEach((cart) => {
            const cartTime = new Date(cart.date).getTime();

            expect(cartTime, `Cart ${cart.id} date ${cart.date} should not be before ${START_DATE}`).toBeGreaterThanOrEqual(startTime);
            expect(cartTime, `Cart ${cart.id} date ${cart.date} should not be after ${END_DATE}`).toBeLessThanOrEqual(endTime);
        });
    });

    // ---------------------------------------------------------
    // GET - User Cart
    // ---------------------------------------------------------

    test('GET - User Cart @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USER_CART.replace('{userId}', String(USER_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET user cart should return 200').toBe(200);

        const carts: Cart[] = await response.json();

        expect(Array.isArray(carts), 'Response body should be an array').toBeTruthy();
        expect(carts.length, `User ${USER_ID} should have at least one cart`).toBeGreaterThan(0);

        carts.forEach((cart) => {
            expect(cart.userId, `Cart ${cart.id} should belong to user ${USER_ID}`).toBe(USER_ID);
        });
    });

    // ---------------------------------------------------------
    // GET - Carts with Limit
    // ---------------------------------------------------------

    test('GET - Carts with Limit @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(LIMIT))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET carts with limit should return 200').toBe(200);

        const carts: Cart[] = await response.json();

        expect(Array.isArray(carts), 'Response body should be an array').toBeTruthy();
        expect(carts.length, `Exactly ${LIMIT} carts should be returned`).toBe(LIMIT);
    });

    // ---------------------------------------------------------
    // GET - Carts Sorted Ascending
    // ---------------------------------------------------------

    test('GET - Carts Sorted Ascending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CARTS_SORTED.replace('{order}', 'asc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET carts sorted asc should return 200').toBe(200);

        const carts: Cart[] = await response.json();
        const cartIds = carts.map((cart) => cart.id);
        const expectedIds = [...cartIds].sort((a, b) => a - b);

        expect(cartIds.length, 'More than one cart is needed to verify sorting').toBeGreaterThan(1);
        expect(cartIds, 'Cart ids should be in ascending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // GET - Carts Sorted Descending
    // ---------------------------------------------------------

    test('GET - Carts Sorted Descending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_CARTS_SORTED.replace('{order}', 'desc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET carts sorted desc should return 200').toBe(200);

        const carts: Cart[] = await response.json();
        const cartIds = carts.map((cart) => cart.id);
        const expectedIds = [...cartIds].sort((a, b) => b - a);

        expect(cartIds.length, 'More than one cart is needed to verify sorting').toBeGreaterThan(1);
        expect(cartIds, 'Cart ids should be in descending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // POST - Create Cart
    // ---------------------------------------------------------

    test('POST - Create Cart @master @regression @api', async ({ request }) => {

        const cartPayload = RandomDataUtil.generateCartPayload(USER_ID);

        const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: cartPayload });

        expect(response.status(), 'Create cart should return 201').toBe(201);

        const createdCart: Cart = await response.json();

        expect(typeof createdCart.id, 'Created cart id should be a number').toBe('number');
        expect(createdCart.id, 'Created cart id should be greater than 0').toBeGreaterThan(0);
        expect(createdCart.userId, 'Created cart should belong to the submitted user').toBe(USER_ID);
        expect(createdCart.products, 'Created cart should contain the submitted products').toEqual(cartPayload.products);
    });

    // ---------------------------------------------------------
    // PUT - Update Cart
    // ---------------------------------------------------------

    test('PUT - Update Cart @master @regression @api', async ({ request }) => {

        const cartUrl = `${BASE_URL}${Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID))}`;

        // Read the existing cart so the update changes a known product quantity
        const existingCartResponse = await request.get(cartUrl);
        expect(existingCartResponse.status(), 'GET existing cart should return 200').toBe(200);

        const existingCart: Cart = await existingCartResponse.json();
        const existingProduct = existingCart.products[0];
        const newQuantity = existingProduct.quantity + 1;

        const updatedCartPayload = {
            ...RandomDataUtil.generateUpdatedCartPayload(existingCart.userId),
            products: [{ productId: existingProduct.productId, quantity: newQuantity }],
        };

        const response = await request.put(
            `${BASE_URL}${Routes.UPDATE_CART.replace('{id}', String(CART_ID))}`,
            { data: updatedCartPayload },
        );

        expect(response.status(), 'Update cart should return 200').toBe(200);

        const updatedCart: Cart = await response.json();

        expect(updatedCart.id, 'Returned cart id should match the requested id').toBe(CART_ID);
        expect(updatedCart.userId, 'Cart userId should be unchanged').toBe(existingCart.userId);
        expect(updatedCart.products[0].productId, 'Updated product should be the same product').toBe(existingProduct.productId);
        expect(updatedCart.products[0].quantity, 'Product quantity should be updated').toBe(newQuantity);
        expect(updatedCart.products[0].quantity, 'Product quantity should differ from the original').not.toBe(existingProduct.quantity);
    });

    // ---------------------------------------------------------
    // DELETE - Delete Cart
    // ---------------------------------------------------------

    test('DELETE - Delete Cart @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.DELETE_CART.replace('{id}', String(CART_ID))}`;

        const response = await request.delete(url);

        expect(response.status(), 'Delete cart should return 200').toBe(200);

        // For an existing cart, FakeStore returns the deleted cart record
        const deletedCart: Cart = await response.json();

        expect(deletedCart.id, 'Deleted cart id should match the requested id').toBe(CART_ID);
        expect(typeof deletedCart.userId, 'Deleted cart userId should be a number').toBe('number');
        expect(Array.isArray(deletedCart.products), 'Deleted cart products should be an array').toBeTruthy();
    });
});
