import pkg from "/home/claude/.npm-global/lib/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "node:fs";

const OUT = "/mnt/user-data/outputs";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Login
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "kay@autobedrijfwolters.nl");
await page.fill("#password", "demo1234");
await page.screenshot({ path: `${OUT}/occapilot-01-login.png` });
await page.click("button[type=submit], button:not([type])");
await page.waitForURL("**/leads");
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/occapilot-02-leadoverzicht.png`, fullPage: true });

// Lead detail: escalatie lead (Mark Jansen)
const markLink = page.locator("table.leads tbody tr", { hasText: "Mark Jansen" }).locator("a").first();
await markLink.click();
await page.waitForURL(/\/leads\/\d+/);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/occapilot-03-lead-escalatie.png`, fullPage: true });

// Lead detail: afspraak-lead (Ahmed)
await page.goto("http://localhost:3000/leads", { waitUntil: "networkidle" });
const afspraakLink = page.locator("table.leads tbody tr", { hasText: "Ahmed" }).locator("a").first();
await afspraakLink.click();
await page.waitForURL(/\/leads\/\d+/);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/occapilot-04-lead-afspraak.png`, fullPage: true });

// Instellingen
await page.goto("http://localhost:3000/instellingen", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/occapilot-05-instellingen.png`, fullPage: true });

await browser.close();
console.log("done");
