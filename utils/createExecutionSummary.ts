import * as fs from 'node:fs';
import * as path from 'node:path';
import type { JSONReport, JSONReportSuite, JSONReportTestResult } from '@playwright/test/reporter';

type ExecutionStatus = 'passed' | 'failed' | 'skipped';

interface Execution {
  title: string;
  status: ExecutionStatus;
  result?: JSONReportTestResult;
}

const resultsPath = path.resolve('test-results/inventory-results.json');
const summaryPath = path.resolve('test-results/inventory-execution-summary.md');
const report: JSONReport = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const executions: Execution[] = [];

function collectSuites(suites: JSONReportSuite[] | undefined) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.at(-1);
        const status: ExecutionStatus = test.expectedStatus === 'skipped' || result?.status === 'skipped'
          ? 'skipped'
          : result?.status === 'passed'
            ? 'passed'
            : 'failed';
        executions.push({ title: spec.title, status, result });
      }
    }
    collectSuites(suite.suites);
  }
}

collectSuites(report.suites);

const counts = executions.reduce<Record<ExecutionStatus, number>>((totals, execution) => {
  totals[execution.status] += 1;
  return totals;
}, { passed: 0, failed: 0, skipped: 0 });

function failureDetails(execution: Execution): string {
  const error = execution.result?.error ?? execution.result?.errors?.[0];
  const location = error?.location;
  const failedStep = location
    ? `${location.file}:${location.line}:${location.column ?? 1}`
    : 'See Playwright HTML report';
  const reason = (error?.message ?? 'No error message recorded').split('\n')[0];
  return `- **${execution.title}**: ${failedStep}; ${reason}`;
}

const failures = executions.filter(({ status }) => status === 'failed');
const durationSeconds = ((report.stats?.duration ?? 0) / 1000).toFixed(2);
const lines = [
  '# SauceDemo Inventory Execution Summary',
  '',
  `- Total Test Cases: ${executions.length}`,
  `- Passed: ${counts.passed}`,
  `- Failed: ${counts.failed}`,
  `- Skipped: ${counts.skipped}`,
  `- Defects Found: ${counts.failed}`,
  `- Execution Duration: ${durationSeconds}s`,
  '',
  '## Failed Step and Failure Reason',
  '',
  ...(failures.length ? failures.map(failureDetails) : ['None']),
  '',
  '## Manual Intervention',
  '',
  'TC27 can verify the duplicate is not added because the Add to cart control changes to Remove after the first add; the application exposes no second Add action for that same item.',
  'TC32 interprets responsive behavior as inventory content remaining visible and the first product card fitting within 1280px, 768px, and 375px viewports; no visual design acceptance criteria were supplied.',
  '',
  'Allure reporting is not configured in this project.',
];

fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${summaryPath}`);
