import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3004;

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

    console.log(`Loading http://localhost:${PORT}...`);

    // Inject a script to catch module errors
    await page.evaluateOnNewDocument(() => {
      window.addEventListener("error", (e) => {
        console.error("Module error:", e.message, e.filename);
      });
      window.addEventListener("unhandledrejection", (e) => {
        console.error("Unhandled rejection:", e.reason);
      });
    });

    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });

    // Wait for modules to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to import and catch the error
    const result = await page.evaluate(async () => {
      try {
        const mod = await import("./dist/index.js");
        return {
          success: true,
          hasWebRTCPeer: typeof mod.WebRTCPeer !== "undefined",
        };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log("\n=== Module Import Result ===");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n=== Console Messages ===");
    for (const msg of consoleMessages) {
      console.log(`[${msg.type}] ${msg.text}`);
    }

    console.log("\n=== Page Errors ===");
    for (const err of errors) {
      console.log(`ERROR: ${err}`);
    }

    if (result.success && result.hasWebRTCPeer) {
      console.log("\n✓ SUCCESS: Module loaded!");
    } else {
      console.log("\n✗ FAILED");
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
