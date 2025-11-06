// --- scrape.js ---
// ✅ 使用 ESM 模块风格，确保 package.json 里写上: { "type": "module" }

import OpenAI from "openai";
import fs from "fs";
import fetch from "node-fetch";

// 初始化 OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 简单的延时函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 统一的API调用函数（自动重试机制）
async function callOpenAIWithRetry(requestFn, retries = 5, delay = 20000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429) {
        console.warn(`⚠️ Rate limit hit, waiting ${delay / 1000}s before retry... (${i + 1}/${retries})`);
        await sleep(delay);
      } else {
        console.error("❌ OpenAI API Error:", error);
        throw error;
      }
    }
  }
  throw new Error("❌ Exceeded max retries due to rate limits.");
}

// 示例：获取行业新闻（你可后续替换成真正数据源）
async function fetchNews() {
  const urls = [
    "https://www.ericsson.com/en/press-releases",
    "https://www.nokia.com/about-us/news/releases/",
    "https://www.samsung.com/global/business/networks/insights/news/",
    "https://www.huawei.com/en/news/",
  ];

  let allText = "";
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const html = await res.text();
      allText += `\n### ${url}\n` + html.slice(0, 2000); // 只取部分以防太长
      await sleep(3000); // 避免请求太快
    } catch (err) {
      console.warn(`⚠️ Failed to fetch ${url}: ${err.message}`);
    }
  }
  return allText;
}

// 多语言总结
async function summarizeMultilang(content) {
  const prompt = `
Summarize the following telecom industry updates into three short summaries:
1. English version
2. Chinese version
3. Swedish version

Focus on key business and technology points.
Text:
${content.slice(0, 4000)}
`;

  const response = await callOpenAIWithRetry(() =>
    client.chat.completions.create({
      model: "gpt-4.1-mini", // 或换成 "gpt-3.5-turbo" 避免限流
      messages: [{ role: "user", content: prompt }],
    })
  );

  return response.choices[0].message.content;
}

// 主函数
async function main() {
  console.log("🚀 Starting telecom industry news scraper...");
  const newsContent = await fetchNews();
  console.log("📰 News fetched. Summarizing...");

  const summary = await summarizeMultilang(newsContent);
  console.log("✅ Summary generated!");

  const html = `
  <html lang="en">
    <head><meta charset="UTF-8"><title>Telecom Daily Summary</title></head>
    <body>
      <h1>🌍 Daily Telecom Summary</h1>
      <pre>${summary}</pre>
    </body>
  </html>`;

  fs.writeFileSync("index.html", html);
  console.log("💾 Saved summary to index.html");
}

main().catch((err) => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
