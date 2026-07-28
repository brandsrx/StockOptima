import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Package } from "lucide-react";

export type ProductNodeData = {
  name: string;
  current_stock: number;
  status: string;
  sku: string;
};

type ProductNodeType = Node<ProductNodeData, "product">;

const STATUS_STYLES: Record<string, { border: string; dot: string; label: string; bg: string }> = {
  "Óptimo": {
    border: "#22c55e",
    dot: "#22c55e",
    label: "text-emerald-700 dark:text-emerald-400",
    bg: "rgba(34, 197, 94, 0.08)",
  },
  "En Reorden": {
    border: "#eab308",
    dot: "#eab308",
    label: "text-amber-700 dark:text-amber-400",
    bg: "rgba(234, 179, 8, 0.08)",
  },
  "Crítico": {
    border: "#ef4444",
    dot: "#ef4444",
    label: "text-red-700 dark:text-red-400",
    bg: "rgba(239, 68, 68, 0.08)",
  },
};

function ProductNode({ data }: NodeProps<ProductNodeType>) {
  const style = STATUS_STYLES[data.status] || STATUS_STYLES["Óptimo"];

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 shadow-sm cursor-pointer transition-shadow hover:shadow-md"
      style={{
        background: "var(--bg-secondary)",
        borderColor: style.border,
        minWidth: 170,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: style.dot }} />
        <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {data.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Stock: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{data.current_stock}</span>
        </span>
      </div>
      <div
        className="mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: style.bg, color: style.dot }}
      >
        {data.status}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" style={{ background: style.border }} />
      <Handle type="target" position={Position.Left} className="!bg-gray-400" style={{ background: style.border }} />
    </div>
  );
}

export default memo(ProductNode);
