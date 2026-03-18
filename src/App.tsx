/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Plus, Trash2, Play, FileText, Download, Loader2, Link as LinkIcon, Globe, Sparkles, List, CheckSquare, History, X, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Competitor {
  id: string;
  name: string;
  url: string;
  logo: string;
  selected: boolean;
}

interface HistoryRecord {
  id: string;
  timestamp: number;
  competitors: Competitor[];
  report: string;
}

export default function App() {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: '1', name: '阿里云百炼', url: 'https://bailian.console.aliyun.com/cn-beijing/#/home', logo: 'https://www.google.com/s2/favicons?domain=aliyun.com&sz=64', selected: true },
    { id: '2', name: '百度千帆', url: 'https://cloud.baidu.com/product-s/qianfan_home', logo: 'https://www.google.com/s2/favicons?domain=baidu.com&sz=64', selected: true },
    { id: '3', name: 'Hugging Face', url: 'https://huggingface.co/', logo: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=64', selected: true },
  ]);
  
  const [batchInput, setBatchInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'report'>('list');
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('competitor_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const loadHistory = (record: HistoryRecord) => {
    setReport(record.report);
    setActiveTab('report');
    setShowHistoryModal(false);
  };

  const deleteHistory = (id: string) => {
    setHistory(prev => {
      const next = prev.filter(r => r.id !== id);
      localStorage.setItem('competitor_history', JSON.stringify(next));
      return next;
    });
  };

  const handleBatchAdd = async () => {
  const urls = batchInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  if (urls.length === 0) return;

  setIsRecognizing(true);
  try {
    // 替换成你的真实 API Key（仅测试用，上线后改回环境变量）
    const API_KEY = "AIzaSyDYbrn2n5xofpo8g5uwAe_56Pbvfsyqm9w";
    const prompt = `I have a list of website URLs. Please identify the brand or company name for each URL.
Return ONLY a valid JSON array of objects with 'url' and 'name' properties. Do not include any markdown formatting or explanation.
URLs:
${urls.join('\n')}`;

    // 直接调用 Gemini REST API，绕过 SDK 浏览器限制
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string", description: "The original URL" },
                  name: { type: "string", description: "The recognized brand or company name" }
                },
                required: ["url", "name"]
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    const cleanText = (generatedText || '[]').replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();
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
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }
        let domain = '';
        try {
          domain = new URL(formattedUrl).hostname;
        } catch (e) {
          domain = formattedUrl.replace('https://', '').replace('http://', '').split('/')[0];
        }

        return {
          id: Math.random().toString(36).substring(2, 11),
          name: r.name || domain,
          url: formattedUrl,
          logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          selected: true
        };
      });

      setCompetitors(prev => [...prev, ...newCompetitors]);
      setBatchInput('');
    } catch (error) {
      console.error('Recognition error:', error);
      alert('智能识别失败，请检查网络或 API Key。');
    } finally {
      setIsRecognizing(false);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = competitors.every(c => c.selected);
    setCompetitors(competitors.map(c => ({ ...c, selected: !allSelected })));
  };

  const toggleSelect = (id: string) => {
    setCompetitors(competitors.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleDelete = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const handleDeleteSelected = () => {
    setCompetitors(competitors.filter(c => !c.selected));
  };

  const generateReport = async () => {
    const selectedCompetitors = competitors.filter(c => c.selected);
    if (selectedCompetitors.length === 0) {
      alert('请至少选择一个竞品进行分析');
      return;
    }
    
    setActiveTab('report');
    setIsGenerating(true);
    setReport('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
你是一位资深的 UX/UI 设计专家和产品经理。我正在进行一项面向设计师的竞品调研，以下是我的调研目标：

${selectedCompetitors.map((c, i) => `${i + 1}. **${c.name}** (${c.url})`).join('\n')}

请为我生成一份结构化的竞品分析报告。因为受众是设计师，所以请**重点关注视觉设计、交互体验、UI布局等设计维度的分析**。

报告的核心必须是一个**Markdown 格式的横向对比表格**。
请严格按照以下格式生成表格（注意保留截图占位符，不要修改占位符的格式）：

| 对比维度 | ${selectedCompetitors.map(c => c.name).join(' | ')} |
| :--- | ${selectedCompetitors.map(() => ':---').join(' | ')} |
| **截图** | ${selectedCompetitors.map(c => `[SCREENSHOT_PLACEHOLDER_${c.id}]`).join(' | ')} |
| **视觉风格** | (分析色彩、排版、视觉氛围) | ${selectedCompetitors.map(() => '...').join(' | ')} |
| **交互体验** | (分析核心操作流、微交互) | ${selectedCompetitors.map(() => '...').join(' | ')} |
| **核心差异** | (设计上的最大不同点) | ${selectedCompetitors.map(() => '...').join(' | ')} |
| **亮点借鉴** | (具体可借鉴的UI/UX点) | ${selectedCompetitors.map(() => '...').join(' | ')} |
| **设计不足** | (体验或视觉上的优化空间) | ${selectedCompetitors.map(() => '...').join(' | ')} |

除了这个核心表格，你可以在表格前后补充简短的“调研背景”和“最终设计建议”。
`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      let fullText = '';
      let finalReplacedText = '';
      let lastUpdateTime = Date.now();

      for await (const chunk of responseStream) {
        fullText += chunk.text || '';
        
        let replacedText = fullText;
        selectedCompetitors.forEach(c => {
          const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(c.url)}&screenshot=true&meta=false&embed=screenshot.url&fullPage=true`;
          // 将 URL 中的特殊字符转义，防止 Markdown 解析器在解析未闭合的表格时发生灾难性回溯
          const safeUrl = screenshotUrl.replace(/[_*~()]/g, (m) => '%' + m.charCodeAt(0).toString(16).toUpperCase());
          replacedText = replacedText.replace(
            `[SCREENSHOT_PLACEHOLDER_${c.id}]`, 
            `![${c.name} 官网长截图](${safeUrl})`
          );
        });
        
        finalReplacedText = replacedText;
        
        // 节流渲染：每 150ms 更新一次视图，避免高频渲染长 Markdown 导致浏览器主线程卡死
        if (Date.now() - lastUpdateTime > 150) {
          setReport(replacedText);
          lastUpdateTime = Date.now();
        }
      }
      
      // 确保流结束后最后一次完整渲染
      setReport(finalReplacedText);

      if (finalReplacedText.trim()) {
        const newRecord: HistoryRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          competitors: selectedCompetitors,
          report: finalReplacedText
        };
        setHistory(prev => {
          const next = [newRecord, ...prev];
          localStorage.setItem('competitor_history', JSON.stringify(next));
          return next;
        });
      }

    } catch (error) {
      console.error('Error generating report:', error);
      setReport('生成报告时发生错误，请检查 API Key 或网络连接。\n\n' + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = competitors.filter(c => c.selected).length;
  const allSelected = competitors.length > 0 && competitors.every(c => c.selected);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Auto Analyst</h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Competitor Research</p>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200", 
                activeTab === 'list' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <List className="w-4 h-4" />
              竞品列表
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200", 
                activeTab === 'report' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <FileText className="w-4 h-4" />
              分析报告
            </button>
          </div>
          
          <div className="w-32 flex justify-end">
            {activeTab === 'report' && report && (
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                导出 PDF
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {activeTab === 'list' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Batch Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                批量添加竞品
              </h3>
              <div className="flex flex-row gap-3 relative z-20">
                <div className="flex-1 relative h-12">
                  <textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => {
                      // 延迟收起，以确保右侧按钮的点击事件能够正常触发
                      setTimeout(() => setIsInputFocused(false), 200);
                    }}
                    placeholder={isInputFocused ? "在此粘贴竞品网址，每行一个。例如：\nhttps://figma.com\nhttps://sketch.com" : "在此粘贴竞品网址，每行一个..."}
                    className={cn(
                      "absolute top-0 left-0 w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all duration-300 placeholder:text-slate-400",
                      isInputFocused ? "h-48 shadow-xl z-50 bg-white" : "h-12 overflow-hidden"
                    )}
                  />
                </div>
                <div className="w-28 sm:w-36 shrink-0">
                  <button
                    onClick={handleBatchAdd}
                    disabled={isRecognizing || !batchInput.trim()}
                    className="w-full h-12 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                  >
                    {isRecognizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        识别中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        智能识别
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Table Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  调研目标 <span className="text-slate-400 font-normal text-sm ml-1">({competitors.length})</span>
                </h2>
                {selectedCount > 0 && (
                  <button 
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除选中 ({selectedCount})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  <History className="w-4 h-4" />
                  历史记录
                </button>
                <button
                  onClick={generateReport}
                  disabled={selectedCount === 0 || isGenerating}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-xl shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  生成分析报告 {selectedCount > 0 && `(${selectedCount})`}
                </button>
              </div>
            </div>

            {/* Competitors Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {competitors.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <List className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">暂无竞品数据</p>
                  <p className="text-sm text-slate-400 mt-1">请在上方批量粘贴网址并进行智能识别</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={allSelected} 
                            onChange={toggleSelectAll} 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                          />
                        </th>
                        <th className="p-4 font-medium w-16">Logo</th>
                        <th className="p-4 font-medium">竞品名称</th>
                        <th className="p-4 font-medium">官网地址</th>
                        <th className="p-4 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {competitors.map(c => (
                        <tr 
                          key={c.id} 
                          className={cn(
                            "transition-colors hover:bg-slate-50/80",
                            c.selected ? "bg-indigo-50/30" : ""
                          )}
                        >
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={c.selected} 
                              onChange={() => toggleSelect(c.id)} 
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                            />
                          </td>
                          <td className="p-4">
                            <img 
                              src={c.logo} 
                              alt={c.name} 
                              className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm object-contain p-1" 
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?' }} 
                            />
                          </td>
                          <td className="p-4 font-medium text-slate-900">{c.name}</td>
                          <td className="p-4 text-slate-500">
                            <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline inline-flex items-center gap-1.5 transition-colors">
                              {c.url} <LinkIcon className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDelete(c.id)} 
                              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors inline-flex"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto">
              {!report && !isGenerating ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-2">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-xl font-medium text-slate-600">报告尚未生成</p>
                  <p className="text-sm text-center max-w-md">
                    请先在“竞品列表”中勾选需要调研的目标，然后点击生成报告。AI 将自动访问、截图并为您整理一份结构化的分析文档。
                  </p>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                  >
                    返回列表选择
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 md:p-16 print:shadow-none print:border-none print:p-0">
                  <div className="prose prose-slate prose-indigo max-w-none 
                    prose-headings:font-semibold prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h1:mb-10 prose-h1:border-b prose-h1:pb-6
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-xl prose-h3:mt-8
                    prose-img:rounded-xl prose-img:shadow-sm prose-img:border prose-img:border-slate-200 prose-img:w-full prose-img:h-auto prose-img:my-0 prose-img:bg-slate-50 prose-img:min-h-[200px] prose-img:cursor-zoom-in
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-table:block prose-table:overflow-x-auto prose-table:w-full prose-table:text-sm prose-table:whitespace-pre-wrap
                    prose-th:bg-slate-50 prose-th:p-4 prose-th:border prose-th:border-slate-200 prose-th:text-left prose-th:min-w-[320px] prose-th:first-of-type:min-w-[120px] prose-th:first-of-type:w-[120px]
                    prose-td:p-4 prose-td:border prose-td:border-slate-200 prose-td:min-w-[320px] prose-td:first-of-type:min-w-[120px] prose-td:first-of-type:w-[120px] prose-td:first-of-type:font-semibold prose-td:first-of-type:bg-slate-50/50 prose-td:align-top
                  ">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({node, ...props}) => (
                          <Zoom>
                            <img {...props} alt={props.alt || ''} />
                          </Zoom>
                        )
                      }}
                    >
                      {report}
                    </ReactMarkdown>
                  </div>
                  {isGenerating && (
                    <div className="mt-12 flex items-center justify-center gap-3 text-indigo-600 font-medium animate-pulse bg-indigo-50 py-4 rounded-xl">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI 正在深度分析中，请稍候...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                历史调研记录
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 bg-slate-50/30">
              {history.length === 0 ? (
                <div className="text-center flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">暂无历史记录</p>
                  <p className="text-sm text-slate-400 mt-1">生成的分析报告会保存在这里</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                      <div className="cursor-pointer flex-1" onClick={() => loadHistory(record)}>
                        <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(record.timestamp).toLocaleString()}
                        </div>
                        <div className="font-medium text-slate-700 flex flex-wrap gap-1.5">
                          {record.competitors.map((c, i) => (
                            <span key={c.id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-sm">
                              <img src={c.logo} alt="" className="w-3 h-3 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/12?text=?' }} />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteHistory(record.id); }} 
                        className="p-2 ml-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
