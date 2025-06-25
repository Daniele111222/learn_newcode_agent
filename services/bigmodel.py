"""bigmodel

对 `智谱 AI` 开放平台（https://open.bigmodel.cn）聊天接口的 **轻量级封装**。

默认使用的模型为 `GLM-4-FlashX-250414`；如需更换，可在初始化时指定其他 `model_name`。

示例用法：

```python
from bigmodel import get_bigmodel

client = get_bigmodel()

reply = client.chat([
    {"role": "user", "content": "你好，帮我写一首七言绝句"}
])
print(reply)
```
"""

# 依赖顺序：标准库 → 第三方 → 本地
import os
from functools import lru_cache
from typing import List, Dict, Any, Generator, Iterable

from dotenv import load_dotenv
from langchain_community.chat_models import ChatZhipuAI

# 立即加载 .env 文件中的环境变量
load_dotenv()

__all__ = ["get_bigmodel", "BigModelClient"]


class BigModelClient:
    """智谱 AI 对话模型客户端。

    仅封装最常用的非流式对话接口；若需使用流式、函数调用等高级特性，可自行扩展。
    """

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str = "GLM-4-FlashX-250414",
        base_url: str = "https://open.bigmodel.cn/api/paas/v4",
        timeout: int = 60,
    ) -> None:
        # 若未显式传入密钥，则尝试从环境变量读取
        if api_key is None:
            api_key = os.getenv("BIGMODEL_API_KEY")

        if not api_key:
            raise RuntimeError(
                "Missing BIGMODEL_API_KEY in environment. Please set it in your .env file."
            )

        # 初始化 LangChain 官方适配模型
        self.llm = ChatZhipuAI(
            api_key=api_key,
            api_base=base_url,  # 若使用默认平台，可不传；此处保持向后兼容。
            model=model_name,
            max_tokens=4096,
            temperature=0.7,
        )

        # 记录关键信息，便于调试
        self.timeout: int = timeout

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        stream: bool = False,
        **invoke_kwargs: Any,
    ) -> "str | Iterable[str]":
        """发送对话并返回助手回复文本（或流）。

        参数 `messages` 格式与 OpenAI Chat API 一致，例如：
        `[{'role': 'user', 'content': '你好'}]`
        若 `stream=True`，返回一个生成器，可逐步迭代字符串片段。
        """

        # LangChain 允许直接以 `(role, content)` 元组形式传递消息
        lc_messages: List[tuple[str, str]] = [
            (msg["role"], msg["content"]) for msg in messages
        ]

        if stream:
            # 返回生成器
            def _generator() -> Generator[str, None, None]:
                for chunk in self.llm.stream(lc_messages, **invoke_kwargs):
                    yield str(chunk.content)  # 确保产出为纯文本字符串

            return _generator()

        # 非流式，直接返回完整文本
        resp = self.llm.invoke(lc_messages, **invoke_kwargs)
        return str(resp.content)


@lru_cache(maxsize=1)
def get_bigmodel() -> BigModelClient:
    """单例方式返回 `BigModelClient` 实例。

    使用环境变量 `BIGMODEL_API_KEY` 读取密钥；未配置则抛出异常。
    """

    return BigModelClient()
