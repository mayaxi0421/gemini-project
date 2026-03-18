// .netlify/functions/brand-parser.ts
/**
 * Netlify 函数：品牌名称解析器（解决跨域/模型权限问题）
 * 直接部署即可使用，无需修改任何配置
 */
export const handler = async (event: any) => {
  try {
    // 1. 获取请求参数（兼容 GET/POST 请求）
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const urlList = requestBody.urls || [];

    if (!urlList || urlList.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL 列表不能为空" }),
        headers: { 'Access-Control-Allow-Origin': '*' }
      };
    }

    // 2. 核心逻辑：批量解析品牌名称（模拟真实业务逻辑）
    const resultList = urlList.map((url: string, index: number) => {
      // 这里可以替换成你的真实解析逻辑（比如调用 AI 模型/数据库查询）
      return {
        url: url,
        brandName: `品牌${index + 1}`, // 模拟返回品牌名称
        source: "Netlify 函数解析"
      };
    });

    // 3. 返回结果（跨域已配置，直接访问）
    return {
      statusCode: 200,
      body: JSON.stringify({
        code: 200,
        message: "解析成功",
        data: resultList
      }),
      headers: {
        'Access-Control-Allow-Origin': '*', // 解决跨域问题
        'Content-Type': 'application/json'
      }
    };

  } catch (error: any) {
    // 异常捕获（返回友好提示）
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "解析失败",
        detail: error.message
      }),
      headers: { 'Access-Control-Allow-Origin': '*' }
    };
  }
};
