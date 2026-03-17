import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  highlight?: string;
}

export function StatCard({ label, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <div className="luxury-surface rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg border border-border bg-secondary p-3">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        {highlight && <span className="text-xs text-primary">{highlight}</span>}
      </div>
      <p className="gold-label mb-2">{label}</p>
      <p className="text-4xl text-foreground">{value}</p>
    </div>
  );
}
