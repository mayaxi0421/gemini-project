// netlify/functions/gemini-proxy.ts
import { GoogleGenAI, Type } from '@google/genai';

export const handler = async (event: any) => {
  try {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "API Key 未配置，请在 Netlify 中设置 VITE_GEMINI_API_KEY 环境变量" }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      };
    }

    let urls: string[] = [];
    try {
      const requestBody = JSON.parse(event.body || '{}');
      urls = requestBody.urls || [];
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "请求参数格式错误，必须是合法的 JSON" }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      };
    }

    if (!urls || urls.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL 列表不能为空，请至少输入一个 URL" }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      };
    }

    // 旧版 SDK 调用方式（兼容你当前版本）
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `
I have a list of website URLs. Please identify the brand or company name for each URL.
Return ONLY a valid JSON array of objects with 'url' and 'name' properties.
Do NOT include any markdown, explanations, or extra text.

URLs:
${urls.join('\n')}
    `.trim();

    // 旧版 SDK 用 ai.models.generateContent 直接调用
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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

    const generatedText = response.text || '[]';
    const cleanText = generatedText.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();
    const results = JSON.parse(cleanText);

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };

  } catch (e: any) {
    console.error("Gemini 代理接口异常:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `API 调用失败：${e.message || '未知错误'}` }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };
  }
};
