from uuid import UUID, uuid4
from typing import List

from pydantic import BaseModel, Field
from pydantic import conlist

__all__ = ["TaskParseRequest", "TaskParseResponse", "TaskList"]

# Pydantic v1 要先定义别名，再用作字段类型
TasksField = conlist(str, min_items=1)  # type: ignore[arg-type]


class TaskParseRequest(BaseModel):
    """任务解析请求模型。

    仅包含用户的自然语言需求描述。
    """

    prompt: str = Field(..., description="用户自然语言需求。")


class TaskParseResponse(BaseModel):
    """任务解析响应模型。

    返回生成的任务唯一标识符。
    """

    task_id: UUID = Field(default_factory=uuid4, description="任务唯一标识。")


# 使用 __root__ 表示顶层即为数组

# 定义带最小长度校验的字符串数组类型；类型检查工具对 `min_items` 参数可能不识别，忽略之
StrArray = conlist(str, min_items=1)  # type: ignore[misc]


class TaskList(BaseModel):
    """大模型返回的任务数组包装类（根为字符串数组）。"""

    __root__: StrArray  # type: ignore[valid-type]

    @property
    def tasks(self) -> List[str]:
        """便捷访问任务列表。"""

        return self.__root__ 