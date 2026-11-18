import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/** What one audit card shows, read from its rendered text (cards carry no roles or test ids). */
export type AuditCardData = {
  entry: string;
  user: string;
  roleLine: string;
  dateTime: string;
  badges: string[];
  purpose: string;
  state: string;
  changes: string[];
  comments: string;
};

/** One timeline card in the Audit Trail feed (FSD §5.6.2). */
export class AuditCard {
  readonly changes: Locator;
  readonly comments: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;

  constructor(readonly root: Locator) {
    this.changes = root.getByRole('listitem');
    this.comments = root.getByText(/^Comments:/);
    this.approveButton = root.getByRole('button', { name: 'Approve' });
    this.rejectButton = root.getByRole('button', { name: 'Reject' });
  }

  /** The coloured section badge (the card header also repeats the section names in capitals, after the badges). */
  badge(section: string): Locator {
    return this.root.getByText(section, { exact: true }).first();
  }

  async read(): Promise<AuditCardData> {
    const lines = (await this.root.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
    const purposeAt = lines.findIndex((l) => l.startsWith('Purpose:'));
    // Between the timestamp (line 3) and "Purpose:" come the badges, then the same names in capitals.
    const header = lines.slice(4, purposeAt);
    const badges = header.filter((l) => l !== l.toUpperCase());
    return {
      entry: lines[0],
      user: lines[1],
      roleLine: lines[2],
      dateTime: lines[3],
      badges,
      purpose: lines[purposeAt]?.replace(/^Purpose:\s*/, '') ?? '',
      state: lines[purposeAt + 1] ?? '',
      changes: (await this.changes.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()),
      comments: (lines.find((l) => l.startsWith('Comments:')) ?? '').replace(/^Comments:\s*/, ''),
    };
  }
}

/** Audit Trail extra-wide slide-in panel for one role (FSD §5.6). Dialog name = role code. */
export class AuditTrailPanel extends BasePage {
  readonly dialog: Locator;
  readonly label: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly section: Locator;
  readonly fromDate: Locator;
  readonly toDate: Locator;
  readonly searchButton: Locator;
  /** Timeline cards, newest first. Cards have no role/test id: each is the bordered box holding one "Purpose:" line. */
  readonly cards: Locator;
  readonly recordCount: Locator;
  readonly entriesPerPage: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;
  readonly closeButton: Locator;

  constructor(page: Page, readonly code: string) {
    super(page);
    // The Screen Mapping panel has the same dialog name; only this one has the Section filter.
    this.dialog = page
      .getByRole('dialog', { name: code, exact: true })
      .filter({ has: page.getByRole('combobox', { name: 'Section' }) });
    this.label = this.dialog.getByText('Audit Trail', { exact: true });
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.subtitle = this.dialog.locator('h2 + p');
    this.section = this.dialog.getByRole('combobox', { name: 'Section' });
    this.fromDate = this.dialog.getByRole('textbox', { name: 'From' });
    this.toDate = this.dialog.getByRole('textbox', { name: 'To' });
    this.searchButton = this.dialog.getByRole('button', { name: 'Search', exact: true });
    this.cards = this.dialog.locator('div.rounded-xl').filter({ hasText: /Purpose:/ });
    this.recordCount = this.dialog.getByText(/^Showing\s*\d+–\d+\s*of\s*\d+\s*entr(y|ies)$/);
    this.entriesPerPage = this.dialog.getByRole('combobox', { name: 'Entries per page' });
    this.nextPage = this.dialog.getByRole('button', { name: 'Next page' });
    this.previousPage = this.dialog.getByRole('button', { name: 'Previous page' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close', exact: true });
  }

  async waitForLoad(): Promise<void> {
    await this.recordCount.or(this.dialog.getByText('No records match the selected filter.')).first().waitFor();
  }

  card(index: number): AuditCard {
    return new AuditCard(this.cards.nth(index));
  }

  /** Cards whose header carries the given section badge. */
  cardsWithBadge(section: string): Locator {
    return this.cards.filter({ has: this.page.getByText(section, { exact: true }) });
  }

  async readAll(): Promise<AuditCardData[]> {
    const count = await this.cards.count();
    const out: AuditCardData[] = [];
    for (let i = 0; i < count; i++) out.push(await this.card(i).read());
    return out;
  }

  /**
   * Shows up to 50 cards on one page. The feed re-queries the server on a page-size change and gives no visible
   * signal when the count label does not change (≤ 10 entries), so wait for that response, then the last card.
   */
  async showAll(): Promise<void> {
    const reloaded = this.page.waitForResponse((r) => r.request().method() === 'GET' && r.url().includes('/audit?'));
    await this.entriesPerPage.selectOption('50');
    await reloaded;
    const total = await this.total();
    if (total > 0) await this.cards.nth(Math.min(total, 50) - 1).waitFor();
  }

  /** "Showing a–b of N entries" → N. */
  async total(): Promise<number> {
    const text = await this.recordCount.innerText();
    return Number(text.match(/of\s*(\d+)/)![1]);
  }

  /** Date inputs are native <input type=date>: values are ISO yyyy-mm-dd. */
  async search(criteria: { section?: string; from?: string; to?: string }): Promise<void> {
    if (criteria.section !== undefined) await this.section.selectOption({ label: criteria.section });
    if (criteria.from !== undefined) await this.fromDate.fill(criteria.from);
    if (criteria.to !== undefined) await this.toDate.fill(criteria.to);
    await this.searchButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
