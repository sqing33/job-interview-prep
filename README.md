# Interview Dossier

一个本地优先的面试学习 Web 应用。用户提供招聘信息和个人简历后，应用会通过 OpenAI SDK 分析岗位与经历，生成按类别分组的 30/40/50 道面试题和参考答案，并把结果保存到本地 SQLite 历史记录中。

## 功能

- 粘贴或上传 `PDF / DOCX / TXT / Markdown` 形式的招聘信息与简历
- 服务端解析文本，用户可在提交前手工修正
- 前端会话级输入 OpenAI API Key 和自定义 API URL，不写入数据库或浏览器持久化存储
- 使用 OpenAI Responses API + 结构化输出生成题库
- 题库按 `技术题 / 项目题 / 行为题 / 岗位匹配题` 分组
- 历史记录保存到本地 SQLite，可回看、复用材料、删除

## 本地运行

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 `http://localhost:3000`。

## 环境变量

`.env.local` 支持以下变量：

```bash
OPENAI_BASE_URL=
APP_DATABASE_PATH=./data/interview-prep.sqlite
```

- `OPENAI_BASE_URL`：可选，服务端默认 API URL；页面里填写的自定义 API URL 会优先覆盖它
- `APP_DATABASE_PATH`：可选，自定义本地 SQLite 文件路径

## 校验命令

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

## 说明

- 首次安装后如果 `better-sqlite3` 缺少原生绑定，可在其包目录重新执行一次安装脚本。
- PDF 仅保证支持“可提取文本”的文档；扫描版 PDF 需要用户手动检查或补充文本。
- 页面里的 API URL 建议填写到 `/v1` 层级，例如 `https://your-gateway.example/v1`。
