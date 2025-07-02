from __future__ import annotations

"""tools

LangChain Tool 封装与本地情绪分析实现。
"""

# 依赖顺序：标准库 → 第三方 → 本地
import json
import re
from collections import Counter
from typing import Dict, Any, List

# 兼容不同版本的 LangChain：Tool 在新版迁移至 langchain_core
try:
    from langchain.tools import Tool  # type: ignore
except ImportError:  # pragma: no cover
    from langchain_core.tools import Tool  # type: ignore

__all__ = [
    "analyze_mood_tool",
    "extract_keywords_tool",
    "generate_suggestions_tool",
    # Helper
    "analyze_diary",
]

# -----------------------------------------------------------------------------
# 简易情绪分析实现
# -----------------------------------------------------------------------------

_POSITIVE_WORDS: List[str] = [
    "开心",
    "快乐",
    "满足",
    "兴奋",
    "幸福",
    "喜悦",
    "高兴",
]

_NEGATIVE_WORDS: List[str] = [
    "难过",
    "悲伤",
    "失落",
    "沮丧",
    "痛苦",
    "抑郁",
    "焦虑",
]


def _detect_mood(content: str) -> str:
    pos = sum(content.count(w) for w in _POSITIVE_WORDS)
    neg = sum(content.count(w) for w in _NEGATIVE_WORDS)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def _extract_keywords(content: str, top_k: int = 5) -> List[str]:
    tokens = re.findall(r"[\u4e00-\u9fffA-Za-z0-9]+", content)
    freq = Counter(tokens)
    return [w for w, _ in freq.most_common(top_k)]


def analyze_diary(content: str) -> Dict[str, Any]:
    mood = _detect_mood(content)
    kws = _extract_keywords(content)

    emoji_map = {"positive": "😊", "negative": "😢", "neutral": "😐"}
    suggestions_map = {
        "positive": ["保持积极的心态！", "与他人分享你的快乐。"],
        "negative": [
            "尝试做些让自己开心的事情。",
            "与朋友或家人沟通。",
            "必要时寻求专业帮助。",
        ],
        "neutral": ["继续加油，保持生活与工作的平衡。"],
    }

    return {
        "mood": mood,
        "emoji": emoji_map[mood],
        "keywords": kws,
        "suggestions": suggestions_map[mood],
    }


# -----------------------------------------------------------------------------
# Tool Wrappers
# -----------------------------------------------------------------------------


def _safe_json(data: Dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False)


def _analyze_mood(text: str) -> str:
    return _safe_json({"mood": analyze_diary(text)["mood"]})


analyze_mood_tool = Tool(
    name="analyze_mood",
    description="分析文本情绪，返回 JSON，如 {\"mood\": \"positive\"}",
    func=_analyze_mood,
)


def _extract_keywords_tool(text: str) -> str:
    return _safe_json({"keywords": analyze_diary(text)["keywords"]})


extract_keywords_tool = Tool(
    name="extract_keywords",
    description="提取关键词，返回 JSON，如 {\"keywords\": [...]}",
    func=_extract_keywords_tool,
)


def _generate_suggestions_tool(text: str) -> str:
    return _safe_json({"suggestions": analyze_diary(text)["suggestions"]})


generate_suggestions_tool = Tool(
    name="generate_suggestions",
    description="根据情绪给出建议列表，返回 JSON，如 {\"suggestions\": [...]}",
    func=_generate_suggestions_tool,
) 