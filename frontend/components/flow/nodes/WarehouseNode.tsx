import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Warehouse } from "lucide-react";

export type WarehouseNodeData = { eoq: number };

type WarehouseNodeType = Node<WarehouseNodeData, "warehouse">;

function WarehouseNode({ data }: NodeProps<WarehouseNodeType>) {
  return (
    <div
      className="px-4 py-3 rounded-xl border-2 shadow-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "#86efac",
        minWidth: 140,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Warehouse className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Almacén
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        EOQ: <span className="font-bold" style={{ color: "#166534" }}>{data.eoq} uds</span>
      </p>
      <Handle type="source" position={Position.Right} className="!bg-green-400" />
      <Handle type="target" position={Position.Left} className="!bg-green-400" />
    </div>
  );
}

export default memo(WarehouseNode);
