<p align="center">
  <img src="https://img.shields.io/badge/AgentPlaza-AI角色广场-6366f1?style=for-the-badge" alt="AgentPlaza">
</p>

<h1 align="center">AgentPlaza</h1>

<!-- ========== 纯 CSS 语言切换容器 ========== -->
<div class="lang-wrap">

<style>
  /* 隐藏 radio */
  .lang-wrap > input[type="radio"] {
    display: none;
  }
  /* 标签按钮基础样式 */
  .lang-wrap > .lang-label {
    display: inline-block;
    padding: 6px 20px;
    font-size: 14px;
    font-weight: 600;
    border: 2px solid #6366f1;
    cursor: pointer;
    user-select: none;
  }
  .lang-label-zh {
    border-radius: 6px 0 0 6px;
    background: #6366f1; color: #fff;
  }
  .lang-label-en {
    border-radius: 0 6px 6px 0;
    background: #fff; color: #6366f1;
  }
  /* zh 选中时：zh 标签高亮，en 标签褪色 */
  #lang-radio-zh:checked ~ .lang-label-zh {
    background: #6366f1; color: #fff;
  }
  #lang-radio-zh:checked ~ .lang-label-en {
    background: #fff; color: #6366f1;
  }
  /* en 选中时：en 标签高亮，zh 标签褪色 */
  #lang-radio-en:checked ~ .lang-label-zh {
    background: #fff; color: #6366f1;
  }
  #lang-radio-en:checked ~ .lang-label-en {
    background: #6366f1; color: #fff;
  }
  /* 内容显隐：zh 选中时显示中文、隐藏英文 */
  #lang-radio-zh:checked ~ .content-en {
    display: none;
  }
  #lang-radio-zh:checked ~ .content-zh {
    display: block;
  }
  /* en 选中时显示英文、隐藏中文 */
  #lang-radio-en:checked ~ .content-en {
    display: block;
  }
  #lang-radio-en:checked ~ .content-zh {
    display: none;
  }
</style>

<input type="radio" id="lang-radio-zh" name="lang-switch" checked>
<input type="radio" id="lang-radio-en" name="lang-switch">

<div align="center" style="margin: 16px 0;">
  <label for="lang-radio-zh" class="lang-label lang-label-zh">中文</label><!--
  --><label for="lang-radio-en" class="lang-label lang-label-en">English</label>
</div>

<!-- ==================== 中文内容 ==================== -->
<div class="content-zh">

<p align="center"><strong>AI 角色广场——导入、聊天、即开即用</strong></p>
<p align="center">
  从 GitHub 一键导入 AI 角色，立即开始对话。
  <br>
  所有角色自动分类，你的 API Key 自己保管，无需付费。
</p>

<p align="center">
  <a href="#-为什么做这个">为什么做这个</a> ·
  <a href="#-功能介绍">功能介绍</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-导入角色">导入角色</a> ·
  <a href="#-使用指南">使用指南</a> ·
  <a href="#-常见问题">常见问题</a>
</p>

---

## 💡 为什么做这个

起初，我只是想用 AI Agent 的 Skills 功能跟「张雪峰」老师聊聊天、问问高考相关问题，纯属娱乐。但实际操作下来发现，在 Claude Code 或 Codex 这类命令行工具里反复加载 skill、切换角色非常繁琐——每次聊天都要敲命令、配参数，一不小心还会跟工作项目混在一起。

于是我做了一个决定：**把娱乐和工作彻底分开**，专门写一个网页来承载这些 AI 角色。AgentPlaza 就这样诞生了——一个纯粹的 AI 角色广场，打开浏览器就能聊，不需要任何命令行操作。

---

## ✨ 功能介绍

**AgentPlaza 是一个 AI 角色广场**，你可以在这里和各种各样的 AI 角色聊天。每个角色都有独特的性格、知识领域和说话风格——有的能帮你填高考志愿，有的能陪你练口语，有的能当你的专属技术顾问。

<table>
  <tr>
    <td width="50%">
      <strong>🔗 一键导入</strong><br>
      粘贴 GitHub 仓库链接，自动解析角色配置，秒级上线。
    </td>
    <td width="50%">
      <strong>🎭 角色广场</strong><br>
      浏览所有角色，按分类筛选：教育、科技、娱乐、商业……
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>💬 实时对话</strong><br>
      流式输出，Markdown 渲染，打字机般的聊天体验。
    </td>
    <td width="50%">
      <strong>🔑 自带 Key</strong><br>
      DeepSeek API Key 存在你的浏览器里，不上传服务器，不用替别人买单。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>🏷️ 自动分类</strong><br>
      导入角色时 AI 自动识别领域，无需手动打标签。
    </td>
    <td width="50%">
      <strong>📝 多轮对话</strong><br>
      每个角色支持多组对话，随时新建、切换、重命名、删除。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>✏️ 角色管理</strong><br>
      编辑角色信息、上传自定义头像、删除不需要的角色。
    </td>
    <td width="50%">
      <strong>📎 文件对话</strong><br>
      上传文件（图片、PDF、文档），和角色围绕文件内容展开讨论。
    </td>
  </tr>
</table>

---

## 🚀 快速开始

### 你需要准备

- 一台能跑 Node.js 的电脑（版本 18 以上）
- 一个 [DeepSeek API Key](https://platform.deepseek.com/api_keys)（费用极低，100 万输出 token 大约 ¥2）

### 第一步：下载项目

```bash
git clone https://github.com/liang-pron/agent-chat.git
cd agent-chat
npm install
```

### 第二步：设置 API Key

复制 `.env.example` 为 `.env`，填入你的 DeepSeek Key：

```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY=sk-你的key
```

> 没有 Key？去 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 免费注册即可获取。

### 第三步：初始化数据库

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 第四步：启动

```bash
npm run dev
```

打开浏览器访问 **http://localhost:3000**，广场上已经有 5 个演示角色等你来聊。

---

## 📥 导入角色

### 从 GitHub 导入（推荐）

AgentPlaza 支持标准的 [Agent Skills](https://agentskills.io) 格式——只要 GitHub 仓库里有 `SKILL.md` 文件，就能一键导入：

1. 点击导航栏的 **「导入角色」**
2. 粘贴 GitHub 仓库地址（比如 `https://github.com/alchaincyf/zhangxuefeng-skill`）
3. 点击导入——角色立刻出现在广场上

### `SKILL.md` 长什么样？

```markdown
---
name: my-agent
description: 用一句话说明这个角色能帮你做什么
category: 教育
---

# 角色设定

你是 [角色名称]。你的特点：
- 说话风格：直率犀利
- 擅长领域：高考志愿填报、职业规划
...
```

### 也可以用 `agent.json`

```json
{
  "name": "张雪峰",
  "description": "高考志愿填报专家",
  "systemPrompt": "你是张雪峰...",
  "category": "教育",
  "model": { "provider": "deepseek", "model": "deepseek-chat" }
}
```

### 创建你自己的角色

Fork 我们的模板仓库，改一下 `SKILL.md`，粘贴你的 Fork 地址就能导入：

👉 [agent-chat-template](https://github.com/liang-pron/agent-chat-template)

---

## 📖 使用指南

| 你想做什么 | 操作方法 |
|-----------|---------|
| **和角色聊天** | 在广场点击任意角色卡片，进入对话 |
| **导入新角色** | 导航栏点击「导入角色」，粘贴 GitHub 链接 |
| **新建对话** | 聊天页左侧边栏点击「+」按钮 |
| **切换对话** | 点击左侧边栏中的对话记录 |
| **重命名对话** | 鼠标悬停在对话上，点击 ✏️ 图标 |
| **删除对话** | 鼠标悬停在对话上，点击 🗑️ 图标 |
| **编辑角色** | 鼠标悬停在角色卡片上，点击 ✏️ 图标 |
| **删除角色** | 在角色编辑弹窗中点击删除（支持批量选择） |
| **设置 API Key** | 聊天页面点击 ⚙️ 图标，粘贴你的 Key |
| **上传文件对话** | 聊天输入框旁点击 📎，上传图片/PDF/文档 |

---

## 🌍 部署到 Vercel

1. 把项目推送到 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 部署完成——你的广场地址：`xxx.vercel.app`

> 💡 生产环境建议使用 Supabase PostgreSQL 替代 SQLite，在 `.env` 中配置 `DATABASE_URL` 即可。

---

## 🙋 常见问题

### 需要自己买 API Key 吗？

**是的。** 每个用户用自己的 DeepSeek Key，Key 存在你浏览器的 localStorage 里，不会上传到服务器。你只为自己使用付费。

### 聊天花钱吗？贵不贵？

DeepSeek 目前的价格大约是 **100 万输出 token 收 ¥2**（约等于 3000 轮对话）。充值 ¥10 可以聊很久。

### 能用其他模型吗？

可以。DeepSeek 之外，配置中还支持 OpenAI、Anthropic 等兼容接口的模型。

### 支持哪些角色格式？

- `SKILL.md`（标准 Agent Skill 格式，推荐）
- `agent.json`（简单 JSON 配置）

### 聊天记录存在哪？

默认存在本地 SQLite 数据库（`prisma/dev.db`）。部署到服务器时切换到 PostgreSQL 即可云端持久化。

### 可以批量管理角色吗？

可以。编辑角色时支持批量选择删除，方便清理不再需要的角色。

---

## 📄 开源协议

MIT —— 自由使用，随便折腾。

</div>

<!-- ==================== English Content ==================== -->
<div class="content-en" style="display:none;">

<p align="center"><strong>AI Agent Plaza — Import, Chat, Ready to Go</strong></p>
<p align="center">
  One-click import AI agents from GitHub, start chatting instantly.
  <br>
  All agents auto-categorized. Your API key, your control — no hidden costs.
</p>

<p align="center">
  <a href="#-why-i-built-this">Why I Built This</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-import-agents">Import Agents</a> ·
  <a href="#-usage-guide">Usage Guide</a> ·
  <a href="#-faq">FAQ</a>
</p>

---

## 💡 Why I Built This

It started as pure fun — I wanted to chat with a "Zhang Xuefeng" AI agent using Claude Code's Skills feature, asking college application questions just for laughs. But the reality was frustrating: loading skills in CLI tools like Claude Code or Codex meant typing commands every single time, juggling parameters, and constantly worrying about mixing entertainment into my actual work projects.

So I made a simple decision: **separate work from play, completely.** I built a dedicated web interface just for AI characters — no command line, no config files, no friction. That's how AgentPlaza was born. Open a browser tab, click an agent, start chatting. That's it.

---

## ✨ Features

**AgentPlaza is an AI character plaza** where you can chat with a wide variety of AI agents. Each agent has a unique personality, expertise, and speaking style — some can help with college applications, some can practice language with you, and some can be your personal tech consultant.

<table>
  <tr>
    <td width="50%">
      <strong>🔗 One-Click Import</strong><br>
      Paste a GitHub repo URL — auto-parse agent config, live in seconds.
    </td>
    <td width="50%">
      <strong>🎭 Agent Plaza</strong><br>
      Browse all agents, filter by category: Education, Tech, Entertainment, Business…
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>💬 Real-Time Chat</strong><br>
      Streaming responses with Markdown rendering — a typewriter-like chat experience.
    </td>
    <td width="50%">
      <strong>🔑 Bring Your Own Key</strong><br>
      Your DeepSeek API key stays in your browser. Never uploaded, never shared.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>🏷️ Auto-Categorization</strong><br>
      AI automatically classifies imported agents — no manual tagging needed.
    </td>
    <td width="50%">
      <strong>📝 Multi-Conversation</strong><br>
      Multiple conversations per agent. Create, switch, rename, or delete anytime.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>✏️ Agent Management</strong><br>
      Edit agent info, upload custom avatars, or remove unwanted agents.
    </td>
    <td width="50%">
      <strong>📎 File Chat</strong><br>
      Upload files (images, PDFs, documents) and discuss their content with agents.
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- A computer with Node.js 18+
- A [DeepSeek API Key](https://platform.deepseek.com/api_keys) (super cheap: ~$0.14 per million output tokens)

### Step 1: Clone & Install

```bash
git clone https://github.com/liang-pron/agent-chat.git
cd agent-chat
npm install
```

### Step 2: Configure API Key

Copy `.env.example` to `.env` and add your key:

```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY=sk-your-key-here
```

> No key yet? Sign up for free at [platform.deepseek.com](https://platform.deepseek.com/api_keys).

### Step 3: Initialize Database

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### Step 4: Launch

```bash
npm run dev
```

Open **http://localhost:3000** — 5 demo agents are waiting for you in the plaza.

---

## 📥 Import Agents

### From GitHub (Recommended)

AgentPlaza supports the standard [Agent Skills](https://agentskills.io) format — any GitHub repo with a `SKILL.md` file can be imported in one click:

1. Click **"Import"** in the navbar
2. Paste a GitHub repo URL (e.g. `https://github.com/alchaincyf/zhangxuefeng-skill`)
3. Click Import — the agent appears in the plaza instantly

### What does `SKILL.md` look like?

```markdown
---
name: my-agent
description: A one-liner describing what this agent does
category: Education
---

# Agent Identity

You are [agent name]. Your traits:
- Speaking style: direct and sharp
- Expertise: college admissions, career planning
...
```

### Or use `agent.json`

```json
{
  "name": "Zhang Xuefeng",
  "description": "College application expert",
  "systemPrompt": "You are Zhang Xuefeng...",
  "category": "Education",
  "model": { "provider": "deepseek", "model": "deepseek-chat" }
}
```

### Create Your Own Agent

Fork our template repo, edit `SKILL.md`, and paste your fork's URL:

👉 [agent-chat-template](https://github.com/liang-pron/agent-chat-template)

---

## 📖 Usage Guide

| What You Want | How To Do It |
|--------------|--------------|
| **Chat with an agent** | Click any agent card in the plaza |
| **Import a new agent** | Click "Import" in navbar, paste GitHub link |
| **New conversation** | Click "+" in the chat sidebar |
| **Switch conversation** | Click a conversation in the sidebar |
| **Rename conversation** | Hover over conversation → ✏️ icon |
| **Delete conversation** | Hover over conversation → 🗑️ icon |
| **Edit agent** | Hover over agent card → ✏️ icon |
| **Delete agents** | Edit dialog → delete (supports batch selection) |
| **Set API Key** | Chat page → ⚙️ icon → paste your key |
| **Chat with files** | Click 📎 next to input → upload images/PDFs/docs |

---

## 🌍 Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set environment variable: `DEEPSEEK_API_KEY`
4. Deploy — your plaza is live at `xxx.vercel.app`

> 💡 For production, switch to Supabase PostgreSQL by setting `DATABASE_URL` in `.env`.

---

## 🙋 FAQ

### Do I need my own API key?

**Yes.** Each user uses their own DeepSeek key. Your key is stored in your browser's localStorage, never uploaded to any server. You only pay for your own usage.

### How much does it cost?

DeepSeek charges about **$0.14 per 1M output tokens** (~3,000 chat rounds). A few dollars goes a long way.

### Can I use other models?

Yes. Beyond DeepSeek, the config also supports OpenAI, Anthropic, and other OpenAI-compatible endpoints.

### What agent formats are supported?

- `SKILL.md` (standard Agent Skill format, recommended)
- `agent.json` (simple JSON config)

### Where is chat history stored?

By default in a local SQLite database (`prisma/dev.db`). Switch to PostgreSQL for cloud persistence when deploying.

### Can I batch manage agents?

Yes. The edit dialog supports batch-select deletion for cleaning up unwanted agents.

---

## 📄 License

MIT — do whatever you want with it.

</div>

</div><!-- end lang-wrap -->
