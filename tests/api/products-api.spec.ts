/**
 * FakeStore Products API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 3) Get All Products            8) Get All Product Categories
 * 4) Get Product by ID           9) Get Products by Category
 * 5) Get Products with Limit    10) Product CRUD - Create
 * 6) Sort Products - Ascending  11) Product CRUD - Update
 * 7) Sort Products - Descending 12) Product CRUD - Delete
 */

import { test, expect } from '@playwright/test';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

type Product = {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
};

test.describe('Products API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
    const LIMIT = Number(process.env.LIMIT ?? 3);
    const CATEGORY = 'electronics';

    // ---------------------------------------------------------
    // GET - All Products
    // ---------------------------------------------------------

    test('GET - All Products @master @sanity @api', async ({ request }) => {

        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);

        expect(response.status(), 'GET all products should return 200').toBe(200);

        const products: Product[] = await response.json();

        expect(Array.isArray(products), 'Response body should be an array').toBeTruthy();
        expect(products.length, 'At least one product should be returned').toBeGreaterThan(0);

        products.forEach((product) => {
            expect(typeof product.id, 'Product id should be a number').toBe('number');
            expect(typeof product.title, `Product ${product.id} title should be a string`).toBe('string');
            expect(product.title.length, `Product ${product.id} title should not be empty`).toBeGreaterThan(0);
            expect(typeof product.price, `Product ${product.id} price should be a number`).toBe('number');
            expect(typeof product.category, `Product ${product.id} category should be a string`).toBe('string');
            expect(typeof product.image, `Product ${product.id} image should be a string`).toBe('string');
        });
    });

    // ---------------------------------------------------------
    // GET - Product by ID
    // ---------------------------------------------------------

    test('GET - Product by ID @master @sanity @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET product by id should return 200').toBe(200);

        const product: Product = await response.json();

        expect(product.id, 'Returned product id should match the requested id').toBe(PRODUCT_ID);
        expect(typeof product.title, 'Product title should be a string').toBe('string');
        expect(product.title.length, 'Product title should not be empty').toBeGreaterThan(0);
        expect(typeof product.price, 'Product price should be a number').toBe('number');
        expect(product.price, 'Product price should be greater than 0').toBeGreaterThan(0);
        expect(typeof product.description, 'Product description should be a string').toBe('string');
        expect(typeof product.category, 'Product category should be a string').toBe('string');
        expect(typeof product.image, 'Product image should be a string').toBe('string');
    });

    // ---------------------------------------------------------
    // GET - Products with Limit
    // ---------------------------------------------------------

    test('GET - Products with Limit @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(LIMIT))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET products with limit should return 200').toBe(200);

        const products: Product[] = await response.json();

        expect(Array.isArray(products), 'Response body should be an array').toBeTruthy();
        expect(products.length, `Exactly ${LIMIT} products should be returned`).toBe(LIMIT);
    });

    // ---------------------------------------------------------
    // GET - Products Sorted Ascending
    // ---------------------------------------------------------

    test('GET - Products Sorted Ascending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCTS_SORTED.replace('{order}', 'asc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET products sorted asc should return 200').toBe(200);

        const products: Product[] = await response.json();
        const productIds = products.map((product) => product.id);
        const expectedIds = [...productIds].sort((a, b) => a - b);

        expect(productIds.length, 'More than one product is needed to verify sorting').toBeGreaterThan(1);
        expect(productIds, 'Product ids should be in ascending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // GET - Products Sorted Descending
    // ---------------------------------------------------------

    test('GET - Products Sorted Descending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCTS_SORTED.replace('{order}', 'desc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET products sorted desc should return 200').toBe(200);

        const products: Product[] = await response.json();
        const productIds = products.map((product) => product.id);
        const expectedIds = [...productIds].sort((a, b) => b - a);

        expect(productIds.length, 'More than one product is needed to verify sorting').toBeGreaterThan(1);
        expect(productIds, 'Product ids should be in descending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // GET - All Product Categories
    // ---------------------------------------------------------

    test('GET - All Product Categories @master @regression @api', async ({ request }) => {

        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);

        expect(response.status(), 'GET all categories should return 200').toBe(200);

        const categories: string[] = await response.json();

        expect(Array.isArray(categories), 'Response body should be an array').toBeTruthy();
        expect(categories.length, 'Category list should not be empty').toBeGreaterThan(0);

        categories.forEach((category) => {
            expect(typeof category, 'Each category should be a string').toBe('string');
        });
    });

    // ---------------------------------------------------------
    // GET - Products by Category
    // ---------------------------------------------------------

    test('GET - Products by Category @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', encodeURIComponent(CATEGORY))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET products by category should return 200').toBe(200);

        const products: Product[] = await response.json();

        expect(Array.isArray(products), 'Response body should be an array').toBeTruthy();
        expect(products.length, `At least one '${CATEGORY}' product should be returned`).toBeGreaterThan(0);

        products.forEach((product) => {
            expect(product.category, `Product ${product.id} should belong to '${CATEGORY}'`).toBe(CATEGORY);
        });
    });

    // ---------------------------------------------------------
    // POST - Create Product
    // ---------------------------------------------------------

    test('POST - Create Product @master @regression @api', async ({ request }) => {

        const productPayload = RandomDataUtil.generateProductPayload();

        const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: productPayload });

        expect(response.status(), 'Create product should return 201').toBe(201);

        const createdProduct = await response.json();

        expect(typeof createdProduct.id, 'Created product id should be a number').toBe('number');
        expect(createdProduct.id, 'Created product id should be greater than 0').toBeGreaterThan(0);
        expect(createdProduct, 'Response should contain the submitted product information').toMatchObject(productPayload);
    });

    // ---------------------------------------------------------
    // PUT - Update Product
    // ---------------------------------------------------------

    test('PUT - Update Product @master @regression @api', async ({ request }) => {

        const updatedProductPayload = RandomDataUtil.generateUpdatedProductPayload();
        const url = `${BASE_URL}${Routes.UPDATE_PRODUCT.replace('{id}', String(PRODUCT_ID))}`;

        const response = await request.put(url, { data: updatedProductPayload });

        expect(response.status(), 'Update product should return 200').toBe(200);

        const updatedProduct = await response.json();

        expect(updatedProduct.id, 'Returned product id should match the requested id').toBe(PRODUCT_ID);
        expect(updatedProduct.title, 'Product title should be updated').toBe(updatedProductPayload.title);
        expect(updatedProduct, 'Response should contain all updated product values').toMatchObject(updatedProductPayload);
    });

    // ---------------------------------------------------------
    // DELETE - Delete Product
    // ---------------------------------------------------------

    test('DELETE - Delete Product @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.DELETE_PRODUCT.replace('{id}', String(PRODUCT_ID))}`;

        const response = await request.delete(url);

        expect(response.status(), 'Delete product should return 200').toBe(200);

        // For an existing product, FakeStore returns the deleted product record
        const deletedProduct: Product = await response.json();

        expect(deletedProduct.id, 'Deleted product id should match the requested id').toBe(PRODUCT_ID);
        expect(typeof deletedProduct.title, 'Deleted product title should be a string').toBe('string');
        expect(typeof deletedProduct.price, 'Deleted product price should be a number').toBe('number');
    });
});
