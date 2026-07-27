"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { CSVUploadButton } from "@/components/inventory/CSVUploadButton";
import { getProducts } from "@/services/apiService";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Gestiona el catálogo completo de productos"
        actions={<CSVUploadButton onUploadComplete={fetchProducts} />}
      />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-400 space-y-3">
          <p>No hay productos en el inventario.</p>
          <p>Sube un archivo CSV o Excel para comenzar.</p>
        </div>
      ) : (
        <InventoryTable products={products} />
      )}
    </div>
  );
}
