import { useState, useEffect, useRef } from 'react';
import request from '../utils/request'; // 导入封装好的 request 模块
import MDEditor from '@uiw/react-md-editor';
import { message, Button, Tooltip, Progress } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const editorRef = useRef<HTMLDivElement | null>(null);

  /**
   * handleAnalyze
   * 函数用途：当内容变化且达到最小阈值时，请求后端进行情绪分析，并更新分析结果。
   * @param text 当前编辑器内容
   */
  const handleAnalyze = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await request.post<MoodAnalysis>('/analyze-diary', { content: text });
      setAnalysis(response.data);
    } catch (error) {
      console.error('分析请求失败', error);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * insertAtCursor
   * 函数用途：在 Markdown 文本中当前光标位置插入指定文本；若无法获取光标，则追加到末尾。
   * @param insertText 要插入的文本内容
   */
  const insertAtCursor = (insertText: string) => {
    // @uiw/react-md-editor 不直接暴露 selection；此处用退化策略：在文本末尾附加。
    // 若后续替换占位需要精确位置，可维护占位标记并通过字符串替换实现。
    setContent((prev) => (prev ? `${prev}\n${insertText}` : insertText));
  };

  /**
   * uploadImage
   * 函数用途：将图片文件上传到后端 /api/v1/upload，返回图片 URL；包含 100MB 体积限制校验与上传进度反馈。
   * @param file 待上传的文件对象
   */
  const uploadImage = async (file: File): Promise<string> => {
    const MAX_BYTES = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_BYTES) {
      message.error('图片过大，限制 100MB 以内');
      throw new Error('FILE_TOO_LARGE');
    }

    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await request.post<{ url: string }>(
        '/api/v1/upload',
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(percent);
          },
        }
      );
      return res.data.url;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * handleFiles
   * 函数用途：处理拖拽/粘贴/选择的文件集合，逐个上传并插入到 Markdown 中。
   * @param files FileList 或文件数组
   */
  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      try {
        const url = await uploadImage(file);
        // 插入标准 Markdown 图片语法
        insertAtCursor(`![](${url})`);
        message.success('图片已插入');
      } catch (e) {
        console.error(e);
      }
    }
  };

  /**
   * handlePaste
   * 函数用途：监听编辑区域粘贴事件，若存在图片文件则自动上传并插入。
   * @param e 粘贴事件对象
   */
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  };

  /**
   * handleDrop
   * 函数用途：监听拖拽释放事件，读取图片文件并上传插入。
   * @param e 拖拽释放事件
   */
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length) {
      await handleFiles(files);
    }
  };

  /**
   * useEffect: 内容变化时计数并触发节流分析
   */
  useEffect(() => {
    setWordCount(content.length);
    if (content.trim().length < 10) {
      setAnalysis(null);
      return;
    }
    const timer = setTimeout(() => handleAnalyze(content), 1500);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-color-mode="light">
      {/* 编辑器区域 */}
      <div className="relative">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* 编辑器头部 */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-4 text-sm font-medium text-gray-600">今日日记（Markdown）</span>
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
                <Tooltip title="插入图片（支持粘贴/拖拽）">
                  <Button
                    size="small"
                    icon={<PictureOutlined />}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const files = input.files;
                        if (files && files.length) await handleFiles(files);
                      };
                      input.click();
                    }}
                  >
                    图片
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Markdown 编辑器 */}
          <div className="relative" ref={editorRef} onPaste={handlePaste}>
            <MDEditor value={content} onChange={(v) => setContent(v || '')} height={320} preview="edit" />
          </div>

          {/* 上传进度 */}
          {uploading && (
            <div className="px-6 pb-4">
              <Progress percent={uploadProgress} size="small" />
            </div>
          )}
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
