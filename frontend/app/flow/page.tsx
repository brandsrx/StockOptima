"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Package, AlertCircle, Filter, Upload } from "lucide-react";
import type { Node } from "@xyflow/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { FlowMap } from "@/components/flow/FlowMap";
import { ProductDetailPanel } from "@/components/flow/ProductDetailPanel";
import { getProducts } from "@/services/apiService";
import type { Product } from "@/types";

const STATUS_OPTIONS = ["all", "Crítico", "En Reorden", "Óptimo"] as const;

export default function FlowPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const onNodeClick = useCallback(
    (node: Node) => {
      if (node.id.startsWith("product-")) {
        const sku = node.id.replace("product-", "");
        const p = products.find((prod) => prod.sku === sku);
        setSelectedProduct(p || null);
      }
    },
    [products]
  );

  const handleReset = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
  }, []);

  // Keyboard shortcut: Escape to close panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Mapa de Inventario"
          description="Visualización del flujo de inventario"
        />
        <SkeletonChart />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <PageHeader
          title="Mapa de Inventario"
          description="Visualización del flujo de inventario"
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Sin datos de inventario
          </h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
            Sube un archivo CSV o Excel para visualizar el mapa de flujo de inventario.
          </p>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir Inventario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Mapa de Inventario" },
      ]} />
      <PageHeader
        title="Mapa Inteligente de Inventario"
        description="Flujo: Proveedor → Producto → Almacén → Punto de Reorden → Pedido"
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-[var(--bg-tertiary)]"
              }`}
              style={
                statusFilter !== s
                  ? { borderColor: "var(--border-primary)", color: "var(--text-secondary)" }
                  : {}
              }
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
          {(search || statusFilter !== "all") && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {[
          { label: "Normal", color: "#22c55e" },
          { label: "En Reorden", color: "#eab308" },
          { label: "Crítico", color: "#ef4444" },
          { label: "Conexión Animada = Acción Requerida", color: "#3b82f6" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{l.label}</span>
          </div>
        ))}
        {filtered.length < products.length && (
          <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
            Mostrando {filtered.length} de {products.length} productos
          </span>
        )}
      </div>

      {/* Flow Map + Detail Panel */}
      <div className="relative">
        <Card className="overflow-hidden">
          <FlowMap products={filtered} onNodeClick={onNodeClick} />
        </Card>

        <AnimatePresence>
          {selectedProduct && (
            <ProductDetailPanel
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
