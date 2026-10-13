/**
 * FakeStore Users API tests
 *
 * Scenarios covered (prompts/fakestore_api_test_prompts.md):
 * 13) Get All Users          17) User CRUD - Create
 * 14) Get User by ID         18) User CRUD - Update
 * 15) Get Users with Limit   19) User CRUD - Delete
 * 16) Sort Users (ascending and descending)
 */

import { test, expect } from '@playwright/test';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Routes } from '../../api/endpoints/routes';
import dotenv from 'dotenv';

dotenv.config();

type User = {
    id: number;
    email: string;
    username: string;
};

test.describe('Users API Tests', () => {

    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || 'https://fakestoreapi.com';
    const USER_ID = Number(process.env.USER_ID ?? 1);
    const LIMIT = Number(process.env.LIMIT ?? 3);

    // ---------------------------------------------------------
    // GET - All Users
    // ---------------------------------------------------------

    test('GET - All Users @master @sanity @api', async ({ request }) => {

        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);

        expect(response.status(), 'GET all users should return 200').toBe(200);

        const users: User[] = await response.json();

        expect(Array.isArray(users), 'Response body should be an array').toBeTruthy();
        expect(users.length, 'At least one user should be returned').toBeGreaterThan(0);

        users.forEach((user) => {
            expect(typeof user.id, 'User id should be a number').toBe('number');
            expect(typeof user.email, `User ${user.id} email should be a string`).toBe('string');
            expect(typeof user.username, `User ${user.id} username should be a string`).toBe('string');
        });
    });

    // ---------------------------------------------------------
    // GET - User by ID
    // ---------------------------------------------------------

    test('GET - User by ID @master @sanity @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET user by id should return 200').toBe(200);

        const user: User = await response.json();

        expect(user.id, 'Returned user id should match the requested id').toBe(USER_ID);
        expect(typeof user.email, 'User email should be a string').toBe('string');
        expect(typeof user.username, 'User username should be a string').toBe('string');
    });

    // ---------------------------------------------------------
    // GET - Users with Limit
    // ---------------------------------------------------------

    test('GET - Users with Limit @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(LIMIT))}`;
        const response = await request.get(url);

        expect(response.status(), 'GET users with limit should return 200').toBe(200);

        const users: User[] = await response.json();

        expect(Array.isArray(users), 'Response body should be an array').toBeTruthy();
        expect(users.length, `Exactly ${LIMIT} users should be returned`).toBe(LIMIT);
    });

    // ---------------------------------------------------------
    // GET - Users Sorted Ascending
    // ---------------------------------------------------------

    test('GET - Users Sorted Ascending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USERS_SORTED.replace('{order}', 'asc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET users sorted asc should return 200').toBe(200);

        const users: User[] = await response.json();
        const userIds = users.map((user) => user.id);
        const expectedIds = [...userIds].sort((a, b) => a - b);

        expect(userIds.length, 'More than one user is needed to verify sorting').toBeGreaterThan(1);
        expect(userIds, 'User ids should be in ascending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // GET - Users Sorted Descending
    // ---------------------------------------------------------

    test('GET - Users Sorted Descending @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.GET_USERS_SORTED.replace('{order}', 'desc')}`;
        const response = await request.get(url);

        expect(response.status(), 'GET users sorted desc should return 200').toBe(200);

        const users: User[] = await response.json();
        const userIds = users.map((user) => user.id);
        const expectedIds = [...userIds].sort((a, b) => b - a);

        expect(userIds.length, 'More than one user is needed to verify sorting').toBeGreaterThan(1);
        expect(userIds, 'User ids should be in descending order').toEqual(expectedIds);
    });

    // ---------------------------------------------------------
    // POST - Create User
    // ---------------------------------------------------------

    test('POST - Create User @master @regression @api', async ({ request }) => {

        const userPayload = RandomDataUtil.generateUserPayload();

        const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: userPayload });

        expect(response.status(), 'Create user should return 201').toBe(201);

        // FakeStore's create-user contract returns only the generated id, e.g. { "id": 11 }
        const createdUser = await response.json();

        expect(createdUser, 'Response should contain the generated user id').toHaveProperty('id');
        expect(typeof createdUser.id, 'Created user id should be a number').toBe('number');
        expect(createdUser.id, 'Created user id should be greater than 0').toBeGreaterThan(0);
    });

    // ---------------------------------------------------------
    // PUT - Update User
    // ---------------------------------------------------------

    test('PUT - Update User @master @regression @api', async ({ request }) => {

        const updatedUserPayload = RandomDataUtil.generateUserUpdatePayload();
        const url = `${BASE_URL}${Routes.UPDATE_USER.replace('{id}', String(USER_ID))}`;

        const response = await request.put(url, { data: updatedUserPayload });

        expect(response.status(), 'Update user should return 200').toBe(200);

        // FakeStore echoes the submitted user fields (the response does not include the id)
        const updatedUser = await response.json();

        expect(updatedUser.username, 'Username should be updated').toBe(updatedUserPayload.username);
        expect(updatedUser.email, 'Email should be updated').toBe(updatedUserPayload.email);
        expect(updatedUser.name, 'Name should be updated').toEqual(updatedUserPayload.name);
        expect(updatedUser, 'Response should contain all updated user values').toMatchObject(updatedUserPayload);
    });

    // ---------------------------------------------------------
    // DELETE - Delete User
    // ---------------------------------------------------------

    test('DELETE - Delete User @master @regression @api', async ({ request }) => {

        const url = `${BASE_URL}${Routes.DELETE_USER.replace('{id}', String(USER_ID))}`;

        const response = await request.delete(url);

        expect(response.status(), 'Delete user should return 200').toBe(200);

        // For an existing user, FakeStore returns the deleted user record
        const deletedUser: User = await response.json();

        expect(deletedUser.id, 'Deleted user id should match the requested id').toBe(USER_ID);
        expect(typeof deletedUser.username, 'Deleted user username should be a string').toBe('string');
        expect(typeof deletedUser.email, 'Deleted user email should be a string').toBe('string');
    });
});
