import axios from "axios";
import fs from "fs";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// 关键词列表
const keywords = [
  "telecom", "5G", "Ericsson", "Huawei", "Nokia", 
  "Samsung", "Fujitsu", "ZTE", "mobile network"
];

// 抓取新闻
async function fetchNews() {
  const q = keywords.join(" OR ");
  const res = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${NEWSAPI_KEY}`);
  return res.data.articles.map(a => ({
    title: a.title,
    description: a.description || "",
    url: a.url,
    publishedAt: a.publishedAt
  }));
}

// 生成三语摘要
async function summarizeMultilang(newsItems) {
  const summaries = [];
  for (const item of newsItems) {
    const prompt = `
Summarize this news in English, Chinese, and Swedish.
Focus on technology, business strategy, and partnerships.

Title: ${item.title}
Description: ${item.description}
Link: ${item.url}
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });
    summaries.push({
      title: item.title,
      url: item.url,
      summary: completion.choices[0].message.content
    });
  }
  return summaries;
}

// 生成 HTML 页面
async function main() {
  const newsItems = await fetchNews();
  const summaries = await summarizeMultilang(newsItems);
  const updateTime = new Date().toLocaleString();

  const html = `
<html>
<head>
<meta charset="UTF-8">
<title>Daily Telecom News</title>
<meta http-equiv="refresh" content="1800"> <!-- 每30分钟刷新 -->
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
h1 { color: #2E86C1; }
.news-item { margin-bottom: 20px; }
.news-item a { text-decoration: none; color: #1B4F72; }
.news-item a:hover { text-decoration: underline; }
.update-time { font-size: 0.9em; color: gray; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>Daily Telecom News Summary</h1>
<div class="update-time">Last updated: ${updateTime}</div>
${summaries.map(s => `
<div class="news-item">
<h2><a href="${s.url}" target="_blank">${s.title}</a></h2>
<p>${s.summary}</p>
</div>`).join("\n")}
</body>
</html>
`;

  fs.writeFileSync("index.html", html);
  console.log("Daily summary generated: index.html");
}

main().catch(console.error);

