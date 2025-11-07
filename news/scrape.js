
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
=======
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

// 搜索关键词
const keywords = "telecom OR Ericsson OR Nokia OR Huawei OR Qualcomm OR 5G OR satellite communications";

// 去重文件路径
const seenFile = path.resolve("seen.json");

// 读取已抓取新闻ID
function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(seenFile, "utf8"));
  } catch {
    return [];
  }
}

// 保存已抓取新闻ID
function saveSeen(seen) {
  fs.writeFileSync(seenFile, JSON.stringify(seen, null, 2));
}

// 简单重试机制
async function axiosGetWithRetry(url, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retry ${i + 1} failed: ${err.message}. Waiting ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 获取新闻
async function fetchNews() {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(keywords)}&key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;
  const { data } = await axiosGetWithRetry(url);
  if (!data.items) return [];
  return data.items.map(item => ({
    id: item.link, // 用链接作为唯一ID
    title: item.title,
    link: item.link,
    snippet: item.snippet
  }));
}

// 三语摘要
async function summarizeNews(news) {
  const summaries = [];
  for (const n of news) {
    const prompt = `
Summarize this telecom news in English, Chinese, and Swedish:

Title: ${n.title}
Snippet: ${n.snippet}

Return JSON:
{
  "english": "...",
  "chinese": "...",
  "swedish": "..."
}`;
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });
      const summary = JSON.parse(res.choices[0].message.content);
      summaries.push({ ...n, ...summary });
    } catch (err) {
      console.error("Error summarizing news:", n.title, err.message);
    }
>>>>>>> 223f7df (Update scrape.js and package.json with axios and Google API)
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


// 主程序
async function main() {
  const seen = loadSeen();
  const news = await fetchNews();

  // 只保留未抓取的新闻
  const newNews = news.filter(n => !seen.includes(n.id));
  if (newNews.length === 0) {
    console.log("No new news.");
    return;
  }

  const summaries = await summarizeNews(newNews);

  // 生成 HTML
  let html = `<html><head><meta charset="UTF-8"><title>Telecom News Summary</title></head><body>`;
  html += `<h1>Telecom News Summary (Updated ${new Date().toLocaleString()})</h1>`;

  summaries.forEach(n => {
    html += `<h3><a href="${n.link}" target="_blank">${n.title}</a></h3>
<p><strong>EN:</strong> ${n.english}</p>
<p><strong>ZH:</strong> ${n.chinese}</p>
<p><strong>SV:</strong> ${n.swedish}</p><hr>`;
  });

  html += `</body></html>`;
  fs.writeFileSync("index.html", html, "utf8");
  console.log("index.html updated successfully.");

  // 更新已抓取新闻ID
  const newSeen = seen.concat(newNews.map(n => n.id));
  saveSeen(newSeen);
}

main();

