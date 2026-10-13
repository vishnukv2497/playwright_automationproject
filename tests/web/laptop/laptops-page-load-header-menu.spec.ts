/**
 * Laptops & Notebooks category page: page load, header utilities, logo/search/cart, top menu + breadcrumb.
 * Source: laptops-notebooks-manual-test-cases.md (TC-LN-001 .. TC-LN-026)
 */

import { test, expect } from '../../../fixtures/pageFixtures';

test.describe('Laptops & Notebooks - 4.1 Page load and layout', () => {
    test('TC-LN-001 Page loads via direct URL @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto('18');
        await expect(page).toHaveURL(/route=product\/category&path=18/);
        await expect(page).toHaveTitle('Laptops & Notebooks');
        await expect(page.locator('#content').getByRole('heading', { name: 'Laptops & Notebooks', level: 2, exact: true })).toBeVisible();
        await expect(laptopsPage.productThumbs.first()).toBeVisible();
    });

    test('TC-LN-002 Page loads via top menu @master @regression @web', async ({ page, homePage, laptopsPage }) => {
        await expect(page).toHaveTitle('Your Store'); // homePage fixture opens Home
        await laptopsPage.hoverLaptopsMenu();
        await laptopsPage.laptopsDropdownItem('Show AllLaptops & Notebooks').click();
        await expect(page).toHaveURL(/route=product\/category&path=18/);
        await expect(page.locator('#content').getByRole('heading', { name: 'Laptops & Notebooks', level: 2, exact: true })).toBeVisible();
    });

    test('TC-LN-003 Category heading and description @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.headingCategory).toHaveText('Laptops & Notebooks');
        await expect(laptopsPage.txtDescription).toBeVisible();
        const img = laptopsPage.page.locator('#content img.img-thumbnail').first();
        await expect(img).toBeVisible();
        await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    });

    test('TC-LN-004 Overall layout @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await expect(page.locator('header')).toBeVisible();
        await expect(laptopsPage.topMenu).toBeVisible();
        await expect(laptopsPage.breadcrumb).toBeVisible();
        await expect(laptopsPage.leftPanel.first()).toBeVisible();
        await expect(page.locator('#content')).toBeVisible();
        await expect(page.locator('footer')).toBeVisible();
        const images = page.locator('#content .product-thumb img');
        const count = await images.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            await img.scrollIntoViewIfNeeded();
            await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
        }
        const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(noOverflow, 'No horizontal scroll').toBe(true);
    });

    test('TC-LN-005 Invalid category path @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto('99999');
        await expect(laptopsPage.page.locator('#content')).toContainText('Category not found!');
        await expect(laptopsPage.productThumbs).toHaveCount(0);
    });

    test('TC-LN-006 Non-numeric category path @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto('abc');
        await expect(page.locator('#content')).toContainText('Category not found!');
        await expect(page.locator('body')).not.toContainText(/SQL|syntax|Fatal error|Warning:|Notice:/i);
    });
});

test.describe('Laptops & Notebooks - 4.2 Header utilities', () => {
    test('TC-LN-007 Currency dropdown options @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.openCurrencyMenu();
        await expect(laptopsPage.page.locator('#form-currency .dropdown-menu button')).toHaveText(['€Euro', '£Pound Sterling', '$US Dollar']);
    });

    test('TC-LN-008 Change currency updates prices @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.selectCurrency('EUR');
        await expect(page).toHaveURL(/route=product\/category&path=18/);
        await expect(page.locator('#form-currency strong')).toHaveText('€');
        await expect(laptopsPage.productThumbs.first().locator('.price')).toContainText('€');
        await expect(laptopsPage.productThumbs.first().locator('.price')).not.toContainText('$');
        await expect(laptopsPage.productThumbs.first().locator('.price-tax')).toContainText('€');
        await expect(laptopsPage.btnCart).toContainText('€');
        await expect(laptopsPage.btnCart).not.toContainText('$');
    });

    test('TC-LN-009 Currency persists across pages @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.selectCurrency('EUR');
        await expect(page.locator('#form-currency strong')).toHaveText('€');
        await laptopsPage.goto('20');
        await expect(page.locator('#form-currency strong')).toHaveText('€');
        await laptopsPage.goto('18');
        await expect(page.locator('#form-currency strong')).toHaveText('€');
        await expect(laptopsPage.productThumbs.first().locator('.price')).toContainText('€');
    });

    test('TC-LN-010 Phone number display @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        const phone = page.locator('#top-links');
        await expect(phone).toContainText('123456789');
        await expect(phone.locator('i.fa-phone')).toBeVisible();
    });

    test('TC-LN-011 My Account dropdown (guest) @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.openMyAccountMenu();
        const items = page.locator('#top-links .dropdown-menu a');
        await expect(items).toHaveText(['Register', 'Login']);
        await expect(items.first()).toBeVisible();
    });

    test('TC-LN-012 Wish List link (guest) @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.clickWishListLink();
        await expect(page).toHaveURL(/route=account\/login/);
        await expect(page.locator('#content').getByRole('heading', { name: 'Returning Customer' })).toBeVisible();
    });

    test('TC-LN-013 Shopping Cart link - empty @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.clickShoppingCartLink();
        await expect(page).toHaveURL(/route=checkout\/cart/);
        await expect(page.locator('#content')).toContainText('Your shopping cart is empty!');
    });

    test('TC-LN-014 Checkout link - empty @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.clickCheckoutLink();
        // Live behaviour: OpenCart redirects an empty-cart checkout to the cart page
        await expect(page).toHaveURL(/route=checkout\/cart/);
        await expect(page.locator('#content')).toContainText('Your shopping cart is empty!');
        await expect(page.locator('#content')).not.toContainText('Billing Details');
    });
});

test.describe('Laptops & Notebooks - 4.3 Logo, Search and Cart button', () => {
    test('TC-LN-015 Logo navigates to Home @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.clickLogo();
        await expect(page).toHaveURL(/route=common\/home|demo\/(index\.php)?$/);
        await expect(page).toHaveTitle('Your Store');
        await expect(page.locator('#slideshow0, .swiper-viewport').first()).toBeVisible();
    });

    test('TC-LN-016 Search valid product @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.search('MacBook');
        await expect(page).toHaveURL(/route=product\/search&search=MacBook/);
        await expect(laptopsPage.productNames).toContainText(['MacBook', 'MacBook Air', 'MacBook Pro']);
    });

    test('TC-LN-017 Search using Enter key @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.searchByEnter('HP');
        await expect(page).toHaveURL(/route=product\/search&search=HP/);
        await expect(laptopsPage.productNames.first()).toBeVisible();
        const names = await laptopsPage.getProductNames();
        expect(names.length).toBeGreaterThan(0);
        expect(names.some(n => n.includes('HP'))).toBe(true);
    });

    test('TC-LN-018 Search non-existing product @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.search('xyz123');
        await expect(laptopsPage.page.locator('#content')).toContainText('There is no product that matches the search criteria.');
        await expect(laptopsPage.productThumbs).toHaveCount(0);
    });

    test('TC-LN-019 Search blank input @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        await laptopsPage.search('');
        await expect(page).toHaveURL(/route=product\/search/);
        await expect(page.locator('#content').getByRole('heading', { name: /Search/ }).first()).toBeVisible();
        await expect(laptopsPage.productThumbs).toHaveCount(0);
        await expect(page.locator('body')).not.toContainText(/Fatal error|SQL/i);
    });

    test('TC-LN-020 Search special chars / script @master @regression @web', async ({ page, laptopsPage }) => {
        const script = '<script>alert(1)</script>';
        let dialogShown = false;
        page.on('dialog', async dialog => {
            dialogShown = true;
            await dialog.dismiss();
        });
        await laptopsPage.goto();
        await laptopsPage.search(script);
        await expect(page).toHaveURL(/route=product\/search/);
        await expect(laptopsPage.txtSearch).toHaveValue(script);
        await expect(page.locator('#content')).toContainText('There is no product that matches the search criteria.');
        await expect(page.locator('#content script')).toHaveCount(0);
        expect(dialogShown, 'No alert dialog should execute').toBe(false);
    });

    test('TC-LN-021 Cart button - empty cart @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.btnCart).toContainText('0 item(s) - $0.00');
        await laptopsPage.openMiniCart();
        await expect(laptopsPage.miniCartMenu).toBeVisible();
        await expect(laptopsPage.miniCartMenu).toContainText('Your shopping cart is empty!');
    });
});

test.describe('Laptops & Notebooks - 4.4 Top navigation menu and breadcrumb', () => {
    test('TC-LN-022 Menu items displayed @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.topMenu.locator('ul.nav > li > a')).toHaveText([
            'Desktops', 'Laptops & Notebooks', 'Components', 'Tablets', 'Software', 'Phones & PDAs', 'Cameras', 'MP3 Players',
        ]);
    });

    test('TC-LN-023 Menu dropdown on hover @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        for (const name of ['Desktops', 'Laptops & Notebooks', 'Components', 'MP3 Players']) {
            const item = laptopsPage.topMenu.locator('li.dropdown').filter({ has: page.getByRole('link', { name, exact: true }) });
            await laptopsPage.topMenuLink(name).hover();
            const showAll = item.locator('.dropdown-menu').getByRole('link', { name: `Show All${name}` });
            await expect(showAll, `"Show All ${name}" should be visible on hover`).toBeVisible();
        }
    });

    test('TC-LN-024 Menu item navigation @master @regression @web', async ({ page, laptopsPage }) => {
        const targets: Array<{ name: string; path: string }> = [
            { name: 'Tablets', path: '57' },
            { name: 'Software', path: '17' },
            { name: 'Cameras', path: '33' },
        ];
        for (const { name, path } of targets) {
            await laptopsPage.goto();
            await laptopsPage.topMenuLink(name).click();
            await expect(page).toHaveURL(new RegExp(`route=product/category&path=${path}`));
            await expect(page.locator('#content').getByRole('heading', { name, level: 2, exact: true })).toBeVisible();
        }
    });

    test('TC-LN-025 Breadcrumb content @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.goto();
        const items = laptopsPage.breadcrumb.locator('li');
        await expect(items).toHaveCount(2);
        await expect(items.first().locator('i.fa-home')).toBeVisible();
        await expect(items.last()).toHaveText('Laptops & Notebooks');
    });

    test('TC-LN-026 Breadcrumb Home navigation @master @regression @web', async ({ page, laptopsPage }) => {
        await laptopsPage.goto();
        // The breadcrumb arrow pseudo-element overlays the icon centre, so click the link's left edge
        await laptopsPage.breadcrumbLink('home').click({ position: { x: 2, y: 8 } });
        await expect(page).toHaveURL(/route=common\/home|demo\/(index\.php)?$/);
        await expect(page).toHaveTitle('Your Store');
    });
});
