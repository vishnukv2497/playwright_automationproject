import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type ApprovalEntityTab = 'All' | 'User' | 'Role' | 'Screen' | 'Department' | 'RAIL' | 'GL Account';

/** Administration > Approval Queue (/approval-queue) — "Admin Actions Approval Queue". */
export class ApprovalQueuePage extends BasePage {
  readonly heading: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Admin Actions Approval Queue', level: 1 });
    // Includes the "No approval requests found" row, so it is also the "grid has loaded" signal.
    this.rows = page.getByRole('main').getByRole('rowgroup').nth(1).getByRole('row');
  }

  async goto(): Promise<void> {
    await this.page.goto('/approval-queue');
    await this.heading.waitFor();
    await this.rows.first().waitFor();
  }

  tab(name: ApprovalEntityTab): Locator {
    return this.page.getByRole('tablist', { name: 'Entity type' }).getByRole('tab', { name, exact: true });
  }

  async openTab(name: ApprovalEntityTab): Promise<void> {
    await this.tab(name).click();
    await this.rows.first().waitFor();
  }

  /** Queue rows whose Entity Code cell is exactly `code`. */
  rowsFor(code: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: code, exact: true }) });
  }

  /** "View & Action" button of a pending role request. */
  reviewButton(code: string): Locator {
    return this.page.getByRole('main').getByRole('button', { name: `View and action Role ${code}`, exact: true });
  }

  /** Opens the Review Change drawer for the role's pending request (Role tab). */
  async openRoleReview(code: string): Promise<ReviewChangePanel> {
    await this.goto();
    await this.openTab('Role');
    await this.reviewButton(code).click();
    const review = new ReviewChangePanel(this.page);
    await review.remarks.waitFor();
    return review;
  }
}

/** "Review Change" drawer: the Checker's before/after view of one request, with Approve / Reject. */
export class ReviewChangePanel extends BasePage {
  readonly dialog: Locator;
  /** Rows of the first table — the Field / Previous / Updated change list. */
  readonly changeRows: Locator;
  readonly remarks: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: 'Review Change' });
    this.changeRows = this.dialog.getByRole('table').first().getByRole('row').filter({ has: page.getByRole('cell') });
    this.remarks = this.dialog.getByRole('textbox', { name: 'Your Remarks *' });
    this.approveButton = this.dialog.getByRole('button', { name: 'Approve', exact: true });
    this.rejectButton = this.dialog.getByRole('button', { name: 'Reject', exact: true });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  async approve(remarks: string): Promise<void> {
    await this.remarks.fill(remarks);
    await this.approveButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async reject(remarks: string): Promise<void> {
    await this.remarks.fill(remarks);
    await this.rejectButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
