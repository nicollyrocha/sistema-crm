import { cn } from "@/lib/utils";

type BarItem = { label: string; value: number; displayValue: string; colorClassName: string };

export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold text-foreground">{item.displayValue}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", item.colorClassName)}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
