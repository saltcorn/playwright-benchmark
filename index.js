const { chromium, devices } = require("playwright");

class PlaywrightBenchmark {
  constructor(opts) {
    this.startSession = opts.startSession;
    this.pages = opts.pages;
  }

  async init_browser() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await browser.newContext();
    this.page = await context.newPage();
  }
  async start_session() {
    if (this.startSession) {
      await this.startSession(this);
    }
  }
  async main_run() {
    if (!this.data) this.data = {};
    for (const { url } of this.pages) {
      if (!this.data[url]) this.data[url] = [];

      await this.page.goto(url);
      const largestContentfulPaint = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((l) => {
            const entries = l.getEntries();
            // the last entry is the largest contentful paint
            const largestPaintEntry = entries.at(-1);
            resolve(largestPaintEntry.startTime);
          }).observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
        });
      });
      this.data[url].push({ lcp: parseFloat(largestContentfulPaint) });
    }
  }
  async close_browser() {
    await this.context.close();
    await this.browser.close();
  }

  async run() {
    await this.init_browser();
    await this.start_session();
    await this.main_run();
    await this.close_browser();
  }
}

module.exports = PlaywrightBenchmark;
