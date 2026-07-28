import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
}

export function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 mb-4 text-xs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
