import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { ScreenConfigPanel } from './ScreenConfigPanel';

/** A screen as the mapping table identifies it: "<app> · <screen code>". */
export type ScreenKey = { app: string; code: string };
export type AccessPrivilege = 'Unmapped' | 'Viewer' | 'Actor';
export type MappingColumn = 'Screen' | 'Rails' | 'Access Privilege' | 'Config';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Screen Mapping right slide-in panel for one role (FSD §5.4). Dialog name = role code. */
export class ScreenMappingPanel extends BasePage {
  readonly dialog: Locator;
  readonly label: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly infoNote: Locator;
  readonly mappedSummary: Locator;
  readonly headerCheckbox: Locator;
  readonly rows: Locator;
  readonly pageSize: Locator;
  readonly comments: Locator;
  readonly commentsHint: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  /** View mode only (FSD §5.4 footer). */
  readonly closeButton: Locator;
  readonly closeDrawerButton: Locator;

  constructor(page: Page, readonly code: string) {
    super(page);
    // The Audit Trail panel has the same dialog name; only this one has the screen filter.
    this.dialog = page
      .getByRole('dialog', { name: code, exact: true })
      .filter({ has: page.getByRole('combobox', { name: 'Filter screens' }) });
    this.label = this.dialog.getByText('Screen Mapping', { exact: true });
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.subtitle = this.dialog.locator('h2 + p');
    this.infoNote = this.dialog.getByText(/Tick screens to enable access for this role/);
    this.mappedSummary = this.dialog.getByText(/^\d+ of \d+ mapped$/);
    this.headerCheckbox = this.dialog.getByRole('checkbox', { name: 'Select all rows on this page' });
    this.rows = this.dialog.getByRole('row').filter({ hasText: / · / });
    this.pageSize = this.dialog.getByRole('combobox').filter({ has: page.getByRole('option', { name: '50', exact: true }) });
    this.comments = this.dialog.getByRole('textbox', { name: 'Modification Comments' });
    this.commentsHint = this.dialog.getByText(/This comment will be recorded in the audit trail\./);
    this.saveButton = this.dialog.getByRole('button', { name: 'Save Mapping' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close', exact: true });
    this.closeDrawerButton = this.dialog.getByRole('button', { name: 'Close drawer' });
  }

  /** The summary renders before the table rows, so wait for both. */
  async waitForLoad(): Promise<void> {
    await this.mappedSummary.waitFor();
    await this.rows.first().waitFor();
  }

  /** Puts every applicable screen on one page (the table pages by 10 by default). */
  async showAll(): Promise<void> {
    await this.waitForLoad();
    if (await this.pageSize.isVisible()) {
      await this.pageSize.selectOption('50');
      const total = Number((await this.mappedSummary.innerText()).match(/of (\d+)/)![1]);
      await this.rows.nth(Math.min(total, 50) - 1).waitFor();
    }
  }

  row(key: ScreenKey): Locator {
    return this.rows.filter({ hasText: new RegExp(`${escapeRegExp(key.app)} · ${escapeRegExp(key.code)}(?![\\w-])`) });
  }

  rowCheckbox(key: ScreenKey): Locator {
    return this.dialog.getByRole('checkbox', { name: `Select row ${key.app}:${key.code}`, exact: true });
  }

  /** Edit-mode dropdown; in view mode the privilege is plain text (see `cell(key, 'Access Privilege')`). */
  privilege(key: ScreenKey): Locator {
    return this.row(key).getByRole('combobox', { name: `Access privilege: ${key.code}`, exact: true });
  }

  configButton(key: ScreenKey): Locator {
    return this.row(key).getByRole('button', { name: 'Screen Config' });
  }

  /** A cell by column header — the checkbox column only exists in edit mode, so indexes shift. */
  async cell(key: ScreenKey, column: MappingColumn): Promise<Locator> {
    // DOM text, not innerText: the headers are upper-cased by CSS only.
    const headers = (await this.dialog.getByRole('columnheader').allTextContents()).map((h) => h.replace(/[▼▲]/g, '').trim());
    const index = headers.findIndex((h) => h.startsWith(column));
    return this.row(key).getByRole('cell').nth(index);
  }

  async selectedPrivilege(key: ScreenKey): Promise<string> {
    return (await this.privilege(key).locator('option:checked').textContent())?.trim() ?? '';
  }

  /** "<app>:<code>" of every row on the current page, with its checkbox state (edit mode). */
  async rowStates(): Promise<Array<{ key: string; mapped: boolean; privilege: string }>> {
    return this.rows.evaluateAll((rows) =>
      rows.map((r) => {
        const screenLine = (r.querySelectorAll('td')[r.querySelector('input[type=checkbox]') ? 1 : 0] as HTMLElement)
          .innerText.split('\n')
          .map((l) => l.trim())
          .find((l) => l.includes(' · ')) ?? '';
        const select = r.querySelector('select');
        const box = r.querySelector('input[type=checkbox]') as HTMLInputElement | null;
        return {
          key: screenLine.replace(' · ', ':'),
          mapped: box ? box.checked : false,
          privilege: select ? select.options[select.selectedIndex].text.trim() : '',
        };
      }),
    );
  }

  async tick(key: ScreenKey, privilege?: AccessPrivilege): Promise<void> {
    await this.rowCheckbox(key).check();
    if (privilege) await this.privilege(key).selectOption({ label: privilege });
  }

  async untick(key: ScreenKey): Promise<void> {
    await this.rowCheckbox(key).uncheck();
  }

  async setPrivilege(key: ScreenKey, privilege: AccessPrivilege): Promise<void> {
    await this.privilege(key).selectOption({ label: privilege });
  }

  async save(comments: string): Promise<void> {
    await this.comments.fill(comments);
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async close(): Promise<void> {
    await this.closeDrawerButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async openConfig(key: ScreenKey, screenName: string): Promise<ScreenConfigPanel> {
    await this.configButton(key).click();
    const panel = new ScreenConfigPanel(this.page, screenName);
    await panel.waitForLoad();
    return panel;
  }
}
