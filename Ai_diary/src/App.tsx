import React, { useState } from 'react'
import './assets/App.css'
import { DiaryEditor } from './components/DiaryEditor';
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'

/**
 * 写日记页面组件 —— 包含标题和日记编辑器
 */
function DiaryPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">智能情绪日记</h1>
        <p className="text-gray-600">记录点滴，洞见内心</p>
      </header>
      <DiaryEditor />
    </div>
  );
}

/**
 * 情绪分析页面组件 —— 预留数据分析内容
 */
function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">情绪分析</h1>
        <p className="text-gray-600">查看您的情绪变化趋势</p>
      </header>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">情绪分析功能即将上线...</p>
      </div>
    </div>
  );
}

/**
 * 历史记录页面组件 —— 预留历史记录列表
 */
function HistoryPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">历史记录</h1>
        <p className="text-gray-600">回顾过往的心情记录</p>
      </header>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">历史记录功能即将上线...</p>
      </div>
    </div>
  );
}

/**
 * 设置页面组件 —— 预留个性化设置
 */
function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">设置</h1>
        <p className="text-gray-600">个性化您的日记体验</p>
      </header>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">设置功能即将上线...</p>
      </div>
    </div>
  );
}

/**
 * 404 页面组件 —— 未匹配到路由时显示
 */
function NotFoundPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">页面未找到</h1>
        <p className="text-gray-600">请检查地址是否正确</p>
      </header>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">返回左侧选择其他页面试试吧～</p>
      </div>
    </div>
  );
}

/**
 * 主应用组件 - 包含侧边栏和主内容区域的全屏布局
 */
function App() {
  // 控制侧边栏在移动端的显示/隐藏状态
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * 切换侧边栏显示状态（移动端）
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen w-screen m-0 p-0 flex bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧固定 200px 的侧边栏组件 */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onItemClick={() => setSidebarOpen(false)}
      />

      {/* 右侧内容区，占据剩余空间 */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[200px] lg:static">
        {/* 顶部导航栏（移动端） */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">AI 日记</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6 lg:p-8">
            <div className="max-w-4xl mx-auto h-full">
              <Routes>
                <Route path="/" element={<DiaryPage />} />
                <Route path="/diary" element={<DiaryPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;