"use client";

import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

const EMOJI: Record<string, string> = {
  教育: "🎓", 科技: "💻", 娱乐: "🎭", 商业: "💼",
  生活方式: "🌿", 游戏: "🎮", 其他: "📦",
};

const FILTER_ITEMS = [
  { key: "全部", label: "全部" },
  ...CATEGORIES.map((c) => ({ key: c, label: `${EMOJI[c] || ""} ${c}` })),
];

interface CategoryFilterProps { active: string; onChange: (c: string) => void; }

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_ITEMS.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            active === cat.key
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
