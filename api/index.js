const express = require("express");
const cors = require("cors");
const { getBrowser } = require("../lib/browser");

const app = express();

// Enable CORS and expose Content-Disposition header
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Disposition"],
  })
);

// Parse JSON body up to 20MB for large HTML payloads
app.use(express.json({ limit: "20mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "PDF Generator API is running!",
    endpoints: ["POST /api/htmltopdf", "POST /api/urltopdf"],
  });
});

// Endpoint 1: HTML to PDF
app.post("/api/htmltopdf", async (req, res) => {
  let browser;
  let page;
  try {
    const { html, css, js, filename, format = "A4", landscape = false } = req.body;

    if (!html) {
      return res
        .status(400)
        .json({ success: false, message: "HTML content is required" });
    }

    const pdfFilename =
      filename && filename.endsWith(".pdf") ? filename : "document.pdf";

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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfFilename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("HTML to PDF error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "PDF generation failed";
    return res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
});

// Endpoint 2: URL to PDF
app.post("/api/urltopdf", async (req, res) => {
  let browser;
  let page;
  try {
    const { url, format = "A4", landscape = false } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid 'url' is required",
      });
    }

    // Validate URL protocol
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "URL must start with http:// or https://",
        });
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format provided",
      });
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("URL to PDF error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate PDF from URL";
    return res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
});

// Local dev server listener
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`Backend server running on http://localhost:${PORT}`)
  );
}

// Export for Vercel Serverless
module.exports = app;
