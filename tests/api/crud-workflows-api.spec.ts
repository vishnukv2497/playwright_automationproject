/**
 * FakeStore End-to-End CRUD Workflow API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 32) Product CRUD Workflow (create -> update -> delete)
 * 33) User CRUD Workflow    (create -> update -> delete)
 * 34) Cart CRUD Workflow    (create -> update -> delete)
 *
 * Each workflow chains the id returned by the create call into the update and delete calls.
 * Note: FakeStore does not persist writes, so the generated id is never actually stored.
 * Update returns the submitted values, and delete returns 200 with an empty / null body.
 */

import { test, expect } from '@playwright/test';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

test.describe.serial('CRUD Workflow API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const USER_ID = Number(process.env.USER_ID ?? 1);

    // ---------------------------------------------------------
    // E2E - Product CRUD Workflow
    // ---------------------------------------------------------

    test('E2E - Product CRUD Workflow @master @regression @api @e2e', async ({ request }) => {

        let productId = 0;

        await test.step('1) Create a product', async () => {
            const productPayload = RandomDataUtil.generateProductPayload();

            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: productPayload });

            expect(createResponse.status(), 'Create product should return 201').toBe(201);

            const createdProduct = await createResponse.json();

            expect(typeof createdProduct.id, 'Created product id should be a number').toBe('number');
            expect(createdProduct, 'Response should contain the submitted product information').toMatchObject(productPayload);

            productId = createdProduct.id;
        });

        await test.step('2) Update the created product', async () => {
            const updatedProductPayload = RandomDataUtil.generateUpdatedProductPayload();
            const url = `${BASE_URL}${Routes.UPDATE_PRODUCT.replace('{id}', String(productId))}`;

            const updateResponse = await request.put(url, { data: updatedProductPayload });

            expect(updateResponse.status(), 'Update product should return 200').toBe(200);

            const updatedProduct = await updateResponse.json();

            expect(updatedProduct.id, 'Updated product id should match the created product id').toBe(productId);
            expect(updatedProduct.title, 'Product title should be updated').toBe(updatedProductPayload.title);
            expect(updatedProduct, 'Response should contain all updated product values').toMatchObject(updatedProductPayload);
        });

        await test.step('3) Delete the created product', async () => {
            const url = `${BASE_URL}${Routes.DELETE_PRODUCT.replace('{id}', String(productId))}`;

            const deleteResponse = await request.delete(url);

            expect(deleteResponse.status(), `Delete product ${productId} should return 200`).toBe(200);
        });
    });

    // ---------------------------------------------------------
    // E2E - User CRUD Workflow
    // ---------------------------------------------------------

    test('E2E - User CRUD Workflow @master @regression @api @e2e', async ({ request }) => {

        let userId = 0;

        await test.step('1) Create a user', async () => {
            const userPayload = RandomDataUtil.generateUserPayload();

            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: userPayload });

            expect(createResponse.status(), 'Create user should return 201').toBe(201);

            // FakeStore's create-user contract returns only the generated id, e.g. { "id": 11 }
            const createdUser = await createResponse.json();

            expect(typeof createdUser.id, 'Created user id should be a number').toBe('number');
            expect(createdUser.id, 'Created user id should be greater than 0').toBeGreaterThan(0);

            userId = createdUser.id;
        });

        await test.step('2) Update the created user', async () => {
            const updatedUserPayload = RandomDataUtil.generateUserUpdatePayload();
            const url = `${BASE_URL}${Routes.UPDATE_USER.replace('{id}', String(userId))}`;

            const updateResponse = await request.put(url, { data: updatedUserPayload });

            expect(updateResponse.status(), 'Update user should return 200').toBe(200);

            // FakeStore echoes the submitted user fields (the response does not include the id)
            const updatedUser = await updateResponse.json();

            expect(updatedUser.username, 'Username should be updated').toBe(updatedUserPayload.username);
            expect(updatedUser.email, 'Email should be updated').toBe(updatedUserPayload.email);
            expect(updatedUser, 'Response should contain all updated user values').toMatchObject(updatedUserPayload);
        });

        await test.step('3) Delete the created user', async () => {
            const url = `${BASE_URL}${Routes.DELETE_USER.replace('{id}', String(userId))}`;

            const deleteResponse = await request.delete(url);

            expect(deleteResponse.status(), `Delete user ${userId} should return 200`).toBe(200);
        });
    });

    // ---------------------------------------------------------
    // E2E - Cart CRUD Workflow
    // ---------------------------------------------------------

    test('E2E - Cart CRUD Workflow @master @regression @api @e2e', async ({ request }) => {

        let cartId = 0;
        let createdProduct = { productId: 0, quantity: 0 };

        await test.step('1) Create a cart', async () => {
            const cartPayload = RandomDataUtil.generateCartPayload(USER_ID);

            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: cartPayload });

            expect(createResponse.status(), 'Create cart should return 201').toBe(201);

            const createdCart = await createResponse.json();

            expect(typeof createdCart.id, 'Created cart id should be a number').toBe('number');
            expect(createdCart.userId, 'Created cart should belong to the submitted user').toBe(USER_ID);
            expect(createdCart.products, 'Created cart should contain the submitted products').toEqual(cartPayload.products);

            cartId = createdCart.id;
            createdProduct = createdCart.products[0];
        });

        await test.step('2) Update the product quantity in the created cart', async () => {
            const newQuantity = createdProduct.quantity + 1;

            const updatedCartPayload = {
                ...RandomDataUtil.generateUpdatedCartPayload(USER_ID),
                products: [{ productId: createdProduct.productId, quantity: newQuantity }],
            };
            const url = `${BASE_URL}${Routes.UPDATE_CART.replace('{id}', String(cartId))}`;

            const updateResponse = await request.put(url, { data: updatedCartPayload });

            expect(updateResponse.status(), 'Update cart should return 200').toBe(200);

            const updatedCart = await updateResponse.json();

            expect(updatedCart.id, 'Updated cart id should match the created cart id').toBe(cartId);
            expect(updatedCart.products[0].productId, 'Updated product should be the same product').toBe(createdProduct.productId);
            expect(updatedCart.products[0].quantity, 'Product quantity should be updated').toBe(newQuantity);
        });

        await test.step('3) Delete the created cart', async () => {
            const url = `${BASE_URL}${Routes.DELETE_CART.replace('{id}', String(cartId))}`;

            const deleteResponse = await request.delete(url);

            expect(deleteResponse.status(), `Delete cart ${cartId} should return 200`).toBe(200);
        });
    });
});
