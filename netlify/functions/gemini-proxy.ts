// netlify/functions/gemini-proxy.ts
import { GoogleGenAI, Type } from '@google/genai';

export const handler = async (event: any) => {
  try {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "API Key 未配置" }),
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      };
    }

    let urls: string[] = [];
    try {
      const body = JSON.parse(event.body || '{}');
      urls = body.urls || [];
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: "参数错误" }) };
    }

    if (!urls || urls.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "URL 不能为空" }) };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // 🔥 核心修复：删掉所有版本号，只用最原始的 gemini-pro
    const prompt = `
Identify the brand name for each website URL.
Return ONLY a valid JSON array with 'url' and 'name' fields. No extra text.
URLs: ${urls.join(', ')}
    `.trim();

    // 🔥 这里只写 model: "gemini-pro"，不要写任何版本号
    const response = await ai.models.generateContent({
      model: "gemini-pro", // 👈 这是你当前环境唯一能识别的模型
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              name: { type: Type.STRING }
            },
            required: ["url", "name"]
          }
        }
      }
    });

    const cleanText = (response.text || '[]').replace(/^```json\n?/g, '').replace(/```\n?$/g, '');
    return {
      statusCode: 200,
      body: cleanText,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    };

  } catch (e: any) {
    console.error("Proxy error:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
