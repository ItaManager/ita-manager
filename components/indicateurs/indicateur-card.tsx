import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicateurCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "error";
  description?: string;
}

const variantStyles = {
  default: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    icon: "text-blue-500",
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-600",
    icon: "text-green-500",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    icon: "text-amber-500",
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-600",
    icon: "text-red-500",
  },
};

export function IndicateurCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  description,
}: IndicateurCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-xl p-6 border border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
          <p className={cn("text-3xl font-semibold tabular-nums", styles.text)}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", styles.bg)}>
          <Icon className={cn("size-6", styles.icon)} />
        </div>
      </div>
    </div>
  );
}
