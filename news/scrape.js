import axios from "axios";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// 🚀 配置
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 通信行业巨头公司列表
const COMPANIES = [
  "Ericsson", "Huawei", "Nokia", "Samsung", "Fujitsu", "ZTE", "Qualcomm", "Cisco"
];

// 搜索新闻函数
async function searchNews(query) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;
  const res = await axios.get(url);
  return res.data.items || [];
}

// 用 OpenAI 生成摘要
async function summarizeMultilang(newsItems) {
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const content = newsItems.map(item => `${item.title}\n${item.snippet}\n${item.link}`).join("\n\n");

  const prompt = `
  Please summarize the following telecom news in three languages (English, Chinese, Swedish).
  Focus on technology, business strategy, and partnerships.
  News content:
  ${content}
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

async function main() {
  let allNews = [];

  for (const company of COMPANIES) {
    try {
      const news = await searchNews(company);
      allNews.push(...news);
    } catch (err) {
      console.error(`Failed to fetch news for ${company}:`, err.message);
    }
  }

  const summary = await summarizeMultilang(allNews);

  // 写入 HTML 文件
  const html = `
  <html>
    <head><meta charset="UTF-8"><title>Telecom News Summary</title></head>
    <body>
      <h1>Telecom News Summary</h1>
      <pre>${summary}</pre>
    </body>
  </html>
  `;

  const filePath = path.join(process.cwd(), "index.html");
  fs.writeFileSync(filePath, html);
  console.log("Summary saved to index.html");
}

main().catch(err => console.error(err));
