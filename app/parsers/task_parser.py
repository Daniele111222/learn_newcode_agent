from typing import List

from pydantic import BaseModel, Field
from langchain.output_parsers import JsonOutputParser

__all__ = ["TaskListModel", "task_parser"]


class TaskListModel(BaseModel):
    """大模型输出 JSON 结构。"""

    tasks: List[str] = Field(description="拆解后的任务列表")


task_parser: JsonOutputParser = JsonOutputParser(pydantic_object=TaskListModel) 