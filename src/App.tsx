import React, { useState } from 'react';

// 定义竞品类型接口（保证 TypeScript 类型安全）
interface Competitor {
  id: string;
  url: string;
  name: string;
  logo: string;
  selected: boolean;
}

// 主应用组件
const App: React.FC = () => {
  // 核心状态管理
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [batchInput, setBatchInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  // 批量识别品牌核心函数（调用 Netlify 服务端代理，无 API Key 泄露）
  const handleBatchAdd = async () => {
    // 1. 处理输入的 URL 列表
    const urls = batchInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (urls.length === 0) {
      alert('请输入至少一个 URL（每行一个）');
      return;
    }

    // 2. 开始识别，更新状态
    setIsRecognizing(true);
    try {
      // 3. 调用自己的 Netlify 服务端代理接口
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      // 4. 处理响应结果
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `请求失败（状态码：${response.status}）`);
      }

      const results = await response.json();

      // 5. 格式化识别结果
      const newCompetitors: Competitor[] = results.map((r: any) => {
        // 补全 URL 协议头
        let formattedUrl = r.url;
        if (!formattedUrl.startsWith('http')) {
          formattedUrl = `https://${formattedUrl}`;
        }

        return {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          url: formattedUrl,
          name: r.name || '未知品牌',
          logo: '',
          selected: false,
        };
      });

      // 6. 更新竞品列表，清空输入框
      setCompetitors(prev => [...prev, ...newCompetitors]);
      setBatchInput('');

    } catch (e: any) {
      // 错误提示
      console.error('识别失败详情:', e);
      alert(`识别失败：${e.message}`);
    } finally {
      // 结束识别，恢复按钮状态
      setIsRecognizing(false);
    }
  };

  // 页面 UI 渲染
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '900px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <h1 style={{ color: '#165DFF', textAlign: 'center', marginBottom: '2rem' }}>
        竞品品牌批量识别工具
      </h1>

      {/* 批量输入区域 */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 600, 
          color: '#333' 
        }}>
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
            height: '180px',
            padding: '1rem',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleBatchAdd}
          disabled={isRecognizing}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            backgroundColor: isRecognizing ? '#94a3b8' : '#165DFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRecognizing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
        >
          {isRecognizing ? '识别中...' : '批量识别品牌'}
        </button>
      </div>

      {/* 识别结果展示区域 */}
      <div style={{ 
        borderTop: '1px solid #e5e7eb', 
        paddingTop: '2rem' 
      }}>
        <h3 style={{ color: '#333', marginBottom: '1rem' }}>识别结果</h3>
        
        {competitors.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>
            暂无竞品数据，请输入 URL 并点击识别
          </p>
        ) : (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {competitors.map((item) => (
              <div 
                key={item.id} 
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 500, 
                  color: '#1e293b' 
                }}>
                  {item.name}
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  wordBreak: 'break-all' 
                }}>
                  {item.url}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
