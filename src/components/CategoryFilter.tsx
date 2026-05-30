"use client";

const CATEGORIES = [
  { key: "全部", label: "全部" },
  { key: "教育", label: "教育" },
  { key: "科技", label: "科技" },
  { key: "娱乐", label: "娱乐" },
  { key: "商业", label: "商业" },
  { key: "生活方式", label: "生活" },
  { key: "游戏", label: "游戏" },
  { key: "其他", label: "其他" },
];

interface CategoryFilterProps { active: string; onChange: (c: string) => void; }

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            style={{
              backgroundColor: isActive ? "var(--surface-card)" : "transparent",
              color: isActive ? "var(--ink)" : "var(--muted)",
              border: isActive ? "1px solid var(--hairline)" : "1px solid transparent",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
