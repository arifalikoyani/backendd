# PDF Generator Express Backend

A high-performance Node.js & Express PDF generation backend using Puppeteer and Sparticuz Chromium, configured for Vercel Serverless deployment.

## Endpoints

### 1. HTML to PDF
- **Endpoint:** `POST /api/htmltopdf`
- **Body:**
```json
{
  "html": "<h1>Invoice #101</h1><p>Thank you!</p>",
  "css": "h1 { color: #2563eb; }",
  "filename": "invoice.pdf"
}
```

### 2. URL to PDF
- **Endpoint:** `POST /api/urltopdf`
- **Body:**
```json
{
  "url": "https://example.com"
}
```

## Running Locally

```bash
npm install
npm start
```

Runs at `http://localhost:5000`.
