# AgentPlaza Design System — Neon Night Plaza

> 霓虹夜市广场：深空底色 + 霓虹光效 + 玻璃质感。每个 AI 角色都是夜市里的一个发光摊位。

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#070b1a` | 页面背景 |
| `--bg-surface` | `#0f1429` | 卡片、侧栏 |
| `--bg-elevated` | `#161d3b` | 悬浮层、对话框 |
| `--neon-cyan` | `#00e5ff` | 主强调色、链接、聚焦 |
| `--neon-pink` | `#ff2d95` | 次强调色、删除、危险 |
| `--neon-amber` | `#ffb74d` | 暖色点缀、星标 |
| `--neon-green` | `#00e676` | 成功、教育类 |
| `--text-primary` | `#e8eaf0` | 主文字 |
| `--text-secondary` | `#8890b0` | 副文字 |
| `--text-muted` | `#4a5078` | 禁用文字 |
| `--border-subtle` | `#1e2756` | 细边框 |
| `--border-glow` | `#00e5ff33` | 发光边框 |

## Typography

| Level | Font | Weight | Size |
|-------|------|--------|------|
| Display | **Orbitron** | 700 | `text-4xl` (hero) |
| Heading | **DM Sans** | 600-700 | `text-xl` ~ `text-2xl` |
| Body | **DM Sans** | 400 | `text-sm` ~ `text-base` |
| Mono | **JetBrains Mono** | 400 | `text-xs` (code) |

Font import: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400&family=Orbitron:wght@500;600;700;800&display=swap');`

## Spacing & Radius

- Card gap: `1rem` (grid)
- Section gap: `2rem`
- Card padding: `1.25rem`
- Border radius: `12px` (cards), `8px` (buttons/inputs), `full` (pills)
- Chat bubble radius: `16px` with asymmetric corner (user: br-sm, bot: bl-sm)

## Effects

| Element | Effect |
|---------|--------|
| Cards | `bg-surface` + `border-subtle` + neon glow on hover |
| Buttons | Neon border on focus, subtle scale on press |
| Category pills | Glass bg, neon text when active |
| Chat bubbles | Gradient bg for user, glass bg for bot |
| Loading | Neon pulse animation |
| Page entry | Staggered fade-up (animation-delay) |

## Components

### AgentCard
- Glass-morphism background (`bg-surface/80` + `backdrop-blur`)
- Subtle border that glows cyan on hover
- Category badge: colored pill with matching glow
- Avatar: gradient ring
- Scale + translateY on hover

### ChatInterface
- Bot messages: glass bg with left accent border
- User messages: neon gradient bg (cyan→blue)
- Input: glass bg with glow border on focus
- Sidebar: dark surface with subtle neon indicators for active conversation

### CategoryFilter
- Pill buttons with glass bg
- Active: neon cyan bg with glow
- Inactive: dark glass

## Motion

- Card hover: `transform scale(1.02) translateY(-4px)` + glow transition 200ms ease-out
- Message appear: `fadeInUp` 300ms ease-out
- Page load: staggered children with 50ms delay increments
- Neon pulse: `@keyframes neon-pulse { 0%,100% { opacity:1 } 50% { opacity:0.7 } }`
