from __future__ import annotations

from pathlib import Path
from typing import List

from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import JsonOutputParser

from ..services.bigmodel import get_bigmodel
from ..schemas.review import TaskReview

__all__ = ["ReviewerAgent"]

# ---------------------------------------------------------
# 路径与模板加载
# ---------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = PROJECT_ROOT / "prompts" / "reviewer_task.j2"

REVIEW_PROMPT_TEMPLATE = TEMPLATE_PATH.read_text(encoding="utf-8")

prompt = ChatPromptTemplate.from_template(REVIEW_PROMPT_TEMPLATE)


class ReviewerAgent:
    """基于 CrewAI 思想实现的简单任务审核 Agent。"""

    def __init__(self) -> None:
        llm = get_bigmodel().llm
        parser = JsonOutputParser(pydantic_object=TaskReview)
        self.chain: LLMChain = LLMChain(llm=llm, prompt=prompt, output_parser=parser)

    # -----------------------------------------------------
    # Public API
    # -----------------------------------------------------

    def review(self, tasks: List[str]) -> TaskReview:
        """审核任务列表，返回 `TaskReview` 结果。"""

        tasks_json = tasks  # 直接传递数组，PromptTemplate 会插值
        result: TaskReview = self.chain.invoke({"tasks": tasks_json})
        return result 