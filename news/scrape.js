import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const companies = [
    { name: "Huawei Technologies Co., Ltd.", label: "Huawei", country: "China" },
    { name: "Nokia Oyj", label: "Nokia", country: "Finland" },
    { name: "Telefonaktiebolaget LM Ericsson", label: "Ericsson", country: "Sweden" },
    { name: "Samsung Electronics Co., Ltd.", label: "Samsung", country: "South Korea" },
    { name: "ZTE Corporation", label: "ZTE", country: "China" },
    { name: "NEC Corporation", label: "NEC", country: "Japan" },
    { name: "Ciena Corporation", label: "Ciena", country: "USA" },
    { name: "Juniper Networks, Inc.", label: "Juniper", country: "USA" },
    { name: "Cisco Systems, Inc.", label: "Cisco", country: "USA" },
    { name: "Fujitsu Limited", label: "Fujitsu", country: "Japan" },
    { name: "Mavenir Systems, Inc.", label: "Mavenir", country: "USA" },
    { name: "Comba Telecom Systems Holdings Limited", label: "Comba", country: "China/HK" },
    { name: "Airspan Networks, Inc.", label: "Airspan", country: "USA" },
    { name: "Oracle Corporation", label: "Oracle", country: "USA" },
    { name: "ip.access Limited", label: "ip.access", country: "UK" }
  ];
  

async function fetchNewsForCompany(company) {
  // TODO: 替换成实际抓取逻辑
  return [
    `【模拟】${company.label} 今日宣布其 5G 网络设备将在欧洲市场投入商业使用。`,
    `【模拟】${company.label} 报告其季度收入增长，并签署新客户合同。`
  ];
}

async function summarizeMultilang(text, companyLabel) {
  const prompt = `
请基于以下内容为公司 “${companyLabel}” 生成三语摘要：
原文：
${text}

请分别用：
中文：
英文：
瑞典语：
`;
 const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "..." },
    { role: "user", content: textToSummarize }
  ]
});

async function main() {
  let htmlContent = `
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>全球移动通信公司日报</title>
<style>
body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; }
.card { background: #fff; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
h1 { text-align: center; }
h2 { margin-top: 0; }
.languages { margin-top: 10px; }
.lang { margin-bottom: 8px; }
.lang-tag { font-weight: bold; }
</style>
</head>
<body>
<h1>全球移动通信公司日报</h1>
<div id="report">
`;

  for (const company of companies) {
    const newsList = await fetchNewsForCompany(company);
    const combinedText = newsList.join("\n");
    const summary = await summarizeMultilang(combinedText, company.label);

    const summaryHTML = summary.split("\n").map(line => {
      if (line.startsWith("中文：") || line.startsWith("English：") || line.startsWith("Svenska：")) {
        const tag = line.split("：")[0];
        const content = line.slice(tag.length + 1);
        return `<div class="lang"><span class="lang-tag">${tag}：</span>${content}</div>`;
      }
      return `<div>${line}</div>`;
    }).join("");

    htmlContent += `
<div class="card">
  <h2>${company.label} (${company.country})</h2>
  <div class="languages">${summaryHTML}</div>
</div>
`;
  }

  htmlContent += `
</div>
</body>
</html>
`;

  fs.writeFileSync("index.html", htmlContent);
  console.log("index.html updated successfully.");
}

main();
