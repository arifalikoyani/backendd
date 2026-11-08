const rawChromium = require("@sparticuz/chromium");
const chromium = rawChromium.default || rawChromium;
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";

function getLocalChromePath() {
  if (process.env.NODE_ENV === "production") return "";

  const localPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  for (const p of localPaths) {
    if (fs.existsSync(p)) return p;
  }
  return "";
}

async function getBrowser() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    let executablePath;
    try {
      executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
    } catch (e) {
      console.warn("Could not download remote chromium pack, falling back to local executablePath:", e);
      executablePath = await chromium.executablePath();
    }

    return puppeteer.launch({
      args: [...(chromium.args || []), "--hide-scrollbars", "--disable-web-security"],
      executablePath,
      headless: true,
    });
  } else {
    const localPath = getLocalChromePath();
    if (!localPath) {
      throw new Error("No local Chrome or Edge installation found on this PC.");
    }
    return puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: localPath,
      headless: true,
    });
  }
}

module.exports = { getBrowser };
