# IELTS Study Garden

React + TypeScript + Vite + Tailwind CSS 前端，Node.js / Express 服务端。项目独立于上级 Memory Garden，未修改上级应用或 IndexedDB。

## 开始

需要 Node.js 22.12+（推荐 24）。

```bash
cd /workspace/AAAA/ielts-study-garden
npm ci --cache /workspace/.npm-cache
cp .env.example .env
# 在 .env 中填写 AI_API_KEY（仅服务端），可配置 OPENAI_MODEL
npm run dev
```

开发：Vite 5173，Node 3001；Vite 将 `/api` 代理至服务端。`npm run build` 执行 TypeScript 检查并生成 dist；`npm start` 在 3001 同时提供生产前端和 API。`npm test` 验证请求及 AI 返回结构。密钥不得使用 `VITE_` 前缀，`.env` 已忽略。也支持已有服务端 `OPENAI_API_KEY`。部署需要 Node 服务，不适用于纯静态 GitHub Pages。个人应用不含账号及访问控制，部署至互联网需自行加身份验证。

## 先使用听力、阅读和写作

- Listening → 导入词汇：每行一个 `word` 或 `word | 中文`，支持 TXT/TSV/简单两列 CSV（不支持带引号的多行 CSV）。播放采用浏览器英式语音优先，不提前显示答案；拼写检查、语速、随机、全部、错词与到期练习可直接使用。
- Reading → 导入词汇：可手动填写释义和同义词，也可 AI 补全释义、词性、例句、同义词。英译中采用 AI 语义判分；中译英与同义选择本地判分。原文、题目、自己的答案、正确答案可一起粘贴进行错题分析，结果存入素材库；词汇可加入练习。
- Writing：支持 Task1/Task2，原始材料无需 AI 即可保存。AI 提炼句型、分类、中文说明、适用场景和可替换结构。我的素材支持收藏、编辑、复制和填空练习。
- Library：搜索单词、解释、同义词与素材，编辑词义/同义词，筛选错词与收藏、查看最近30条练习、JSON 合并导入/导出、确认删除。首页统计和今日目标来自真实使用，无虚构学习记录。

## 口语素材（暂不提供 AI 互动）

保留 Part1/Part2/Part3 真实材料保存、AI 文字整理及串题匹配，支持完整稿/关键词/无提示练习。按当前需求不提供 AI 模拟考官、语音问答、录音转录、模拟考试计时或考试反馈；服务端也不接受 exam/feedback 任务。既有素材和学习记录保留，不清除之前保存的考官图片。

## 本地数据与复习

使用独立 localStorage 键 `ielts-study-garden-v1`，不读取或更改原剪贴簿的数据。刷新保留；不同域名、端口、浏览器不会共享。错答10分钟后到期，答对按正确次数增加到1/2/4/8/16/30天。历史错误次数保留，错词筛选可随时重练。JSON 导入校验结构并按ID合并，已有记录优先。存档异常时不覆盖原始存档，可导出原始数据；写入失败显示提示。请定期导出，清理浏览器数据会丢失记录。本地存储容量通常约5MB，大量学习材料建议后续迁移 IndexedDB。

## AI 与验证边界

所有 AI 请求由 `/api/ai` 服务端发送至 `api.openai.com`，模型环境变量可配置；请求限长、超时，Zod 校验请求和响应，UI 显示失败。缺少密钥时返回503提示，不伪造结果。原材料、单词导入、本地拼写、统计、收藏与备份不依赖 AI。AI 内容可能出错，应核对原文与释义。

已验证构建、数据格式测试及 Chromium 本地练习/存储流程。没有密钥时不能验证真实 AI 质量。

## 扩展位置

`src/store.ts`：数据模型、校验、复习；`src/main.tsx`：四科界面和交互；`src/style.css`：响应式手账主题；`server/schema.mjs`：AI 任务契约与提示词；`server/index.mjs`：API、生产静态托管。后续可将四科组件拆分并引入 IndexedDB 存储层。

浏览器回归：先启动 `npm run dev`，另一个终端运行 `npm run test:browser`；默认使用 `/usr/bin/chromium`，可用 `CHROMIUM_PATH` 指定。涵盖真实本地听写、错词、存储、阅读同义词和写作填空，写作 AI 响应测试明确使用模拟数据，不代表真实 API 已验证。口语互动入口已移除，浏览器测试确认素材保存仍可用。

## GitHub Pages

仓库 Actions 工作流保留原站，并将本应用发布在 `https://xuz8999-bit.github.io/AAAA/ielts/`。仓库 Settings → Pages 的 Source 需为 GitHub Actions。推送 main 后由工作流构建、发布。

`npm run build:pages` 使用 `/AAAA/ielts/` 资源路径和明确的静态模式：不向 GitHub Pages 请求 AI API，也不包含密钥。词汇、听写、素材手动保存和 JSON 备份可用；AI 分析仍需要 Node 服务端。此网址是发布目标；工作流成功及线上响应检查后才可确认上线。

## Word / 图片词汇导入与自动播报

听力和阅读的“导入词汇”支持 `.docx`、`.jpg/.jpeg`、PNG、WebP，以及原有文本格式。Word 表格按单词与释义配对；图片使用 Tesseract.js 在浏览器中识别中英文，不调用 AI、不上传文档或图片。结果放入可编辑文本框，核对后保存；可展开提取原文检查未配对内容。支持20MB以内文件，旧版 `.doc` 请先在 Word 中另存为 `.docx`。复杂排版、模糊照片、手写体可能识别或配对错误，请先裁剪为清晰词汇表并核对，不会自动生成缺失释义。

听力只播报英文列，中文仅作保存后的释义和答题反馈。点击“下一题”会立即播放下一词；拼写判分忽略大小写和首尾空格。

`npm ci` 的 postinstall 与构建前置脚本自动准备 `public/ocr` 的 worker、WASM 和中英文模型，来自锁定的 npm 包；这些生成文件不提交 Git。Pages 构建将它们与站点一起发布，无需外部 OCR CDN，首次识别约需下载10MB的模型与运行库。入口代码、Word 解析器和 OCR 依赖按需加载，不在首页加载识别模型。
