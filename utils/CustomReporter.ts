import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import fs from "fs";
import path from "path";

type TestRow = {
  title: string;
  file: string;
  project: string;
  tags: string[];
  status: string;
  durationMs: number;
  retries: number;
  error?: string;
};

const OUTPUT_DIR = "custom-report";
const OUTPUT_FILE = "test-report.html";

/**
 * Writes a self-contained HTML summary of the run to custom-report/test-report.html.
 * Registered in playwright.config.ts as ["./utils/CustomReporter.ts"].
 */
export default class CustomReporter implements Reporter {
  // Keyed by test id so a retried test keeps only its final attempt
  private rows = new Map<string, TestRow>();
  private rootDir = process.cwd();
  private startTime = new Date();

  onBegin(config: FullConfig, suite: Suite): void {
    // Project root = folder holding playwright.config.ts (config.rootDir is the testDir)
    this.rootDir = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.startTime = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const outcome = test.outcome();
    this.rows.set(test.id, {
      title: test.titlePath().slice(3).join(" › "),
      file: `${path.relative(this.rootDir, test.location.file)}:${test.location.line}`,
      project: test.parent.project()?.name ?? "",
      tags: test.tags,
      status: outcome === "flaky" ? "flaky" : result.status,
      durationMs: result.duration,
      retries: result.retry,
      error: result.error?.message ? stripAnsi(result.error.message) : undefined,
    });
  }

  onEnd(result: FullResult): void {
    const rows = [...this.rows.values()];
    const count = (status: string) => rows.filter((r) => r.status === status).length;
    const summary = {
      total: rows.length,
      passed: count("passed"),
      failed: count("failed") + count("timedOut") + count("interrupted"),
      flaky: count("flaky"),
      skipped: count("skipped"),
    };

    const outputDir = path.resolve(this.rootDir, OUTPUT_DIR);
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, OUTPUT_FILE);
    fs.writeFileSync(outputPath, renderHtml(rows, summary, result.status, this.startTime, result.duration));
    console.log(`\nCustom report: ${outputPath}`);
  }

  printsToStdio(): boolean {
    return false;
  }
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml(
  rows: TestRow[],
  summary: Record<"total" | "passed" | "failed" | "flaky" | "skipped", number>,
  runStatus: string,
  startTime: Date,
  durationMs: number,
): string {
  const tableRows = rows
    .map(
      (r) => `
      <tr class="${r.status}">
        <td>${escapeHtml(r.title)}<div class="muted">${escapeHtml(r.file)}</div></td>
        <td>${escapeHtml(r.project)}</td>
        <td>${r.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ")}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>${(r.durationMs / 1000).toFixed(2)}s</td>
        <td>${r.retries}</td>
        <td>${r.error ? `<pre>${escapeHtml(r.error)}</pre>` : ""}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playwright Test Report</title>
<style>
  body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #1f2328; background: #fff; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .muted { color: #656d76; font-size: 12px; }
  .cards { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
  .card { border: 1px solid #d0d7de; border-radius: 8px; padding: 12px 16px; min-width: 100px; }
  .card b { display: block; font-size: 24px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border-bottom: 1px solid #d0d7de; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f6f8fa; }
  pre { white-space: pre-wrap; margin: 0; font-size: 12px; max-height: 200px; overflow: auto; }
  .tag { background: #ddf4ff; color: #0969da; border-radius: 10px; padding: 1px 8px; font-size: 12px; }
  .badge { border-radius: 10px; padding: 2px 8px; font-size: 12px; color: #fff; background: #656d76; }
  .badge.passed { background: #1a7f37; }
  .badge.failed, .badge.timedOut, .badge.interrupted { background: #cf222e; }
  .badge.flaky { background: #9a6700; }
</style>
</head>
<body>
  <h1>Playwright Test Report</h1>
  <div class="muted">Started ${startTime.toLocaleString()} · Duration ${(durationMs / 1000).toFixed(1)}s · Run status: ${runStatus}</div>
  <div class="cards">
    <div class="card">Total<b>${summary.total}</b></div>
    <div class="card">Passed<b>${summary.passed}</b></div>
    <div class="card">Failed<b>${summary.failed}</b></div>
    <div class="card">Flaky<b>${summary.flaky}</b></div>
    <div class="card">Skipped<b>${summary.skipped}</b></div>
  </div>
  <table>
    <thead><tr><th>Test</th><th>Project</th><th>Tags</th><th>Status</th><th>Duration</th><th>Retry</th><th>Error</th></tr></thead>
    <tbody>${tableRows || `<tr><td colspan="7">No tests were run.</td></tr>`}</tbody>
  </table>
</body>
</html>
`;
}
