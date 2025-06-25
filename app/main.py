from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .chains.task_planner import parse_tasks


class ParseRequest(BaseModel):
    """请求体模型，仅包含用户自然语言需求。"""

    prompt: str


class ParseResponse(BaseModel):
    """响应体模型，返回拆分的任务列表。"""

    tasks: List[str]


app = FastAPI(title="Agent Task Parser", version="0.1.0")


@app.post("/task/parse", response_model=ParseResponse)
async def parse_task(req: ParseRequest) -> ParseResponse:
    """将自然语言 `prompt` 拆分为开发任务 JSON 数组。

    1. 调用智谱大模型，请求只返回纯 JSON 数组，如 `["task1", "task2"]`。
    2. 若模型返回内容非合法 JSON，抛出 422 错误。
    """

    try:
        task_list = parse_tasks(req.prompt)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return ParseResponse(tasks=task_list.tasks)


# -----------------------------------------------------------------------------
# 基础系统路由
# 开发环境下运行代码：uvicorn main:app --reload 路由地址：http://127.0.0.1:8000/
# 生产环境下运行代码：uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
# -----------------------------------------------------------------------------


@app.get("/", summary="根路由")
async def index() -> dict[str, str]:
    """返回简单欢迎信息，用于验证服务是否就绪。"""

    return {"message": "Agent 服务已启动"}


@app.get("/health", summary="健康检查")
async def health() -> dict[str, str]:
    """Kubernetes/GCP Cloud Run 等容器平台可用的健康检查端点。"""

    return {"status": "ok"} 