const PlaywrightBenchmark = require("./index");

const pb = new PlaywrightBenchmark({
  baseUrl: "http://localhost:3000",
  async startSession({ page }) {
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[name="email"]', "admin@foo.com");
    await page.fill('input[type="password"]', "AhGGr6rhu45");
    await page.click('button:has-text("Login")');
  },
  pages: [
    { url: "/view/authorlist", contains: "Leo Tolstoy" },
    { url: "/view/BookTabulator", contains: "Leo Tolstoy" },
  ],
});

(async () => {
  await pb.run({ ntimes: 5, concurrency: 1 });
  console.table(pb.calc_stats());
})();
