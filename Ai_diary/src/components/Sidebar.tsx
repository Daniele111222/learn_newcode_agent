import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Sidebar 侧边栏组件
 * - 固定宽度 200px，位于页面左侧
 * - 使用 NavLink 提供导航与激活态样式
 * - 在移动端维持抽屟式交互（通过 translate 控制显隐）
 *
 * @param props.sidebarOpen 移动端是否展开
 * @param props.onToggle 点击关闭按钮回调（移动端）
 * @param props.onItemClick 点击菜单项后的回调（用于移动端关闭抽屉）
 */
export function Sidebar({
  sidebarOpen,
  onToggle,
  onItemClick,
}: {
  sidebarOpen: boolean;
  onToggle: () => void;
  onItemClick: () => void;
}) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[200px] bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}
    >
      {/* 侧边栏头部 */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">AI 日记</h2>
          {/* 移动端关闭按钮 */}
          <button
            onClick={onToggle}
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
          { id: 'diary', name: '写日记', icon: '📝', to: '/diary' },
          { id: 'analytics', name: '情绪分析', icon: '📊', to: '/analytics' },
          { id: 'history', name: '历史记录', icon: '📚', to: '/history' },
          { id: 'settings', name: '设置', icon: '⚙️', to: '/settings' },
        ].map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) => `
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
              transition-colors duration-200 block
              ${isActive ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* 侧边栏底部 */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">AI 智能日记 v1.0</div>
      </div>
    </aside>
  );
}