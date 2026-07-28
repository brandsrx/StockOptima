"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { X, TrendingUp, Package, ShoppingCart, ArrowUpRight, Boxes } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types";

interface Props {
  product: Product;
  onClose: () => void;
}

export function ProductDetailPanel({ product, onClose }: Props) {
  const statusVariant = product.status === "Crítico" ? "danger" : product.status === "En Reorden" ? "warning" : "success";
  const total = product.holding_cost + product.ordering_cost_total;
  const hPct = total > 0 ? (product.holding_cost / total) * 100 : 50;
  const reorderPct = product.reorder_point > 0
    ? Math.min((product.current_stock / product.reorder_point) * 100, 100)
    : 0;
  const isLowStock = product.current_stock <= product.reorder_point;

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute top-0 right-0 w-80 h-full z-10"
    >
      <div
        className="h-full rounded-r-xl border-l p-5 overflow-y-auto"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Detalle del Producto
          </h4>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>

        {/* Product Identity */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {product.name}
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
              {product.sku}
            </p>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 mb-4">
          {[
            { label: "Stock Actual", value: `${product.current_stock} uds` },
            { label: "EOQ (Q*)", value: `${product.economic_order_quantity} uds` },
            { label: "Punto de Reorden", value: `${product.reorder_point} uds` },
            { label: "Stock de Seguridad", value: `${product.safety_stock} uds` },
            { label: "Costo Unitario", value: `$${product.cost.toFixed(2)}` },
            { label: "Lead Time", value: `${product.lead_time_days} días` },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.label}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-5">
          <Badge label={product.status} variant={statusVariant} />
        </div>

        {/* Cost Breakdown Bar */}
        <div className="mb-4 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Costos Anuales</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: "var(--border-secondary)" }}>
            <div className="bg-blue-500 transition-all duration-500 rounded-l-full" style={{ width: `${hPct}%` }} />
            <div className="bg-violet-500 transition-all duration-500 rounded-r-full" style={{ width: `${100 - hPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
            <span>Almacen. ${product.holding_cost.toLocaleString("es-MX")}</span>
            <span>Pedido ${product.ordering_cost_total.toLocaleString("es-MX")}</span>
          </div>
        </div>

        {/* Stock vs Reorder Level */}
        <div className="mb-5 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Stock vs Pto. Reorden</span>
            <span className={`text-xs font-bold ${isLowStock ? "text-red-500" : "text-emerald-500"}`}>
              {isLowStock ? `${product.reorder_point - product.current_stock} uds bajo` : `${product.current_stock - product.reorder_point} uds sobre`}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border-secondary)" }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isLowStock ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${reorderPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            <span>Stock: {product.current_stock}</span>
            <span>Reorden: {product.reorder_point}</span>
          </div>
        </div>

        {/* Explanation */}
        {product.explanation && (
          <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {product.explanation}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {product.status !== "Óptimo" && (
            <Link
              href={`/simulator`}
              className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Pedir {product.economic_order_quantity} uds
            </Link>
          )}
          <div className="flex gap-2">
            <Link
              href={`/simulator`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors"
              style={{
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Simular EOQ
            </Link>
            <Link
              href={`/inventory`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors"
              style={{
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Boxes className="w-3.5 h-3.5" />
              Inventario
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
