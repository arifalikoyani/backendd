const { getBrowser } = require("../lib/browser");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
  }

  let browser;
  let page;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { url, format = "A4", landscape = false } = body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "A valid 'url' is required" });
    }

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ success: false, message: "URL must start with http:// or https://" });
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid URL format provided" });
    }

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    let filename = "page.pdf";
    try {
      const host = new URL(url).hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
      filename = `${host}.pdf`;
    } catch {}

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("URL to PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF from URL";
    return res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
};

