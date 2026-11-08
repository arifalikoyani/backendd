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
    const { html, css, js, filename, format = "A4", landscape = false } = body;

    if (!html) {
      return res.status(400).json({ success: false, message: "HTML content is required" });
    }

    const pdfFilename = filename && filename.endsWith(".pdf") ? filename : "document.pdf";

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${css ? `<style>${css}</style>` : ""}
      </head>
      <body>
        ${html}
        ${js ? `<script>${js}</script>` : ""}
      </body>
      </html>`;

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });

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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfFilename}"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("HTML to PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "PDF generation failed";
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

