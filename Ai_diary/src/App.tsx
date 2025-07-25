import React from 'react'
import './assets/App.css'
import { DiaryEditor } from './components/DiaryEditor';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800">智能日记本</h1>
          <p className="text-gray-600 mt-2">写下您的心情，实时感受情绪变化</p>
        </header>
        
        <main className="bg-white rounded-xl shadow-lg p-6">
          <DiaryEditor />
        </main>
      </div>
    </div>
  );
}

export default App;