import { useState, useEffect } from 'react';
import request from '../utils/request'; // 导入封装好的 request 模块

interface MoodAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
}

export const DiaryEditor = () => {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  /**
   * 当日记内容变化时触发，延时发送请求进行分析
   */
  useEffect(() => {
    setWordCount(content.length);
    if (content.trim().length < 10) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // request.post<MoodAnalysis> 返回一个 AxiosResponse<MoodAnalysis> 类型的 Promise
        const response = await request.post<MoodAnalysis>('/analyze-diary', { content });
        setAnalysis(response.data);
      } catch (error) {
        console.error('分析请求失败', error);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 编辑器区域 */}
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* 编辑器头部 */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-4 text-sm font-medium text-gray-600">今日日记</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-600">
                  {wordCount} 字符
                </span>
                {content.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">实时分析</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 文本编辑区 */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="✨ 在这里记录你的心情故事..."
              className="w-full h-80 p-6 text-gray-700 placeholder-gray-400 border-none resize-none focus:outline-none focus:ring-0 text-lg leading-relaxed bg-transparent"
              style={{ fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif' }}
            />
            
            {/* 渐变遮罩效果 */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* 字数提示 */}
        {content.length > 0 && (
          <div className="absolute -bottom-2 right-4 bg-white px-3 py-1 rounded-full shadow-md border border-gray-100">
            <span className="text-xs text-gray-500">
              {content.trim().length < 10 ? `还需 ${10 - content.trim().length} 字开始分析` : '正在分析...'}
            </span>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-1">AI 正在分析您的情绪</p>
              <p className="text-sm text-gray-500">请稍候，这可能需要几秒钟...</p>
            </div>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {analysis && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
          {/* 结果头部 */}
          <div className={`px-6 py-4 ${getSentimentGradient(analysis.sentiment)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getSentimentIcon(analysis.sentiment)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {getSentimentText(analysis.sentiment)}
                  </h3>
                  <p className="text-sm text-white/80">
                    {/* 确保 confidence 是有效数字再进行计算 */}
                    置信度: {typeof analysis.confidence === 'number' ? Math.round(analysis.confidence * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-bold text-white">
                    {typeof analysis.confidence === 'number' ? Math.round(analysis.confidence * 100) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 关键词分析 */}
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                关键词分析
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, i) => (
                  <span 
                    key={i} 
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${getKeywordStyle(analysis.sentiment)}`}
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 情绪指标 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">情绪强度</h4>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${getSentimentBarColor(analysis.sentiment)}`}
                    style={{ width: `${analysis.confidence * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低</span>
                  <span>中</span>
                  <span>高</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 样式辅助函数
function getSentimentGradient(sentiment: string) {
  switch (sentiment) {
    case 'positive': 
      return 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500';
    case 'negative': 
      return 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500';
    default: 
      return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500';
  }
}

function getSentimentText(sentiment: string) {
  switch (sentiment) {
    case 'positive': return '积极情绪';
    case 'negative': return '消极情绪';
    default: return '中性情绪';
  }
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😢';
    default: return '😐';
  }
}

function getKeywordStyle(sentiment: string) {
  switch (sentiment) {
    case 'positive': 
      return 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200';
    case 'negative': 
      return 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200';
    default: 
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200';
  }
}

function getSentimentBarColor(sentiment: string) {
  switch (sentiment) {
    case 'positive': return 'bg-gradient-to-r from-green-400 to-green-600';
    case 'negative': return 'bg-gradient-to-r from-red-400 to-red-600';
    default: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  }
}
