// netlify/functions/gemini-proxy.ts
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

    const prompt = `
I have a list of website URLs. Please identify the brand or company name for each URL.
Return ONLY a valid JSON array of objects with 'url' and 'name' properties.
Do NOT include any markdown, explanations, or extra text.

URLs:
${urls.join('\n')}
    `.trim();

    // 🔥 彻底绕开 SDK，直接用原生 fetch 调用 Gemini REST API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.json();
      throw new Error(errData.error?.message || `Gemini API 请求失败（状态码：${geminiResponse.status}）`);
    }

    const data = await geminiResponse.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
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
