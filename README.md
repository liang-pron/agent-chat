<p align="center">
  <img src="https://img.shields.io/badge/AgentPlaza-AI%20角色广场-6366f1?style=for-the-badge" alt="AgentPlaza">
</p>

<h1 align="center">AgentPlaza</h1>
<p align="center">Import AI agent skills from GitHub. Chat instantly. Auto-categorized.</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-how-to-import-skills">Import Skills</a> ·
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **GitHub Skill Import** | Paste a GitHub repo URL → auto-parse `SKILL.md` → agent appears in plaza |
| 🎭 **Character Plaza** | Browse AI characters by category: Education, Tech, Entertainment, Business, etc. |
| 💬 **Real-time Chat** | Streaming chat powered by DeepSeek API, with markdown rendering |
| 🔑 **Bring Your Own Key** | Each user uses their own DeepSeek API key — you never pay for others |
| 🏷️ **Auto-Categorization** | LLM automatically classifies imported agents by domain |
| 📝 **Conversation Management** | Save, switch, rename, and delete conversations per agent |
| ✏️ **Agent Management** | Edit name, upload custom avatar, or delete agents |
| 🌐 **Vercel Ready** | One-click deploy to Vercel; Supabase-ready for production |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- A [DeepSeek API Key](https://platform.deepseek.com/api_keys) (cheap: ~¥2 per million output tokens)

### 1. Clone & Install

```bash
git clone https://github.com/liang-pron/agent-chat.git
cd agent-chat
npm install
```

### 2. Configure API Key

Copy `.env.example` to `.env` and add your key:

```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
```

> Get your key: https://platform.deepseek.com/api_keys

### 3. Initialize Database

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 4. Start

```bash
npm run dev
```

Open http://localhost:3000 — 5 demo agents are ready in the plaza.

---

## 📥 How to Import Skills

### From Any GitHub Repo with `SKILL.md`

AgentPlaza supports the standard [Agent Skills](https://agentskills.io) format (`SKILL.md` with YAML frontmatter):

```markdown
---
name: my-agent
description: Your agent description — what it does and when to use it
category: 教育
---

# Agent Identity

You are [character name]. Your traits:
- Speaking style: direct and sharp
- Knowledge areas: college admissions, career planning
...
```

1. Go to **Import** page
2. Paste the GitHub repo URL (e.g. `https://github.com/alchaincyf/zhangxuefeng-skill`)
3. Click Import — the agent appears in the plaza

### From `agent.json` (Simple Format)

```json
{
  "name": "张雪峰",
  "description": "高考志愿填报专家",
  "systemPrompt": "你是张雪峰...",
  "category": "教育",
  "model": { "provider": "deepseek", "model": "deepseek-chat" }
}
```

### Create Your Own

Fork the template repo, edit `SKILL.md`, and paste your fork's URL:

👉 https://github.com/liang-pron/agent-chat-template

---

## 🎮 Usage

| Action | How |
|--------|-----|
| **Chat** | Click any agent card → start talking |
| **Import** | Navbar "导入角色" → paste GitHub URL |
| **New conversation** | Chat page → "+" button in sidebar |
| **Switch conversation** | Click conversation in sidebar |
| **Rename conversation** | Hover conversation → ✏️ icon |
| **Delete conversation** | Hover conversation → 🗑️ icon |
| **Edit agent** | Hover agent card → ✏️ icon |
| **Set your API key** | Chat page → ⚙️ icon → paste key |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Database | SQLite (local) / PostgreSQL (production) |
| ORM | Prisma 7 |
| AI | Vercel AI SDK v6 + DeepSeek API |
| Markdown | react-markdown + remark-gfm |

---

## 🌍 Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set environment variable: `DEEPSEEK_API_KEY`
4. Deploy — your plaza is live at `xxx.vercel.app`

> For production data persistence, switch to Supabase PostgreSQL. See `.env.example` for config.

---

## 📂 Project Structure

```
agent-chat/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Plaza homepage
│   │   ├── chat/[agentId]/page.tsx   # Chat page + sidebar
│   │   ├── import/page.tsx           # Import page
│   │   └── api/                      # REST API routes
│   ├── components/
│   │   ├── AgentCard.tsx             # Character card
│   │   ├── ChatInterface.tsx         # Chat UI
│   │   ├── ConversationList.tsx      # Conversation sidebar
│   │   ├── CategoryFilter.tsx        # Category filter
│   │   ├── ImportForm.tsx           # Import form
│   │   └── AgentEditDialog.tsx      # Edit dialog
│   └── lib/
│       ├── agent-registry.ts         # Agent CRUD
│       ├── github-import.ts          # SKILL.md / agent.json parser
│       ├── classifier.ts             # Auto-categorization
│       ├── model-router.ts           # Model routing
│       ├── storage.ts                # Avatar upload
│       └── validators.ts            # Input validation
└── prisma/
    ├── schema.prisma                 # Data model
    └── seed.ts                       # Demo agents
```

---

## 🙋 FAQ

**Q: Do I need my own API key?**
A: Yes. Each user brings their own DeepSeek key. Your key is stored in your browser (localStorage), never on the server.

**Q: How much does it cost?**
A: DeepSeek charges ~¥2 per 1M output tokens (~3000 chat rounds). You can chat for hours on ¥10.

**Q: Can I use models other than DeepSeek?**
A: Yes. Set `provider: "custom"` in `agent.json` and configure any OpenAI-compatible endpoint.

**Q: What skill formats are supported?**
A: `SKILL.md` (standard agent skill format), `agent.json` (simple JSON config).

**Q: Where is chat history stored?**
A: Locally in SQLite (`prisma/dev.db`). Deploy with Supabase PostgreSQL for cloud persistence.

---

## 📄 License

MIT — do whatever you want with it.
