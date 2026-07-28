"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./nodes";
import { getLayoutedElements } from "./utils/layout";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onNodeClick: (node: Node) => void;
}

export function FlowMap({ products, onNodeClick }: Props) {
  const { nodes, edges } = useMemo(() => {
    if (products.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] };

    const bySupplier: Record<string, Product[]> = {};
    products.forEach((p) => {
      const s = p.supplier || "Sin Proveedor";
      if (!bySupplier[s]) bySupplier[s] = [];
      bySupplier[s].push(p);
    });

    const supplierList = Object.keys(bySupplier);
    const allNodes: Node[] = [];
    const edgeItems: { sku: string; status: string; supplierIdx: number }[] = [];

    supplierList.forEach((supplier, sIdx) => {
      const prods = bySupplier[supplier];

      allNodes.push({
        id: `supplier-${sIdx}`,
        type: "supplier",
        position: { x: 0, y: 0 },
        data: { label: supplier },
      });

      prods.forEach((product) => {
        allNodes.push(
          {
            id: `product-${product.sku}`,
            type: "product",
            position: { x: 0, y: 0 },
            data: {
              name: product.name,
              current_stock: product.current_stock,
              status: product.status,
              sku: product.sku,
            },
          },
          {
            id: `warehouse-${product.sku}`,
            type: "warehouse",
            position: { x: 0, y: 0 },
            data: { eoq: product.economic_order_quantity },
          },
          {
            id: `reorder-${product.sku}`,
            type: "reorder",
            position: { x: 0, y: 0 },
            data: {
              reorder_point: product.reorder_point,
              current_stock: product.current_stock,
            },
          },
        );

        if (product.status !== "Óptimo") {
          allNodes.push({
            id: `order-${product.sku}`,
            type: "order",
            position: { x: 0, y: 0 },
            data: { eoq: product.economic_order_quantity },
          });
        }

        edgeItems.push({ sku: product.sku, status: product.status, supplierIdx: sIdx });
      });
    });

    // Build edges
    const allEdges: Edge[] = [];
    edgeItems.forEach((p) => {
      const supplierId = `supplier-${p.supplierIdx}`;
      const productId = `product-${p.sku}`;
      const warehouseId = `warehouse-${p.sku}`;
      const reorderId = `reorder-${p.sku}`;
      const orderId = `order-${p.sku}`;

      allEdges.push(
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
        },
      );

      if (p.status !== "Óptimo") {
        allEdges.push({
          id: `e-re-${p.sku}-ord`,
          source: reorderId,
          target: orderId,
          animated: true,
          style: { stroke: "#ef4444", strokeWidth: 2 },
        });
      }
    });

    // Apply dagre layout
    return getLayoutedElements(allNodes, allEdges, "LR");
  }, [products]);

  return (
    <div style={{ height: "70vh", minHeight: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={20} size={1} color="var(--border-secondary)" />
        <Controls
          showInteractive={false}
          style={{ borderRadius: 8, overflow: "hidden" }}
          className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
        />
        <MiniMap
          nodeStrokeWidth={3}
          style={{ borderRadius: 8 }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)]"
        />
      </ReactFlow>
    </div>
  );
}
