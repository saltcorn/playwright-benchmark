playwright-benchmark
====================

Benchmark or load test a web application using a real browser environment. 

### Example

```javascript
const PlaywrightBenchmark = require("@saltcorn/playwright-benchmark");

const pb = new PlaywrightBenchmark({
  // (optional) baseUrl will be added to all urls in pages
  baseUrl: "http://localhost:3000",
  // use startSession to acquire a login session/cookie
  async startSession({ page }) {
    // note that baseUrl is not added here
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[name="email"]', "admin@foo.com");
    await page.fill('input[type="password"]', "AhGGr6rhu45");
    await page.click('button:has-text("Login")');
  },
  // the pages we will benchmark.
  pages: [
    {
      // the URL. baseUrl will be added
      url: "/view/authorlist",
      // the page need to contain this string (and status 200) to be considered load
      contains: "Leo Tolstoy",
      // timeout in ms. optional, default 30000
      timeout: 60000,
    },
    { url: "/view/BookTabulator", contains: "Leo Tolstoy" },
  ],
});

// run the test
(async () => {
  await pb.run({
    // how many times to visit each page per thread
    ntimes: 5,
    // number of concurrent threads
    concurrency: 1,
  });
  //print the results
  console.table(pb.calc_stats());
  //print the on-page errors
  console.log(pb.url_errors);
})();

```