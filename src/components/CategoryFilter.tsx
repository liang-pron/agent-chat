"use client";

const CATEGORIES = [
  { key: "全部", label: "全部", emoji: "" },
  { key: "教育", label: "教育", emoji: "🎓" },
  { key: "科技", label: "科技", emoji: "💻" },
  { key: "娱乐", label: "娱乐", emoji: "🎭" },
  { key: "商业", label: "商业", emoji: "💼" },
  { key: "生活方式", label: "生活", emoji: "🌿" },
  { key: "游戏", label: "游戏", emoji: "🎮" },
  { key: "其他", label: "其他", emoji: "📦" },
];

interface CategoryFilterProps {
  active: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background: isActive ? "rgba(0,229,255,0.15)" : "rgba(15,20,41,0.6)",
              color: isActive ? "#00e5ff" : "#8890b0",
              border: isActive ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(30,39,86,0.5)",
              boxShadow: isActive ? "0 0 12px rgba(0,229,255,0.1)" : "none",
              backdropFilter: "blur(8px)",
            }}
          >
            {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
