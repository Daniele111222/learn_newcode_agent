import React, { useState } from 'react'
import './assets/App.css'
import { DiaryEditor } from './components/DiaryEditor';

/**
 * 主应用组件 - 包含侧边栏和主内容区域的全屏布局
 */
function App() {
  // 控制侧边栏在移动端的显示/隐藏状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 当前激活的路由/页面
  const [activeRoute, setActiveRoute] = useState('diary');

  /**
   * 切换侧边栏显示状态（移动端）
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * 处理路由切换
   * @param route - 要切换到的路由名称
   */
  const handleRouteChange = (route: string) => {
    setActiveRoute(route);
    setSidebarOpen(false); // 移动端选择后自动关闭侧边栏
  };

  /**
   * 根据当前路由渲染对应的内容
   */
  const renderContent = () => {
    switch (activeRoute) {
      case 'diary':
        return (
          <div className="space-y-6">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">智能情绪日记</h1>
              <p className="text-gray-600">记录点滴，洞见内心</p>
            </header>
            <DiaryEditor />
          </div>
        );
      case 'analytics':
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
      case 'history':
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
      case 'settings':
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
      default:
        return <DiaryEditor />;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 侧边栏 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* 侧边栏头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">AI 日记</h2>
            {/* 移动端关闭按钮 */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'diary', name: '写日记', icon: '📝' },
            { id: 'analytics', name: '情绪分析', icon: '📊' },
            { id: 'history', name: '历史记录', icon: '📚' },
            { id: 'settings', name: '设置', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleRouteChange(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
                transition-colors duration-200
                ${
                  activeRoute === item.id
                    ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
        
        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            AI 智能日记 v1.0
          </div>
        </div>
      </aside>
      
      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col min-w-0">
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
            <div className="w-10" /> {/* 占位符，保持标题居中 */}
          </div>
        </header>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6 lg:p-8">
            <div className="max-w-4xl mx-auto h-full">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;