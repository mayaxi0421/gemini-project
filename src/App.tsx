import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// 定义 Competitor 类型
interface Competitor {
  id: string;
  url: string;
  name: string;
  logo: string;
  selected: boolean;
}

const App: React.FC = () => {
  // 核心状态管理
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [batchInput, setBatchInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  // 批量识别品牌核心函数（读取 Netlify 环境变量，安全无泄露）
  const handleBatchAdd = async () => {
    const urls = batchInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (urls.length === 0) return;

    setIsRecognizing(true);
    try {
      // 读取 Netlify 配置的环境变量（安全方式，无泄露风险）
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      // 校验 API Key 是否存在
      if (!API_KEY) {
        throw new Error("API Key 未配置，请在 Netlify 中设置 VITE_GEMINI_API_KEY 环境变量");
      }

      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = `I have a list of website URLs. Please identify the brand or company name for each URL.
Return ONLY a valid JSON array of objects with 'url' and 'name' properties. Do not include any markdown formatting or explanation.
URLs:
${urls.join('\n')}`;

      // 调用 Gemini API 生成内容
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: "The original URL" },
                name: { type: Type.STRING, description: "The recognized brand or company name" }
              },
              required: ["url", "name"]
            }
          }
        }
      });

      // 解析返回结果
      const cleanText = (response.text || '[]').replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();
      const results = JSON.parse(cleanText);

      // 格式化竞品数据
      const newCompetitors: Competitor[] = results.map((r: any) => {
        let formattedUrl = r.url;
        if (!formattedUrl.startsWith('http')) {
          formattedUrl = `https://${formattedUrl}`;
        }
        return {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          url: formattedUrl,
          name: r.name,
          logo: '',
          selected: false
        };
      });

      // 更新竞品列表
      setCompetitors(prev => [...prev, ...newCompetitors]);
      setBatchInput('');
    } catch (e: any) {
      console.error("识别失败详情:", e);
      alert(`识别失败: ${e.message}\n请检查 API Key 是否有效或网络是否正常`);
    } finally {
      setIsRecognizing(false);
    }
  };

  // 页面渲染
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#165DFF', textAlign: 'center' }}>竞品品牌识别工具</h1>
      
      {/* 批量输入区域 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          批量输入 URL（每行一个）：
        </label>
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="示例：
https://www.baidu.com
https://www.taobao.com
https://www.tencent.com"
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical'
          }}
        />
        <button
          onClick={handleBatchAdd}
          disabled={isRecognizing}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: isRecognizing ? '#999' : '#165DFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRecognizing ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isRecognizing ? '识别中...' : '批量识别品牌'}
        </button>
      </div>

      {/* 识别结果展示 */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3 style={{ color: '#333' }}>识别结果</h3>
        {competitors.length === 0 ? (
          <p style={{ color: '#666' }}>暂无竞品数据，请输入 URL 并点击识别</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {competitors.map(item => (
              <li 
                key={item.id} 
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: '500', color: '#333' }}>{item.name}</span>
                <span style={{ color: '#666', fontSize: '13px' }}>{item.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
