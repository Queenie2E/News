// --- scrape.js ---
// ✅ Make sure your package.json has: { "type": "module" }

import OpenAI from "openai";
import fs from "fs";
import fetch from "node-fetch";

// --- CONFIG ---
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const COMPANIES = [
  {
    name: "Ericsson",
    url: "https://www.ericsson.com/en/press-releases",
  },
  {
    name: "Nokia",
    url: "https://www.nokia.com/about-us/news/releases/",
  },
  {
    name: "Samsung Networks",
    url: "https://www.samsung.com/global/business/networks/insights/news/",
  },
  {
    name: "Huawei",
    url: "https://www.huawei.com/en/news/",
  },
];

// --- HELPERS ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Automatic retry wrapper for OpenAI rate limits
async function callOpenAIWithRetry(requestFn, retries = 5, delay = 20000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429) {
        console.warn(`⚠️ Rate limit reached. Waiting ${delay / 1000}s before retry... (${i + 1}/${retries})`);
        await sleep(delay);
      } else {
        console.error("❌ OpenAI API Error:", error);
        throw error;
      }
    }
  }
  throw new Error("❌ Exceeded max retries due to rate limits.");
}

// --- SCRAPER ---
async function fetchCompanyNews(company) {
  console.log(`📰 Fetching news from ${company.name}...`);
  try {
    const res = await fetch(company.url);
    const html = await res.text();
    return html.slice(0, 3000); // Keep it short enough for summarization
  } catch (err) {
    console.warn(`⚠️ Failed to fetch ${company.name}: ${err.message}`);
    return "";
  }
}

// --- SUMMARIZER ---
async function summarizeNews(company, content) {
  if (!content) return "No content available.";

  const prompt = `
You are a multilingual telecom industry analyst.

Summarize the following latest press releases from ${company.name} in three languages:

1. 🇬🇧 English summary (short and factual)
2. 🇨🇳 Chinese summary (简洁专业)
3. 🇸🇪 Swedish summary (kortfattad och tydlig)

Focus on technology, business strategy, and partnership highlights.
Text:
${content}
`;

  const response = await callOpenAIWithRetry(() =>
    client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    })
  );

  return response.choices[0].message.content;
}

// --- MAIN ---
async function main() {
  console.log("🚀 Starting multi-company telecom scraper...");

  const summaries = [];

  for (const company of COMPANIES) {
    const content = await fetchCompanyNews(company);
    console.log(`💬 Summarizing ${company.name}...`);
    const summary = await summarizeNews(company, content);
    summaries.push({ company: company.name, summary });
    await sleep(5000); // gentle delay between API calls
  }

  // --- GENERATE HTML ---
  const htmlContent = `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Telecom Daily Summary</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; background: #fafafa; color: #333; }
      h1 { color: #004080; }
      .company { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
      pre { white-space: pre-wrap; font-size: 0.95em; }
    </style>
  </head>
  <body>
    <h1>🌍 Daily Telecom Industry Summary</h1>
    ${summaries
      .map(
        (s) => `
        <div class="company">
          <h2>${s.company}</h2>
          <pre>${s.summary}</pre>
        </div>`
      )
      .join("")}
  </body>
  </html>
  `;

  fs.writeFileSync("index.html", htmlContent);
  console.log("✅ Saved multilingual summaries to index.html");
}

// --- RUN ---
main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
