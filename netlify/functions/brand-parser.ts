// netlify/functions/brand-parser.ts
export const handler = async (event: any) => {
  try {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("API Key 未配置");

    const { urls } = JSON.parse(event.body || '{}');
    if (!urls || urls.length === 0) throw new Error("URL 不能为空");

    const prompt = `Identify the brand name for each URL. Return only a JSON array with "url" and "name" fields. URLs: ${urls.join(', ')}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "API 请求失败");
    }

    const data = await res.json();
    let resultText = data.candidates[0].content.parts[0].text || "[]";
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
