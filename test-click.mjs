import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3008;

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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-fake-ui-for-media-stream",
      ],
    });

    const page = await browser.newPage();

    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    page.on("pageerror", (err) => {
      console.log(`PAGE ERROR: ${err.message}`);
    });

    console.log(`Loading http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Click the generate offer button
    console.log("Clicking generate-offer button...");
    await page.click("#generate-offer");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get what's in the local token
    const tokenValue = await page.evaluate(() => {
      const el = document.getElementById("local-token");
      return el ? el.value : "Element not found";
    });

    console.log("\n=== Token after click ===");
    console.log(
      tokenValue
        ? `${tokenValue.substring(0, 100)}... (${tokenValue.length} chars)`
        : "EMPTY",
    );

    console.log("\n=== Console messages ===");
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
