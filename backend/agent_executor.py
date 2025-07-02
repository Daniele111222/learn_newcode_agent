from __future__ import annotations

"""agent_executor

LangChain Agent，用于对日记文本进行情绪分析并输出结构化 JSON。
"""

import os
from typing import List

from dotenv import load_dotenv
# 兼容不同版本的 LangChain：0.x 在 langchain.output_parsers，>=0.2 在 langchain_core.output_parsers
try:
    from langchain.output_parsers import JsonOutputParser  # type: ignore
except ImportError:  # pragma: no cover
    from langchain_core.output_parsers import JsonOutputParser  # type: ignore
from langchain.prompts import ChatPromptTemplate

# 同理，ChatPromptTemplate 在新版迁移至 langchain_core
try:
    from langchain.prompts import ChatPromptTemplate  # type: ignore
except ImportError:  # pragma: no cover
    from langchain_core.prompts import ChatPromptTemplate  # type: ignore

from backend.schemas import DiaryAnalysisResult

try:
    from langchain_community.chat_models import ChatZhipuAI  # 智谱
except ImportError:  # fallback to OpenAI
    from langchain.chat_models import ChatOpenAI as ChatZhipuAI  # type: ignore

__all__ = ["DiaryAgentExecutor"]

# 简易情绪词典
POSITIVE_WORDS = [
    "开心",
    "高兴",
    "满足",
    "成就",
    "骄傲",
    "愉快",
    "喜悦",
    "兴奋",
]

NEGATIVE_WORDS = [
    "累",
    "疲惫",
    "沮丧",
    "压力",
    "悲伤",
    "失落",
    "难过",
    "痛苦",
]

class DiaryAgentExecutor:
    """零样本 Agent，通过大模型直接生成情绪分析 JSON。"""

    def __init__(self, model_name: str | None = None) -> None:
        load_dotenv()

        # 若环境变量 BIGMODEL_API_KEY/OpenAI API_KEY 未配置，将抛异常
        api_key = os.getenv("BIGMODEL_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing API key in environment variables.")

        # 默认使用智谱；若不在环境中，则自动回退至 gpt-3.5-turbo
        model_name = model_name or ("glm-4-plus" if "BIGMODEL_API_KEY" in os.environ else "gpt-3.5-turbo")

        # 调低 temperature 让模型更一致地遵循提示词
        self.llm = ChatZhipuAI(
            api_key=api_key,
            model=model_name,
            temperature=0.2,
            top_p=0.9,
        )  # type: ignore[arg-type]

        # Json 解析器保证输出符合 Pydantic 模型
        self.parser = JsonOutputParser(pydantic_object=DiaryAnalysisResult)

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "你是一位专业的情绪分析师。阅读用户的日记文本后，请用输入语言返回以下内容：\n"
                        "1. 整体情绪 mood（positive / negative / neutral 等）。\n"
                        "2. 对应 Emoji（请输出一个常见且完整的 Emoji 字符，例如 😀😢😡😱 等）。\n"
                        "3. 4~5 个关键词 keywords。\n"
                        "4. 3 条建议 suggestions，用第二人称写。\n"
                        "请严格按照 JSON 格式输出，不要包含任何额外文本。{format_instructions}\n"
                        "情绪判断规则：\n"
                        "- 若文本包含明显积极因素且超过负面，判定为 positive。\n"
                        "- 若负面因素明显占主导，判定为 negative。\n"
                        "- 仅当正负因素均衡且无法判断主导倾向时才使用 neutral。\n"
                        "当前文本检测到正面词 {pos_cnt} 个，负面词 {neg_cnt} 个。\n"
                        "⚠️ **除非正负词数量完全相等且无法判断主导倾向，严禁返回 neutral！**"
                    ),
                ),
                ("human", "日记内容：今天阳光明媚，我完成了所有任务，感觉很满足。"),
                (
                    "assistant",
                    '{{"mood":"positive","emoji":"😀","keywords":["阳光","满足","成就","愉快"],"suggestions":["保持积极心态","奖励自己","分享喜悦"]}}',
                ),
                ("human", "日记内容：今天被老板批评，工作进度很慢，感到沮丧和压力。"),
                (
                    "assistant",
                    '{{"mood":"negative","emoji":"😞","keywords":["批评","沮丧","压力","情绪低落"],"suggestions":["深呼吸放松","设定可行目标","与朋友倾诉"]}}',
                ),
                ("human", "日记内容：{diary}"),
            ]
        ).partial(format_instructions=self.parser.get_format_instructions())

        # 构建链 (Prompt → LLM → Parser)
        self.chain = self.prompt | self.llm | self.parser

    # ---------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------

    def analyze(self, diary: str) -> DiaryAnalysisResult:
        """分析日记文本，返回结构化结果。"""

        pos_cnt = sum(word in diary for word in POSITIVE_WORDS)
        neg_cnt = sum(word in diary for word in NEGATIVE_WORDS)
        print("pos_cnt:", pos_cnt, "neg_cnt:", neg_cnt)
        raw = self.chain.invoke(
            {
                "diary": diary,
                "pos_cnt": str(pos_cnt),
                "neg_cnt": str(neg_cnt),
            }
        )
        # 兼容 JsonOutputParser 可能返回 dict 的情况
        if isinstance(raw, dict):
            result = DiaryAnalysisResult(**raw)
        else:
            result = raw

        # 若模型仍返回 neutral，则使用词典计数进行简单纠偏
        if result.mood == "neutral":
            if pos_cnt > neg_cnt:
                result = result.copy(update={"mood": "positive", "emoji": "😀"})
            elif neg_cnt > pos_cnt:
                result = result.copy(update={"mood": "negative", "emoji": "😞"})

        return result 