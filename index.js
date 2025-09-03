const { chromium, devices } = require("playwright");

function getStandardDeviation(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}

const getMean = (array) => {
  let total = 0;
  for (let i = 0; i < array.length; i += 1) {
    total += array[i];
  }
  return total / array.length;
};

const round = (x) => Math.round(x * 10) / 10;

const one_to_n = (n) => {
  const ns = [];

  for (var i = 1; i <= n; i++) {
    ns.push(i);
  }
  return ns;
};

class PlaywrightSession {
  constructor(opts) {
    this.startSession = opts.startSession;
    this.browser = opts.browser;
  }

  async start_session() {
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    if (this.startSession) {
      await this.startSession(this);
    }
  }
  async close_browser() {
    await this.context.close();
  }
}

class PlaywrightBenchmark {
  constructor(opts) {
    this.startSession = opts.startSession;
    this.pages = opts.pages;
    this.baseUrl = opts.baseUrl || "";
    this.data = {};
  }

  async init_browser() {
    this.browser = await chromium.launch({ headless: true });
  }

  async page_run(session, { url, contains, timeout }) {
    if (!this.data[url]) this.data[url] = [];

    const response = await session.page.goto(
      this.baseUrl + url,
      timeout ? { timeout } : undefined
    );
    const largestContentfulPaint = await session.page.evaluate(() => {
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
    const navigationTimingJson = await session.page.evaluate(() =>
      performance.getEntriesByType("navigation")
    );
    //if (index === 0) console.log(navigationTimingJson);

    const correct =
      response.status() === 200 &&
      (contains ? (await session.page.content()).includes(contains) : true);

    this.data[url].push({
      responseEnd: navigationTimingJson[0].responseEnd,
      LCP: parseFloat(largestContentfulPaint),
      domComplete: navigationTimingJson[0].domComplete,
      correct: correct ? 100 : 0,
    });
  }
  async main_run({ ntimes, concurrency = 1 }) {
    await Promise.all(
      one_to_n(concurrency).map(async (threadIx) => {
        const session = new PlaywrightSession({
          startSession: this.startSession,
          browser: this.browser,
        });
        await session.start_session();
        for (let t = 0; t < ntimes; t++)
          for (const pg of this.pages) await this.page_run(session, pg);

        await session.close_browser();
      })
    );
  }
  async close_browser() {
    await this.browser.close();
  }

  calc_stats() {
    this.stats = [];
    Object.entries(this.data).forEach(([url, valObjs]) => {
      const point = { url };
      ["responseEnd", "LCP", "domComplete"].forEach((k) => {
        const vals = valObjs.map((o) => o[k]);

        point[`${k} mean`] = round(getMean(vals));
        point[`${k} sd`] = round(getStandardDeviation(vals));
      });
      point.correct = Math.round(getMean(valObjs.map((o) => o.correct)));
      this.stats.push(point);
    });
    return this.stats;
  }

  async run({ ntimes = 3, concurrency = 1 }) {
    await this.init_browser();
    await this.main_run({ ntimes, concurrency });
    await this.close_browser();
  }
}

module.exports = PlaywrightBenchmark;
