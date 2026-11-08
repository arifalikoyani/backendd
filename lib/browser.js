const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

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
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
    return puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
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
