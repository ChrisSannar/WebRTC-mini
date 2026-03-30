import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3007;

async function runTest() {
  console.log("Starting serve...");
  const serve = spawn("npx", ["serve", "apps/example", "-l", String(PORT)], {
    stdio: "pipe",
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Intercept requests to see what's happening
    page.on("request", (req) => {
      if (req.url().includes("dist")) {
        console.log(`REQUEST: ${req.url()}`);
      }
    });

    page.on("response", (res) => {
      if (res.url().includes("dist")) {
        console.log(`RESPONSE: ${res.url()} - ${res.status()}`);
      }
    });

    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    page.on("pageerror", (err) => {
      console.log(`PAGE ERROR: ${err.message}`);
    });

    console.log(`Loading http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get what's in the local token
    const tokenValue = await page.evaluate(() => {
      const el = document.getElementById("local-token");
      return el ? el.value : "Element not found";
    });

    console.log("\n=== Token after page load ===");
    console.log(tokenValue);

    console.log("\n=== All console messages ===");
    for (const msg of consoleMessages) {
      console.log(`[${msg.type}] ${msg.text}`);
    }
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    if (browser) await browser.close();
    serve.kill();
    console.log("Server stopped");
  }
}

runTest();
