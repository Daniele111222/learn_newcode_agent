from typing import List

from pydantic import BaseModel, Field

__all__ = ["TaskReview"]


class TaskReview(BaseModel):
    """任务审核结果模型。"""

    valid: bool = Field(description="任务列表整体是否可行")
    missing_tasks: List[str] = Field(default_factory=list, description="缺失的关键任务")
    issues: List[str] = Field(default_factory=list, description="其他问题描述") 