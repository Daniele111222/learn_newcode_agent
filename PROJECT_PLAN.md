# 项目规划（AI Diary / Agent System）

本文档用于指导本项目的系统性建设与迭代，涵盖五层架构、接口契约、数据与记忆设计、关键流程、可观测性、测试交付与里程碑路线图等内容。我们会基于此文件持续评审与更新。

## 1. 愿景与目标
- 愿景：构建一个以“任务分解 + 智能体执行 + 记忆增强”为核心的个人情绪日记分析系统，提供从日记写作到情绪洞察与建议的端到端体验。
- 目标：
  - 让用户能高质量地记录日记，并一键触发情绪分析任务；
  - 实时可视化任务进度，提供结构化的分析与建议；
  - 随着使用积累，记忆层不断增强，输出越发个性化；
  - 架构清晰，具备扩展其他领域 Agent 的可复用性。

## 2. 范围（MVP）
- 前端：日记编辑、任务触发、进度订阅（SSE）、结果展示、错误反馈与重试；
- 后端：API 网关、任务分解器、智能体执行器、数据与记忆层；
- 数据：任务/事件持久化、日记存储、嵌入与向量检索；
- 非功能：日志、指标、Tracing、限流、鉴权、健康检查、基础测试与部署。

## 3. 五层架构与职责边界
- 前端界面层（Ai_diary/React + Vite）
  - 职责：用户交互、任务创建、SSE 实时进度、结果呈现、错误与重试。
  - 依赖：API 网关；SSE（或 WebSocket）事件流。
- API 网关层（FastAPI）
  - 职责：对外统一入口；鉴权、限流、路由聚合、错误与日志统一、健康检查。
  - 依赖：任务分解层、智能体执行层、数据与记忆层。
- 任务分解层（Task Decomposer）
  - 职责：将用户意图/数据转为可执行 Plan（DAG/有序步骤）；工具选择与参数补全。
  - 依赖：记忆层（上下文增强）。
- 智能体执行层（Agent Executor）
  - 职责：按 Plan 调度执行（工具/LLM），重试、断点、回退、可取消；输出事件流。
  - 依赖：工具注册、LLM 封装、数据与记忆层。
- 数据与记忆层（PostgreSQL + pgvector/FAISS + Redis）
  - 职责：任务/事件/日记/记忆/嵌入/缓存；数据治理与备份。

## 4. 关键流程（端到端）
- 提交“分析日记”任务
  1) 前端提交创建任务请求（diary_analysis）；
  2) API 网关校验、持久化，返回 task_id；
  3) 前端使用 task_id 订阅 SSE（/tasks/{id}/events）；
  4) 任务分解层生成 Plan（摘要→情绪分析→建议生成）；
  5) 执行层按步骤执行，持续推送 TaskEvent（Started/Progress/Partial/Completed/Failed）；
  6) 结果与摘要写入记忆层，前端更新 UI 并可重试或新建任务。

- SSE 事件规范（建议）
  - event types：started/progress/log/partial_result/completed/failed/cancelled
  - payload：{ ts, level, stage, message, progress, partial_result?, error? }
  - 关联：task_id（correlation_id）、step_id

## 5. API 契约（v1 初稿）
- 统一约定
  - 前缀：/api/v1
  - 响应包裹：{ code, message, data }
  - 鉴权：Authorization: Bearer <token>（后续可扩展 OAuth2/Session）
  - 错误：HTTP 状态码 + code（BadRequest/Unauthorized/RateLimited/InternalError...）
  - CORS：仅允许前端域名；允许 SSE 头

- 任务 API
  - POST /api/v1/tasks
    - body: { type: "diary_analysis", payload: { diary_id | text }, options?: { priority?, timeout? } }
    - resp: { task_id }
  - GET /api/v1/tasks/{task_id}
    - resp: { task_id, type, status, result_summary?, created_at, updated_at }
  - GET /api/v1/tasks/{task_id}/events (SSE)
    - stream: TaskEvent（见上）
  - POST /api/v1/tasks/{task_id}/cancel
    - resp: { task_id, status: "cancelled" }

- 日记 API
  - POST /api/v1/diaries
    - body: { title?, content }
    - resp: { id }
  - GET /api/v1/diaries/{id}
    - resp: { id, title?, content, created_at }

- 记忆 API
  - POST /api/v1/memories/search
    - body: { query, top_k?, filters? }
    - resp: { items: [{ id, content, score, metadata? }] }
  - POST /api/v1/memories/upsert
    - body: { id?, text, metadata? }
    - resp: { id }

- 非功能性
  - 幂等：创建任务支持 Idempotency-Key；
  - 速率限制：IP/Token 粒度；
  - 健康检查：/healthz、/readyz；
  - 追踪：trace_id 注入与透传。

## 6. 数据与记忆设计（初稿）
- 关系模型（PostgreSQL）
  - users(id, …)
  - diaries(id, user_id, title, content, created_at)
  - tasks(id, user_id, type, status, payload_json, result_json, created_at, updated_at)
  - task_events(id, task_id, ts, level, stage, message, payload_json)
  - memories(id, user_id, content, metadata_json, created_at, updated_at)
  - embeddings(memory_id, vector)  // pgvector 或外部向量库
- 向量存储
  - pgvector（生产建议）或 FAISS（开发过渡）
  - 记录 embedding_provider 与模型版本，便于重建；
- 缓存与幂等（Redis）
  - idempotency_keys、task_locks、热数据缓存。

## 7. 目录结构规范（建议）
- 前端（已存在）
  - d:/Agent/Ai_diary/src
    - pages/（Diary/Analytics/History/Settings 等）
    - components/（Sidebar、通用组件）
    - api/（client.ts、tasks.ts、diaries.ts、memories.ts）
    - stores/（状态管理）
    - utils/、assets/、index.css、App.tsx、main.tsx
- 后端（建议重构）
  - d:/Agent/backend/
    - api_gateway/
      - main.py（FastAPI app，路由与中间件聚合）
      - routers/（v1：tasks.py、diaries.py、memories.py、health.py）
      - schemas.py（对外 Pydantic 模型）
      - deps.py（依赖注入：DB、auth、rate limit）
      - errors.py（异常与错误码）
    - task_decomposer/
      - planner.py（规则/Prompt 分解器）
      - plan_schema.py（Plan/Step/依赖/超时/重试）
    - agent_executor/
      - executor.py（调度、状态机、重试、取消）
      - events.py（事件模型、SSE 网关适配）
      - tool_registry.py（工具注册与发现）
      - llm_client.py（LLM 封装、重试与超时）
    - memory/
      - repositories.py（任务/事件/日记/记忆 CRUD）
      - vector_store.py（pgvector/FAISS 封装）
      - cache.py（Redis）
    - common/
      - config.py、logging.py、observability.py（Tracing/Metrics）、utils.py

## 8. 可观测性与安全
- 日志：结构化 JSON（trace_id、task_id、route、duration、status、error）
- 指标：请求量/延迟/错误率、任务耗时分布、工具成功率、队列堆积
- 追踪：API→分解→执行全链路追踪，关联 task_id
- 安全：输入校验、防提示注入、速率限制、Secrets 管理（.env + Vault/KeyVault）

## 9. 测试与质量保障
- 单测：planner、executor、工具适配器、repositories（pytest/pytest-asyncio）
- 集成：API + DB/Redis（testcontainers 或 docker-compose）
- 契约：OpenAPI + 合约测试（前后端契约同步）
- E2E：前后端联调（包含 SSE）
- 性能：任务创建与事件流压测；LLM 超时与重试策略验证
- CI：lint、unit、integration、contract、e2e（按阶段）

## 10. 部署与环境
- 本地：Docker Compose（postgres、redis、backend、(optional) pgvector/FAISS）
- 测试：自动化部署、沙箱 key、低成本 LLM
- 生产：水平扩展、限流与熔断、蓝绿/灰度发布、监控与告警

## 11. 路线图与里程碑
- M1（API 网关 MVP，1-2 天）
  - 路由/中间件（鉴权、错误、日志）、/healthz
  - 任务：POST /tasks、GET /tasks/{id}、SSE /tasks/{id}/events（先用模拟事件）
  - 验收：前端能创建任务并实时看到事件
- M2（任务分解与执行 MVP，2-4 天）
  - planner：将 diary_analysis 拆解为步骤 Plan
  - executor：按步骤执行（含重试与取消），事件回放
  - 工具注册：至少 1-2 个实用工具；LLM 封装（可先 Mock）
- M3（记忆与向量检索，2-3 天）
  - 向量入库/检索、会话记忆增强分析
- M4（可观测性与稳定性，1-2 天）
  - 结构化日志、Metrics、Tracing、限流上线
- M5（产品化打磨，持续）
  - 前端体验优化、权限模型、更多任务类型与工具生态

## 12. 风险与应对
- LLM 不稳定/超时：重试与降级；后端超时控制与中断；
- 向量索引规模增长：异步批处理与离线重建策略；
- 流式通道断连：SSE 自动重连、幂等事件处理；
- 成本不可控：对高成本调用做配额与缓存；引入更经济的推理服务。

## 13. 开放问题（待决策）
- 鉴权方式：先 Token 还是先免鉴权（本地）？
- SSE 与 WebSocket：短期继续 SSE，后续是否切 WS？
- 向量存储：短期 FAISS 还是一次上 pgvector？
- 任务调度：是否需要任务队列 & 多 worker（Celery/RQ）？

## 14. 术语
- Plan：任务分解后的执行计划（步骤及依赖）
- TaskEvent：执行过程中产生的事件（用于前端实时渲染）
- Memory：系统收集的长期信息，用于上下文增强

## 15. 变更记录
- v0.1：创建文档与初始架构规划

---

## 附录：立即执行的下一步（建议）
- 后端
  - 新建 backend/api_gateway/ 目录，创建 main.py、routers/tasks.py、routers/health.py、schemas.py、errors.py；
  - 实现 /api/v1/tasks（含 SSE 模拟事件）与 /healthz；
- 前端
  - 新增 src/api/client.ts 与 src/api/tasks.ts，统一请求与任务 API；
  - 在 Diary 页面使用 createTask + 订阅 SSE，渲染进度与结果。

勾选清单（初始）
- [ ] 创建后端 api_gateway 骨架
- [ ] 打通 SSE 事件流（模拟）
- [ ] 前端对接 API Client 与 SSE
- [ ] 任务分解器 MVP（规则/Prompt）
- [ ] 执行器 MVP（步骤调度/重试/取消）
- [ ] 向量与记忆 MVP
- [ ] 可观测性 MVP（日志/指标/Tracing）
- [ ] Docker Compose 与部署脚本