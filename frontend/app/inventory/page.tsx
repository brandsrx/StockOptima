"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { getStatusBadge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getProducts, uploadInventoryFile } from "@/services/apiService";
import type { Product } from "@/types";
import {
  Upload,
  FileSpreadsheet,
  Search,
  Package,
} from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      try {
        const result = await uploadInventoryFile(file);
        toast.success(`${result.total_productos} productos procesados`, {
          description: `${result.filas_validas} válidos, ${result.filas_invalidas} con errores`,
        });
        await fetchProducts();
      } catch (err) {
        toast.error("Error al subir archivo", {
          description: err instanceof Error ? err.message : "Intenta de nuevo",
        });
      } finally {
        setUploading(false);
      }
    },
    [fetchProducts]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Inventario" description="Gestiona el catálogo completo de productos" />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Inventario" },
      ]} />
      <PageHeader title="Inventario" description="Gestiona el catálogo completo de productos" />

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-[var(--border-primary)] hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Procesando archivo...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center">
                  {isDragActive ? (
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Upload className="w-6 h-6" style={{ color: "var(--text-tertiary)" }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo CSV o Excel"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    o haz clic para seleccionar • Formatos: .csv, .xlsx
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex gap-2">
            {["all", "Crítico", "En Reorden", "Óptimo"].map((s) => (
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
                    ? {
                        borderColor: "var(--border-primary)",
                        color: "var(--text-secondary)",
                      }
                    : {}
                }
              >
                {s === "all" ? "Todos" : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mb-4">
            <Package className="w-7 h-7" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            Sin productos en inventario
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Arrastra un archivo CSV o Excel arriba para comenzar
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Catálogo de Productos
              </h3>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {filtered.length} de {products.length} productos
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    {["SKU", "Nombre", "Costo", "Stock", "Q* (EOQ)", "Reorden", "SS", "Entrega", "Estado"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product, idx) => (
                    <motion.tr
                      key={product.sku}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="transition-colors hover:bg-[var(--bg-tertiary)]"
                      style={{ borderBottom: "1px solid var(--border-secondary)" }}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                        {product.name}
                      </td>
                      <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        ${product.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              product.status === "Crítico"
                                ? "var(--color-danger)"
                                : product.status === "En Reorden"
                                  ? "var(--color-warning)"
                                  : "var(--text-primary)",
                          }}
                        >
                          {product.current_stock}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                        {product.economic_order_quantity}
                      </td>
                      <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        {product.reorder_point}
                      </td>
                      <td className="px-6 py-3.5" style={{ color: "var(--text-tertiary)" }}>
                        {product.safety_stock}
                      </td>
                      <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        {product.lead_time_days}d
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(product.status)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
