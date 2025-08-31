import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // 添加 server 配置
    proxy: { // 添加 proxy 配置
      // 将 /analyze-diary 的请求代理到 http://127.0.0.1:8000
      '/analyze-diary': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true, // 必须设置为 true，以允许跨域
      },
      // 新增：代理 /api/v1/upload 到后端用于文件上传
      '/api/v1/upload': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // 新增：代理 /uploads/* 到后端用于静态资源访问
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@ant-design/v5-patch-for-react-19'],
  },
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
      '@': path.resolve(__dirname, './src'),
    },
  },
})
