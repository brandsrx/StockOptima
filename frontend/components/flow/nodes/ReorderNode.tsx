import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";

export type ReorderNodeData = { reorder_point: number; current_stock: number };

type ReorderNodeType = Node<ReorderNodeData, "reorder">;

function ReorderNode({ data }: NodeProps<ReorderNodeType>) {
  const isBelow = data.current_stock <= data.reorder_point;

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 shadow-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: isBelow ? "#fca5a5" : "#fde047",
        minWidth: 140,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {isBelow && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Pto. Reorden
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        r = <span className="font-bold" style={{ color: isBelow ? "#dc2626" : "#a16207" }}>{data.reorder_point} uds</span>
      </p>
      {isBelow && (
        <p className="text-[10px] mt-1 font-medium text-red-600 dark:text-red-400">
          ¡Stock por debajo!
        </p>
      )}
      <Handle type="source" position={Position.Right} className={isBelow ? "!bg-red-400" : "!bg-yellow-400"} />
      <Handle type="target" position={Position.Left} className={isBelow ? "!bg-red-400" : "!bg-yellow-400"} />
    </div>
  );
}

export default memo(ReorderNode);
