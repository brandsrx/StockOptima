import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type SupplierNodeData = { label: string };

type SupplierNodeType = Node<SupplierNodeData, "supplier">;

function SupplierNode({ data }: NodeProps<SupplierNodeType>) {
  return (
    <div
      className="px-5 py-3 rounded-xl border-2 shadow-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "#3b82f6",
        minWidth: 140,
        textAlign: "center" as const,
      }}
    >
      <div className="flex items-center gap-2 justify-center">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-sm font-semibold" style={{ color: "#1e40af" }}>
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
    </div>
  );
}

export default memo(SupplierNode);
