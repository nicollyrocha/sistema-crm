import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  accent = "primary",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", accent === "secondary" && "text-secondary-accent")}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
