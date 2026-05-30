"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "全部", label: "全部" },
  { key: "教育", label: "🎓 教育" },
  { key: "科技", label: "💻 科技" },
  { key: "娱乐", label: "🎭 娱乐" },
  { key: "商业", label: "💼 商业" },
  { key: "生活方式", label: "🌿 生活方式" },
  { key: "游戏", label: "🎮 游戏" },
  { key: "其他", label: "📦 其他" },
];

interface CategoryFilterProps { active: string; onChange: (c: string) => void; }

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
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
