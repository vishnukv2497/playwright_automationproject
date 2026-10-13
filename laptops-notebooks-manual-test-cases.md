# Manual Test Cases – Laptops & Notebooks Category Page

**Application:** Qafox.com (TutorialsNinja OpenCart demo)
**URL:** https://tutorialsninja.com/demo/index.php?route=product/category&path=18
**Page under test:** Product category listing – Laptops & Notebooks
**Prepared by:** Vishnu V | **Date:** 13-Oct-2026

Priority: P1 = critical, P2 = major, P3 = minor. Type: F = Functional, UI, N = Negative, NAV = Navigation, CMP = Compatibility/Responsive.

## Observed page data (baseline from screenshot)

- Left panel counts: Desktops (13), Laptops & Notebooks (5), -Macs (0), -Windows (0), Components (2), Tablets (1), Software (0), Phones & PDAs (3), Cameras (2), MP3 Players (4)
- Refine Search: Macs (0), Windows (0). Default Sort / Show: Default / 20
- Products: HP LP3065 $122.00 (Ex Tax $100.00); MacBook $602.00 ($500.00); MacBook Air $1,202.00 ($1,000.00)
- Header: cart 0 item(s) - $0.00; Wish List (0); Product Compare (0)
- Price pattern assumption: Price = Ex Tax x 1.20 + $2.00

## Observations to raise (possible defects)

- OBS-01: "HP LP3065" is a monitor but is listed under Laptops & Notebooks.
- OBS-02: Sub-categories Macs (0) and Windows (0) are empty while MacBook / MacBook Air are in the parent category.
- OBS-03: Only 3 of 5 products visible in the screenshot; verify all 5 render (TC-LN-041).

## Test Cases (TC | Scenario | Pre-conditions | Steps | Test data | Expected | Priority | Type)

### 4.1 Page load and layout
- TC-LN-001 | Page loads via direct URL | Browser open | Enter category URL, press Enter | path=18 | Loads without errors; heading "Laptops & Notebooks" | P1 | F
- TC-LN-002 | Page loads via top menu | Home open | Hover "Laptops & Notebooks", click "Show All Laptops & Notebooks" | – | Lands on the category page | P1 | NAV
- TC-LN-003 | Category heading and description | Category open | Check H1, category image, description | – | Heading shown; image loads; description readable | P2 | UI
- TC-LN-004 | Overall layout | Category open | Check header, menu, breadcrumb, left panel, content, footer | – | Aligned, no overlap, no broken images | P2 | UI
- TC-LN-005 | Invalid category path | Browser open | Change URL to path=99999 | 99999 | "Category not found!" message; no server error | P2 | N
- TC-LN-006 | Non-numeric category path | Browser open | Change URL to path=abc | abc | Graceful "Category not found"; no SQL/system error | P2 | N

### 4.2 Header utilities
- TC-LN-007 | Currency dropdown options | Category open | Click "$ Currency" | – | Dropdown lists currencies (EUR, GBP, USD) | P2 | F
- TC-LN-008 | Change currency updates prices | Category open | Select € Euro | Euro | Prices, Ex Tax and header cart total show € and converted values; stays on category | P1 | F
- TC-LN-009 | Currency persists across pages | Currency = € | Go to another category, return | – | Currency stays applied | P3 | F
- TC-LN-010 | Phone number display | Category open | Check header phone | – | "123456789" with icon | P3 | UI
- TC-LN-011 | My Account dropdown (guest) | Not logged in | Click My Account | – | Shows Register and Login | P2 | F
- TC-LN-012 | Wish List link (guest) | Not logged in | Click "Wish List (0)" | – | Redirected to Login page | P2 | NAV
- TC-LN-013 | Shopping Cart link – empty | Cart empty | Click Shopping Cart | – | Cart page: "Your shopping cart is empty!" | P2 | NAV
- TC-LN-014 | Checkout link – empty | Cart empty | Click Checkout | – | Redirected to cart / empty message; checkout not allowed | P2 | N

### 4.3 Logo, Search and Cart button
- TC-LN-015 | Logo navigates to Home | Category open | Click logo | – | Home opens | P2 | NAV
- TC-LN-016 | Search valid product | Category open | Enter product, click search icon | MacBook | Results show MacBook, MacBook Air etc. | P1 | F
- TC-LN-017 | Search using Enter key | Category open | Enter keyword, press Enter | HP | Results with matching products | P2 | F
- TC-LN-018 | Search non-existing product | Category open | Search | xyz123 | "There is no product that matches the search criteria." | P2 | N
- TC-LN-019 | Search blank input | Category open | Leave empty, click search | blank | Search page opens without error; no products | P3 | N
- TC-LN-020 | Search special chars / script | Category open | Enter script tag, search | `<script>alert(1)</script>` | Treated as text; no script executes; no error page | P2 | N
- TC-LN-021 | Cart button – empty cart | Cart empty | Click black cart button | – | Dropdown "Your shopping cart is empty!" | P2 | F

### 4.4 Top navigation menu and breadcrumb
- TC-LN-022 | Menu items displayed | Category open | Check top menu | – | Desktops, Laptops & Notebooks, Components, Tablets, Software, Phones & PDAs, Cameras, MP3 Players in order | P2 | UI
- TC-LN-023 | Menu dropdown on hover | Category open | Hover items with sub-categories | Desktops, Laptops & Notebooks, Components, MP3 Players | Dropdown with "Show All ..." link | P2 | F
- TC-LN-024 | Menu item navigation | Category open | Click Tablets, Software, Cameras | – | Corresponding category page opens | P2 | NAV
- TC-LN-025 | Breadcrumb content | Category open | Check breadcrumb | – | Home icon > Laptops & Notebooks | P3 | UI
- TC-LN-026 | Breadcrumb Home navigation | Category open | Click Home icon | – | Home opens | P3 | NAV

### 4.5 Left category panel
- TC-LN-027 | Category list and counts | Category open | Check left panel | Baseline counts | All categories with counts as baseline; "Laptops & Notebooks (5)" active; -Macs, -Windows indented | P2 | UI
- TC-LN-028 | Count matches products listed | Category open | Compare count with product cards | 5 | Cards listed equal count (5) | P1 | F
- TC-LN-029 | Navigate via left panel | Category open | Click "Phones & PDAs (3)" | – | Page opens with exactly 3 products | P2 | NAV
- TC-LN-030 | Empty sub-category | Category open | Click "-Macs (0)" | – | "There are no products to list in this category." + Continue | P2 | F
- TC-LN-031 | Empty main category | Category open | Click "Software (0)" | – | Same empty message | P3 | F
- TC-LN-032 | Left banner image | Category open | Check banner below category list | – | Banner loads; if clickable opens linked page | P3 | UI

### 4.6 Refine Search, view toggle and Product Compare
- TC-LN-033 | Refine Search links | Category open | Click "Macs (0)", back, click "Windows (0)" | – | Sub-category page opens; empty message | P3 | NAV
- TC-LN-034 | Switch to List view | Grid default | Click List icon | – | One product per row with image, name, description, price, buttons; List icon active | P2 | F
- TC-LN-035 | Switch back to Grid view | List active | Click Grid icon | – | Grid layout; Grid icon active | P2 | F
- TC-LN-036 | View preference retained | List selected | Go to another category, return | – | List view retained | P3 | F
- TC-LN-037 | Product Compare link (empty) | Nothing in compare | Click "Product Compare (0)" | – | "You have not chosen any products to compare." | P3 | F

### 4.7 Sort By and Show
- TC-LN-038 | Sort By options | Category open | Open Sort By | – | Default, Name (A - Z), Name (Z - A), Price (Low > High), Price (High > Low), Rating (Highest), Rating (Lowest), Model (A - Z), Model (Z - A) | P2 | UI
- TC-LN-039 | Sort by Name A-Z / Z-A | Category open | Select each, verify order | – | Alphabetical asc then desc; option stays selected; URL has sort param | P1 | F
- TC-LN-040 | Sort by Price Low>High / High>Low | Category open | Select each, verify order | – | Ascending then descending prices | P1 | F
- TC-LN-041 | All products rendered | Show = 20 | Scroll to end | – | All 5 products; "Showing 1 to 5 of 5 (1 Pages)" | P1 | F
- TC-LN-042 | Show (limit) options | Category open | Open Show | – | 20, 25, 50, 75, 100 | P3 | UI
- TC-LN-043 | Change Show limit | Category open | Select 25 | 25 | Reloads with limit 25; all 5 shown; value retained | P3 | F
- TC-LN-044 | Invalid limit via URL | Category open | Append &limit=-1 or &limit=abc | -1 / abc | Handled gracefully; no error | P3 | N

### 4.8 Product cards
- TC-LN-045 | Product card content | Category open | Check each card | HP LP3065, MacBook, MacBook Air | Image, name link, description ending "..", price, Ex Tax, ADD TO CART, Wish List, Compare | P1 | UI
- TC-LN-046 | Price and Ex Tax values | Category open | Compare with baseline | see baseline | Values match; currency format correct | P1 | F
- TC-LN-047 | Tax calculation consistency | Tax rules confirmed | Calculate price from Ex Tax | Ex Tax x 1.20 + 2.00 | Displayed equals calculated (confirm tax rules) | P2 | F
- TC-LN-048 | Open product via name | Category open | Click "MacBook" | – | MacBook detail page opens | P1 | NAV
- TC-LN-049 | Open product via image | Category open | Click "MacBook Air" image | – | MacBook Air detail page opens | P2 | NAV
- TC-LN-050 | Add to Cart – no required options | Cart empty | Click ADD TO CART on MacBook | – | "Success: You have added MacBook to your shopping cart!"; header "1 item(s) - $602.00" | P1 | F
- TC-LN-051 | Add to Cart – same product twice | MacBook in cart | Click ADD TO CART again | – | Quantity 2; header "2 item(s) - $1,204.00" | P2 | F
- TC-LN-052 | Add to Cart – required options | Cart empty | Click ADD TO CART on HP LP3065 | – | Redirected to product page to select options; not added silently | P1 | F
- TC-LN-053 | Add multiple different products | Cart empty | Add MacBook, MacBook Air, open header cart | – | Both listed with correct prices; total $1,804.00 | P1 | F
- TC-LN-054 | Wish List – guest | Not logged in | Click heart on MacBook | – | Alert "You must login or create an account to save MacBook to your wish list!"; count stays (0) | P2 | N
- TC-LN-055 | Wish List – logged-in | Logged in | Click heart on MacBook | – | Success alert; header "Wish List (1)"; product in My Wish List | P2 | F
- TC-LN-056 | Add to Compare | Nothing in compare | Click Compare on MacBook and MacBook Air | – | Success alerts; "Product Compare (2)"; compare page lists both | P2 | F
- TC-LN-057 | Same product to compare twice | MacBook in compare | Click Compare on MacBook again | – | Count does not increase | P3 | N
- TC-LN-058 | Button hover states | Category open | Hover ADD TO CART, heart, compare | – | Hover style; tooltips "Add to Wish List" and "Compare this Product" | P3 | UI

### 4.9 Compatibility and responsive
- TC-LN-059 | Cross-browser check | – | Open on Chrome, Edge, Firefox, Safari | latest | Consistent layout/functions | P2 | CMP
- TC-LN-060 | Mobile / tablet view | – | Open at 375px and 768px | – | Menu collapses; panel stacks; cards stack; no horizontal scroll | P2 | CMP
- TC-LN-061 | Browser back / refresh | Sort = Price Low>High | Refresh; open product, Back | – | Sort and listing retained; no duplicate add-to-cart on refresh | P3 | F

## Assumptions and open questions

- Sort / Show options and alert messages follow standard OpenCart; confirm against the actual build.
- Tax formula (VAT 20% + $2 Eco Tax) inferred from visible prices.
- Logged-in scenarios need a valid registered test account.
