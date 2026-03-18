import React, { useState } from 'react';

interface Competitor {
  id: string;
  url: string;
  name: string;
  logo: string;
  selected: boolean;
}

const App: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [batchInput, setBatchInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  const handleBatchAdd = async () => {
    const urls = batchInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (urls.length === 0) {
      alert('请输入至少一个URL');
      return;
    }

    setIsRecognizing(true);
    try {
      const response = await fetch('/.netlify/functions/brand-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      if (!response.ok) throw new Error('请求失败');
      const results = await response.json();

      const newCompetitors = results.map((r: any) => ({
        id: Date.now() + Math.random().toString(36).slice(2),
        url: r.url,
        name: r.name,
        logo: '',
        selected: false
      }));

      setCompetitors(newCompetitors);
      setBatchInput('');
    } catch (e: any) {
      alert(`识别失败：${e.message}`);
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>品牌识别工具</h1>
      <textarea
        value={batchInput}
        onChange={(e) => setBatchInput(e.target.value)}
        placeholder="输入URL，每行一个"
        style={{ width: '100%', height: '150px', margin: '10px 0' }}
      />
      <button 
        onClick={handleBatchAdd} 
        disabled={isRecognizing}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {isRecognizing ? '识别中...' : '识别品牌'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>识别结果</h3>
        {competitors.length === 0 ? (
          <p>暂无结果</p>
        ) : (
          <ul>
            {competitors.map(item => (
              <li key={item.id}>{item.url} → {item.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
