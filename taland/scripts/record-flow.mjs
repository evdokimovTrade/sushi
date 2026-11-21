import puppeteer from "puppeteer-core";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: false,
  defaultViewport: { width: 1024, height: 768 },
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--kiosk",
    "--window-position=0,0",
    "--window-size=1024,768",
    "--lang=ru-RU",
  ],
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);

try {
  await page.goto(base + "/?utm_source=qr_auto&utm_campaign=banner", { waitUntil: "networkidle0" });
  await pause(1400);
  await page.click("a.nav-link[href='/sushi']");
  await page.waitForSelector("[data-add=phila]");
  await pause(900);
  await page.click("[data-add=phila]");
  await pause(900);
  await page.click("a.nav-link[href='/grill']");
  await page.waitForSelector("[data-add=shaverma]");
  await pause(900);
  await page.click("[data-add=shaverma]");
  await pause(800);
  await page.goto(base + "/checkout", { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-testid=zone] option[value=gorelovo]");
  await page.select("[data-testid=zone]", "gorelovo");
  await page.type("[data-testid=name]", "Тест", { delay: 50 });
  await page.type("[data-testid=phone]", "+7 999 222-33-44", { delay: 35 });
  await page.type("[data-testid=address]", "улица Записи, дом 3", { delay: 25 });
  await page.type("[data-testid=promo]", "TALAND10", { delay: 40 });
  await page.click("input[value=online]");
  await pause(1200);
  await page.click("[data-testid=submit]");
  await page.waitForSelector("[data-testid=mock-pay]");
  await pause(1400);
  await page.click("[data-testid=mock-pay]");
  await page.waitForFunction(() => document.body.innerText.includes("На кухне"));
  await pause(1600);

  await page.goto(base + "/account/login", { waitUntil: "networkidle0" });
  await page.type("[data-testid=login-phone]", "+7 999 222-33-44", { delay: 30 });
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid=dev-code]");
  await pause(800);
  const code = await page.$eval("[data-testid=dev-code]", (el) => el.textContent.trim());
  await page.type("[data-testid=login-code]", code, { delay: 80 });
  await page.click("[data-testid=login-submit]");
  await page.waitForSelector("[data-testid=account-order]");
  await pause(1600);

  await page.goto(base + "/admin/login", { waitUntil: "networkidle0" });
  await page.type("[data-testid=admin-password]", "change-me", { delay: 40 });
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid=admin-order]");
  await pause(1600);
  await page.goto(base + "/admin/kitchen", { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-testid=kitchen-order]");
  await pause(1800);
} finally {
  await browser.close();
}
