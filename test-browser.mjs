import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3002;

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

    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    const errors = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    const failedRequests = [];
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure(),
      });
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    console.log(`Loading http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });

    console.log("\n=== Console Messages ===");
    for (const msg of consoleMessages) {
      console.log(`[${msg.type}] ${msg.text}`);
    }

    console.log("\n=== Page Errors ===");
    if (errors.length === 0) {
      console.log("No page errors!");
    } else {
      for (const err of errors) {
        console.log(`ERROR: ${err}`);
      }
    }

    console.log("\n=== Failed Requests ===");
    if (failedRequests.length === 0) {
      console.log("No failed requests!");
    } else {
      for (const req of failedRequests) {
        console.log(
          `FAILED: ${req.url} - ${req.status || req.failure?.errorText}`,
        );
      }
    }

    console.log("\n=== Test Result ===");
    if (
      errors.length === 0 &&
      !consoleMessages.some((m) => m.type === "error")
    ) {
      console.log("SUCCESS: Page loaded without errors");
    } else {
      console.log("FAILED: Errors detected");
    }

    // Take screenshot
    await page.screenshot({ path: "test-screenshot.png" });
    console.log("\nScreenshot saved to test-screenshot.png");
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    if (browser) await browser.close();
    serve.kill();
    console.log("Server stopped");
  }
}

runTest();
