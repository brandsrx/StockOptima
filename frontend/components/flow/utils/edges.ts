import type { Edge } from "@xyflow/react";

export function buildEdges(products: { sku: string; status: string; supplierIdx: number }[]): Edge[] {
  const edges: Edge[] = [];

  products.forEach((p) => {
    const supplierId = `supplier-${p.supplierIdx}`;
    const productId = `product-${p.sku}`;
    const warehouseId = `warehouse-${p.sku}`;
    const reorderId = `reorder-${p.sku}`;
    const orderId = `order-${p.sku}`;

    edges.push(
      {
        id: `e-sup-${p.supplierIdx}-${p.sku}`,
        source: supplierId,
        target: productId,
        animated: p.status !== "Óptimo",
        style: { stroke: p.status !== "Óptimo" ? "#3b82f6" : "#94a3b8", strokeWidth: 2 },
      },
      {
        id: `e-prod-${p.sku}-wh`,
        source: productId,
        target: warehouseId,
        style: { stroke: "#22c55e", strokeWidth: 2 },
      },
      {
        id: `e-wh-${p.sku}-re`,
        source: warehouseId,
        target: reorderId,
        style: { stroke: "#eab308", strokeWidth: 2 },
      }
    );

    if (p.status !== "Óptimo") {
      edges.push({
        id: `e-re-${p.sku}-ord`,
        source: reorderId,
        target: orderId,
        animated: true,
        style: { stroke: "#ef4444", strokeWidth: 2 },
      });
    }
  });

  return edges;
}
