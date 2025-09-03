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

const round = x=> Math.round(x*10)/10

class PlaywrightBenchmark {
  constructor(opts) {
    this.startSession = opts.startSession;
    this.pages = opts.pages;
  }

  async init_browser() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }
  async start_session() {
    if (this.startSession) {
      await this.startSession(this);
    }
  }
  async main_run(times) {
    if (!this.data) this.data = {};
    for (let index = 0; index < times; index++) {
      for (const { url } of this.pages) {
        if (!this.data[url]) this.data[url] = [];

        await this.page.goto(url);
        const largestContentfulPaint = await this.page.evaluate(() => {
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
        const navigationTimingJson = await this.page.evaluate(() =>
          performance.getEntriesByType("navigation")
        );
        //if(index===0) console.log(navigationTimingJson);
        

        this.data[url].push({
          LCP: parseFloat(largestContentfulPaint),
          domComplete: navigationTimingJson[0].domComplete,
        });
      }
    }
  }
  async close_browser() {
    await this.context.close();
    await this.browser.close();
  }

  calc_stats() {
    this.stats = [];
    Object.entries(this.data).forEach(([url, valObjs]) => {
      const point = { url };
      ["LCP", "domComplete"].forEach((k) => {
        const vals = valObjs.map((o) => o[k]);

        point[`${k} mean`] = round(getMean(vals));
        point[`${k} sd`] = round(getStandardDeviation(vals));
      });
      this.stats.push(point);
    });
    return this.stats;
  }

  async run(times=3) {
    await this.init_browser();
    await this.start_session();
    await this.main_run(times);
    await this.close_browser();
  }
}

module.exports = PlaywrightBenchmark;
