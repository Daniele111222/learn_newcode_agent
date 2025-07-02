from __future__ import annotations

"""main

FastAPI 入口。
运行：uvicorn backend.main:app --reload
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.agent_executor import DiaryAgentExecutor
from backend.schemas import DiaryRequest, DiaryAnalysisResult

# 定义 UTF-8 JSON Response，需在 FastAPI 实例化前
class UTF8JSONResponse(JSONResponse):
    """自定义响应类，显式声明 UTF-8 编码。"""

    media_type = "application/json; charset=utf-8"

app = FastAPI(
    title="Diary Sentiment Analyzer",
    version="1.0.0",
    default_response_class=UTF8JSONResponse,
)

# 单例 Agent
_agent: DiaryAgentExecutor | None = None


def get_agent() -> DiaryAgentExecutor:
    global _agent  # noqa: PLW0603
    if _agent is None:
        _agent = DiaryAgentExecutor()
    return _agent


@app.post("/analyze-diary", response_model=DiaryAnalysisResult, summary="日记情绪分析")
async def analyze_diary_endpoint(req: DiaryRequest) -> DiaryAnalysisResult:  # noqa: D401
    """根据用户提交的日记文本返回情绪分析结果。"""
    print("⏩ client text:", req.content)
    return get_agent().analyze(req.content) 

"""
测试语句：
   $json = '{ "content": "今天很开心，做了一些值得骄傲的事。" }'
   Invoke-RestMethod -Uri http://127.0.0.1:8000/analyze-diary `
                     -Method Post `
                     -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
                     -ContentType 'application/json; charset=utf-8'
"""