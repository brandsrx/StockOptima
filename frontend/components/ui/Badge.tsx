type BadgeVariant = "success" | "warning" | "danger" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-gray-50 text-gray-600 border-gray-200",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "Óptimo":
      return <Badge label={status} variant="success" />;
    case "En Reorden":
      return <Badge label={status} variant="warning" />;
    case "Crítico":
      return <Badge label={status} variant="danger" />;
    default:
      return <Badge label={status} variant="neutral" />;
  }
}
