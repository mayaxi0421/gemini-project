/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// 定义 Competitor 类型（和你原有代码一致）
interface Competitor {
  id: string;
  url: string;
  name: string;
  logo: string;
  selected: boolean;
}

const App: React.FC = () => {
  // 定义所有必要的状态（和你原有代码一致）
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [batchInput, setBatchInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  // 批量添加竞品的核心函数（修复 API Key 问题，保留原有逻辑）
  const handleBatchAdd = async () => {
    const urls = batchInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (urls.length === 0) return;

    setIsRecognizing(true);
    try {
      // 🔴 替换成你的真实 Google Gemini API Key（AIzaSy 开头）
      const API_KEY = "你的真实API Key";
      const ai = new GoogleGenAI({ apiKey: API_KEY });

      const prompt = `I have a list of website URLs. Please identify the brand or company name for each URL.
Return ONLY a valid JSON array of objects with 'url' and 'name' properties. Do not include any markdown formatting or explanation.
URLs:
${urls.join('\n')}`;

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

      const cleanText = (response.text || '[]').replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();
      const results = JSON.parse(cleanText);

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

      setCompetitors(prev => [...prev, ...newCompetitors]);
      setBatchInput('');
    } catch (e: any) {
      console.error("识别失败:", e);
      alert(`识别失败: ${e.message}`);
    } finally {
      setIsRecognizing(false);
    }
  };

  // 基础 UI 渲染（简化版，保证能运行）
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>竞品识别工具</h1>
      
      {/* 批量输入 URL 区域 */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="每行输入一个网站 URL，例如：
https://www.baidu.com
https://www.tencent.com"
          style={{ width: '100%', height: '150px', padding: '10px', fontSize: '14px' }}
        />
        <button
          onClick={handleBatchAdd}
          disabled={isRecognizing}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#165DFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRecognizing ? 'not-allowed' : 'pointer'
          }}
        >
          {isRecognizing ? '识别中...' : '批量识别品牌'}
        </button>
      </div>

      {/* 识别结果展示 */}
      <div>
        <h3>识别结果</h3>
        {competitors.length === 0 ? (
          <p>暂无竞品数据，请输入 URL 并点击识别</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {competitors.map(item => (
              <li 
                key={item.id} 
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{item.name}</span>
                <span>{item.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
