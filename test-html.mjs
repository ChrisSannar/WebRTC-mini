import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3005;

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
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    const errors = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    console.log(`Loading http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if the page has the WebRTCPeer available in its module scope
    const result = await page.evaluate(() => {
      // Access the module's exports through the script
      const scripts = document.querySelectorAll('script[type="module"]');
      return {
        moduleCount: scripts.length,
        hasWebRTCInWindow: typeof window.WebRTCPeer !== "undefined",
      };
    });

    console.log("\n=== Page State ===");
    console.log("Module scripts:", result.moduleCount);
    console.log("WebRTCPeer in window:", result.hasWebRTCInWindow);

    // Try clicking the generate offer button
    const clickResult = await page.evaluate(() => {
      const btn = document.getElementById("generate-offer");
      if (!btn) return { success: false, error: "Button not found" };

      btn.click();
      return { success: true };
    });

    console.log("\n=== Button Click ===");
    console.log(clickResult);

    // Get the token value
    const tokenValue = await page.evaluate(() => {
      return document.getElementById("local-token")?.value || "";
    });

    console.log("\n=== Token Value ===");
    console.log(
      tokenValue
        ? `Generated: ${tokenValue.substring(0, 50)}...`
        : "EMPTY - Token not generated",
    );

    console.log("\n=== Console Messages ===");
    for (const msg of consoleMessages) {
      console.log(`[${msg.type}] ${msg.text}`);
    }

    console.log("\n=== Page Errors ===");
    for (const err of errors) {
      console.log(`ERROR: ${err}`);
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
