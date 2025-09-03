const PlaywrightBenchmark = require("./index");

const pb = new PlaywrightBenchmark({
  async startSession({ page }) {
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[name="email"]', "admin@foo.com");
    await page.fill('input[type="password"]', "AhGGr6rhu45");
    await page.click('button:has-text("Login")');
  },
  pages: [
    { url: "http://localhost:3000/view/authorlist" },
    { url: "http://localhost:3000/view/BookTabulator" },
  ],
});

(async () => {
  await pb.run(20);
  console.table(pb.calc_stats());
})();
