import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@ant-design/v5-patch-for-react-19'
import './index.css'
import '@uiw/react-md-editor/dist/mdeditor.css'
import '@uiw/react-markdown-preview/dist/markdown.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)