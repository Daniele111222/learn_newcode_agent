from pathlib import Path

# Dynamically resolve project root so scripts can be executed from any CWD
PROJECT_ROOT = Path(__file__).resolve().parent.parent

from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain

from services.bigmodel import get_bigmodel
from schemas.task import TaskList

__all__ = ["task_planning_chain", "parse_tasks"]

# ---------------------------------------------------------------------------
# Prompt 组合
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (PROJECT_ROOT / "prompts/system_task.j2").read_text(encoding="utf-8")
HUMAN_TEMPLATE = (PROJECT_ROOT / "prompts/user_template.j2").read_text(encoding="utf-8")

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_TEMPLATE),
    ]
)

# ---------------------------------------------------------------------------
# LLMChain
# ---------------------------------------------------------------------------

llm = get_bigmodel().llm  # GLM-4-FlashX-250414

task_planning_chain = LLMChain(llm=llm, prompt=prompt, verbose=False)

# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------

def parse_tasks(user_input: str) -> TaskList:
    """调用 LLMChain 并解析为 TaskList。

    若模型输出非法 JSON，将由 Pydantic 抛出 ValidationError。"""

    raw_output: str = task_planning_chain.predict(prompt=user_input)

    # 直接交给 Pydantic 校验与解析
    return TaskList.parse_raw(raw_output) 