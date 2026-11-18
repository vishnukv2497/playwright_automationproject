import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export type ConfigColumn = 'Element' | 'Element Data List' | 'Element Type' | 'Rail' | 'Description' | 'Enable' | 'Editable';

/** Screen Configuration wide slide-in panel, opened from a Screen Mapping row (FSD §5.5). Dialog name = screen name. */
export class ScreenConfigPanel extends BasePage {
  readonly dialog: Locator;
  readonly label: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly columnHeaders: Locator;
  readonly rows: Locator;
  readonly switches: Locator;
  readonly comments: Locator;
  readonly commentsHint: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  /** View mode (e.g. a Disabled role): no Save Config, only Close. */
  readonly closeButton: Locator;

  constructor(page: Page, readonly screenName: string) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: screenName, exact: true });
    this.label = this.dialog.getByText('Screen Configuration', { exact: true });
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.subtitle = this.dialog.locator('h2 + p');
    this.columnHeaders = this.dialog.getByRole('columnheader');
    this.rows = this.dialog.getByRole('row').filter({ has: page.getByRole('cell') });
    this.switches = this.dialog.getByRole('switch');
    this.comments = this.dialog.getByRole('textbox', { name: 'Modification Comments' });
    this.commentsHint = this.dialog.getByText(/This comment will be recorded in the audit trail\./);
    this.saveButton = this.dialog.getByRole('button', { name: 'Save Config' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close', exact: true });
  }

  /** A placeholder row renders first; the record count only appears once the element rows are in. */
  async waitForLoad(): Promise<void> {
    await this.dialog.getByText(/^Showing\s*1–\d+\s*of\s*[1-9]\d*\s*records$/).waitFor();
  }

  /** Enable toggle of an element, by its permission key (the toggle's accessible name is "Enable: <key>"). */
  enableSwitch(permissionKey: string): Locator {
    return this.dialog.getByRole('switch', { name: `Enable: ${permissionKey}`, exact: true });
  }

  /** FSD §5.5 Editable toggle for an input element (named like the Enable toggle). */
  editableSwitch(permissionKey: string): Locator {
    return this.dialog.getByRole('switch', { name: `Editable: ${permissionKey}`, exact: true });
  }

  elementRow(elementName: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: elementName, exact: true }) });
  }

  /** Header texts as authored (DOM text — the headers are upper-cased by CSS only). */
  async headers(): Promise<string[]> {
    return (await this.columnHeaders.allTextContents()).map((h) => h.replace(/[▼▲]/g, '').trim());
  }

  async columnIndex(column: ConfigColumn): Promise<number> {
    return (await this.headers()).findIndex((h) => h.startsWith(column));
  }

  /** Per-row element facts read from the table: name, type, and the Enable/Editable cells' content. */
  async elements(): Promise<Array<{ element: string; type: string; enableKey: string | null; enabled: boolean | null; switchDisabled: boolean; editableText: string; editableSwitch: boolean }>> {
    const typeIdx = await this.columnIndex('Element Type');
    const editableIdx = await this.columnIndex('Editable');
    return this.rows.evaluateAll(
      (rows, [typeIndex, editableIndex]) =>
        rows.map((r) => {
          const cells = [...r.querySelectorAll('td')] as HTMLElement[];
          // Grouped elements (e.g. one "Select Rail" card per rail) use a row-spanned first cell, so later
          // rows of the group are one cell short — count from the end for the trailing columns.
          const fromEnd = (idx: number, total: number) => cells[cells.length - (total - idx)];
          const enableSw = r.querySelector('[role=switch][aria-label^="Enable:"]') as HTMLButtonElement | null;
          const editableSw = r.querySelector('[role=switch][aria-label^="Editable:"]');
          const total = 7;
          return {
            element: cells.length >= total ? cells[0].innerText.split('\n')[0].trim() : '',
            type: (fromEnd(typeIndex, total)?.innerText ?? '').trim(),
            enableKey: enableSw ? enableSw.getAttribute('aria-label')!.replace(/^Enable: /, '') : null,
            enabled: enableSw ? enableSw.getAttribute('aria-checked') === 'true' : null,
            switchDisabled: enableSw ? enableSw.disabled : true,
            editableText: (fromEnd(editableIndex, total)?.innerText ?? '').trim(),
            editableSwitch: !!editableSw,
          };
        }),
      [typeIdx, editableIdx] as [number, number],
    );
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
    await this.dialog.getByRole('button', { name: 'Close drawer' }).click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
