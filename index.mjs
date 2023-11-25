import playwright from "playwright";
import { setTimeout as sleep } from "node:timers/promises";

class Scrapbox {
  baseUrl = "https://scrapbox.io/";

  constructor(projectName) {
    this.projectName = projectName;
  }

  async pages() {
    const url = new URL(`/api/pages/${this.projectName}`, this.baseUrl);
    url.searchParams.set("sort", "created");
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.limit < json.count) {
      throw new Error(`limit over: limit=${json.limit}, count=${json.count}`);
    }

    return json;
  }

  url(title) {
    const url = new URL(
      `${this.projectName}/${title}`,
      this.baseUrl
    ).toString();
    return url;
  }
}

const main = async () => {
  const [, , projectName] = process.argv;
  if (!projectName) {
    throw new Error("projectName is required");
  }

  const scrapbox = new Scrapbox(projectName);
  const { pages } = await scrapbox.pages();

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let _pages = pages.slice(0, 10);
  for (const { title } of _pages) {
    console.log(title);
    const url = scrapbox.url(title);
    await page.goto(url);
    await page.waitForSelector(".line", { state: "attached" });
    await page.waitForLoadState("networkidle");
    await page.pdf({ format: "A4", path: `${title}.pdf` });
    await sleep(500);
  }

  await page.close();
  await browser.close();
};

main();
