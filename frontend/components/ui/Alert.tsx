import { type ReactNode } from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

type AlertVariant = "danger" | "success" | "warning" | "info";

const variantConfig = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    Icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    Icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    Icon: CheckCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    Icon: Info,
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

export function Alert({
  variant = "info",
  title,
  children,
}: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
    >
      <div className="flex gap-3">
        <config.Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.text}`} />
        <div className="min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold ${config.text}`}>{title}</h4>
          )}
          <div className={`text-sm ${config.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
