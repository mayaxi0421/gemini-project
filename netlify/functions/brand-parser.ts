// netlify/functions/brand-parser.ts
export const handler = async (event: any) => {
  try {
    const { urls } = JSON.parse(event.body || '{}');
    if (!urls || urls.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL不能为空" }),
        headers: { 'Access-Control-Allow-Origin': '*' }
      };
    }

    // 模拟识别逻辑（输入啥URL都能返回结果）
    const results = urls.map((url: string, i: number) => ({
      url: url,
      name: `品牌${i+1}` // 比如输入3个URL，返回品牌1/品牌2/品牌3
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(results),
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
