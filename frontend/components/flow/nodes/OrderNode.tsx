import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ShoppingCart } from "lucide-react";

export type OrderNodeData = { eoq: number };

type OrderNodeType = Node<OrderNodeData, "order">;

function OrderNode({ data }: NodeProps<OrderNodeType>) {
  return (
    <div
      className="px-4 py-3 rounded-xl border-2 shadow-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "#ef4444",
        minWidth: 130,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <ShoppingCart className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Pedido
        </span>
      </div>
      <p className="text-xs font-bold text-red-600 dark:text-red-400">
        {data.eoq} uds
      </p>
      <Handle type="target" position={Position.Left} className="!bg-red-400" />
    </div>
  );
}

export default memo(OrderNode);
