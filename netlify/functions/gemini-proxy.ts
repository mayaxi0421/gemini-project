// netlify/functions/gemini-proxy.ts
// 服务端代理调用 Gemini API，避免前端直接暴露 API Key
import { GoogleGenAI, Type } from '@google/genai';

// Netlify Function 核心处理函数
export const handler = async (event: any) => {
  try {
    // 1. 从 Netlify 服务端环境变量读取 API Key（前端无法访问）
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "API Key 未配置，请在 Netlify 中设置 VITE_GEMINI_API_KEY 环境变量" }),
        headers: {
          'Access-Control-Allow-Origin': '*', // 解决跨域问题
          'Content-Type': 'application/json'
        }
      };
    }

    // 2. 解析前端传递的 URL 列表参数
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

    // 3. 校验 URL 参数是否为空
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

    // 4. 初始化 Gemini API 并调用（服务端调用，安全无泄露）
    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // 稳定版模型，避免预览版兼容问题

    // 构建提示词，确保返回纯 JSON 格式
    const prompt = `
I have a list of website URLs. Please identify the brand or company name for each URL.
Requirements:
1. Return ONLY a valid JSON array of objects with 'url' and 'name' properties.
2. Do NOT include any markdown, explanations, or extra text.
3. Keep the original URL in the 'url' field (do not modify it).
4. Use the official brand name in the 'name' field (e.g., "百度" for https://www.baidu.com).

URLs:
${urls.join('\n')}
    `.trim();

    // 调用 Gemini API 生成内容
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // 低随机性，保证结果稳定
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // 指定返回 JSON 格式
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING, description: "Original website URL" },
              name: { type: Type.STRING, description: "Recognized brand/company name" }
            },
            required: ["url", "name"]
          }
        }
      }
    });

    // 5. 解析并返回结果
    const generatedText = response.response.text() || '[]';
    // 清理可能的多余格式（比如 markdown 代码块）
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
    // 捕获所有异常并返回友好提示
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
