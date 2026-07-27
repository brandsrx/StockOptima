"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { CSVUploadButton } from "@/components/inventory/CSVUploadButton";
import { getProducts } from "@/services/apiService";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

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
        actions={<CSVUploadButton />}
      />

      <InventoryTable products={products} />
    </div>
  );
}
