// netlify/functions/gemini-proxy.ts
export const handler = async (event: any) => {
  try {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("API Key 未配置");

    const { urls } = JSON.parse(event.body || '{}');
    if (!urls || urls.length === 0) throw new Error("URL 不能为空");

    // 🔥 极简提示词：直接告诉模型输出 JSON 数组，不用配置复杂参数
    const prompt = `
请识别以下每个网址对应的品牌名称，输出格式必须是严格的 JSON 数组，包含 "url" 和 "name" 两个字段。
不要输出代码块（不要写 ```json），不要输出任何解释性文字，直接输出 JSON 数据。
URL 列表：${urls.join(', ')}
    `.trim();

    // 🔥 最原始的 fetch 调用，去掉所有不兼容的 responseMimeType 配置
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "API 请求失败");
    }

    const data = await res.json();
    let resultText = data.candidates[0].content.parts[0].text || "[]";
    
    // 稍微清理一下格式
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return {
      statusCode: 200,
      body: resultText,
      headers: { 'Access-Control-Allow-Origin': '*' }
    };

  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
      headers: { 'Access-Control-Allow-Origin': '*' }
    };
  }
};
