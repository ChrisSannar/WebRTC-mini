import puppeteer from "puppeteer";
import { spawn } from "child_process";

const PORT = 3006;

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

    // Capture ALL console messages including from modules
    page.on("console", (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    page.on("pageerror", (err) => {
      console.log(`[pageerror] ${err.message}`);
    });

    console.log(`Loading http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to manually call createOffer
    const result = await page.evaluate(async () => {
      try {
        // Import fresh and try
        const mod = await import("./dist/index.js");
        const peer = new mod.WebRTCPeer();
        const offer = await peer.createOffer();
        return {
          success: true,
          offerLength: offer.length,
          offerPreview: offer.substring(0, 100),
        };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log("\n=== Manual createOffer Result ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    if (browser) await browser.close();
    serve.kill();
    console.log("Server stopped");
  }
}

runTest();
