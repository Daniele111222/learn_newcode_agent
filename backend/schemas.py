from __future__ import annotations

"""schemas

Pydantic 数据结构定义。
"""

from typing import List

from pydantic import BaseModel, Field

__all__ = ["DiaryRequest", "DiaryAnalysisResult"]


class DiaryRequest(BaseModel):
    """请求体：用户提交的日记内容。"""

    content: str = Field(..., description="日记文本内容")


class DiaryAnalysisResult(BaseModel):
    """响应体：情绪分析结果。"""

    mood: str = Field(..., description="情绪类型，如 positive / negative / neutral")
    emoji: str = Field(..., description="与情绪对应的 Emoji")
    keywords: List[str] = Field(..., description="关键词列表")
    suggestions: List[str] = Field(..., description="建议列表") 