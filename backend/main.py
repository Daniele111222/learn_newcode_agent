from __future__ import annotations

"""main

FastAPI 入口。
运行：uvicorn backend.main:app --reload
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.agent_executor import DiaryAgentExecutor
from backend.schemas import DiaryRequest, DiaryAnalysisResult

# 新增导入：文件上传与静态资源
import os
import uuid
from typing import Optional
from fastapi import UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles

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


# ------------------------ 图片上传与静态服务 ------------------------
# 基础配置：仅限制大小 100MB，其余不限制（按用户需求）
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100MB

# 确保上传目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 挂载静态目录方便前端直接访问
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def _ext_from_filename(name: str) -> str:
    """根据原始文件名提取扩展名，不做额外限制，避免路径穿越。"""
    base = os.path.basename(name)
    _, ext = os.path.splitext(base)
    # 统一为小写
    return ext.lower()


def _generate_save_name(ext: Optional[str]) -> str:
    """生成随机文件名，保持扩展名（如果有）。"""
    rand = uuid.uuid4().hex
    return f"{rand}{ext or ''}"


@app.post("/api/v1/upload", summary="上传图片（限制 100MB）")
async def upload_image(file: UploadFile = File(...)) -> dict:
    """接收前端上传的文件并保存，返回可访问的 URL。

    - 限制：最大 100MB；其余类型与尺寸不作限制（按需求）。
    - 存储：以随机文件名保存至 backend/uploads 目录，并通过 /uploads/ 静态路径访问。
    - 返回：{"url": "/uploads/<filename>"}
    """
    # 按用户需求：不做 MIME 白名单，仅限制体积
    ext = _ext_from_filename(file.filename or "")
    save_name = _generate_save_name(ext)
    save_path = os.path.join(UPLOAD_DIR, save_name)

    # 以流式读写并计数，超过限制则中止
    total = 0
    try:
        with open(save_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB/块
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    # 超限，删除半成品并报错
                    f.close()
                    try:
                        os.remove(save_path)
                    except OSError:
                        pass
                    raise HTTPException(status_code=413, detail="文件过大，限制 100MB")
                f.write(chunk)
    finally:
        await file.close()

    url = f"/uploads/{save_name}"
    return {"url": url}

"""
测试语句：
   $json = '{ "content": "今天很开心，做了一些值得骄傲的事。" }'
   Invoke-RestMethod -Uri http://127.0.0.1:8000/analyze-diary `
                     -Method Post `
                     -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
                     -ContentType 'application/json; charset=utf-8'
"""