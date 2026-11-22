import puppeteer from "puppeteer-core";
import fs from "fs";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const out = process.env.SHOTS_DIR || "/opt/cursor/artifacts/taland";
const headed = process.env.HEADED === "1";
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "/usr/local/bin/google-chrome",
  headless: headed ? false : true,
  defaultViewport: headed ? null : { width: 390, height: 844, deviceScaleFactor: 2 },
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--lang=ru-RU",
    ...(headed ? ["--window-size=430,900", "--window-position=740,40"] : []),
  ],
});

const page = await browser.newPage();
if (headed) await page.setViewport({ width: 390, height: 820 });
page.setDefaultTimeout(20000);
// Эталонные кадры без баннера cookie: согласие ставим заранее.
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("taland_consent_v1", "all"); } catch {} });

async function shot(name) {
  await page.evaluate(() => {
    const style = document.getElementById("shot-style") || document.createElement("style");
    style.id = "shot-style";
    style.textContent = ".top,.admin-top,.bar{position:relative!important;top:auto!important;bottom:auto!important}";
    document.head.appendChild(style);
    return document.fonts ? document.fonts.ready : null;
  });
  await new Promise((r) => setTimeout(r, headed ? 500 : 250));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("shot", name);
}

async function go(path) {
  await page.goto(base + path, { waitUntil: "networkidle0" });
}

try {
  await go("/?utm_source=qr_auto&utm_campaign=banner");
  await page.waitForSelector(".hero__logo");
  await shot("01-home");

  await go("/sushi");
  await page.waitForSelector("[data-add=phila]");
  await shot("02-sushi");

  await go("/grill");
  await page.waitForSelector("[data-add=shaverma]");
  await shot("03-grill");

  await go("/burgers");
  await page.waitForSelector("[data-add=burger]");
  await shot("04-burgers");

  await go("/sushi");
  await page.waitForSelector("[data-add=phila]");
  await page.click("[data-add=phila]");
  await go("/grill");
  await page.waitForSelector("[data-add=shaverma]");
  await page.click("[data-add=shaverma]");

  await go("/cart");
  await page.waitForSelector("[data-testid=zone] option[value=gorelovo]");
  await page.select("[data-testid=zone]", "gorelovo");
  await page.waitForFunction(() => document.body.innerText.includes("1 219"));
  await shot("05-cart");

  await go("/checkout");
  await page.waitForSelector("[data-testid=name]");
  await page.select("[data-testid=zone]", "gorelovo");
  await page.type("[data-testid=name]", "Тест");
  await page.type("[data-testid=phone]", "+7 999 111-22-33");
  await page.type("[data-testid=address]", "проспект Тестовый, дом 2");
  await page.type("[data-testid=promo]", "TALAND10");
  await page.click("input[value=online]");
  await page.waitForFunction(() => document.body.innerText.includes("1 118"));
  await shot("06-checkout");

  await page.click("[data-testid=submit]");
  await page.waitForSelector("[data-testid=mock-pay]");
  await shot("07-payment");
  await page.click("[data-testid=mock-pay]");
  await page.waitForFunction(() => document.body.innerText.includes("На кухне"));
  await shot("07b-paid");

  await go("/account/login");
  await page.waitForSelector("[data-testid=login-phone]");
  await page.type("[data-testid=login-phone]", "+7 999 111-22-33");
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid=dev-code]");
  const code = await page.$eval("[data-testid=dev-code]", (el) => el.textContent.trim());
  await page.type("[data-testid=login-code]", code);
  await page.click("[data-testid=login-submit]");
  await page.waitForSelector("[data-testid=account-order]");
  await shot("08-account");

  await go("/admin/login");
  await page.waitForSelector("[data-testid=admin-password]");
  await page.type("[data-testid=admin-password]", "change-me");
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid=admin-order]");
  await shot("09-admin-orders");

  await go("/admin/kitchen");
  await page.waitForSelector("[data-testid=kitchen-order]");
  await shot("10-kitchen");

  await go("/admin/menu");
  await page.waitForSelector("[data-edit=phila]");
  await page.click("[data-edit=phila]");
  await page.waitForSelector("[data-testid=menu-editor]");
  await shot("11-menu-editor");

  console.log("shots done", out);
} finally {
  if (!headed) await browser.close();
  else await new Promise((r) => setTimeout(r, 800));
  if (headed) await browser.close();
}
