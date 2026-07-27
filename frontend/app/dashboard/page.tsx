"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { UrgentItemsChart } from "@/components/dashboard/UrgentItemsChart";
import { SummaryTable } from "@/components/dashboard/SummaryTable";
import { Alert } from "@/components/ui/Alert";
import { getProducts } from "@/services/apiService";
import type { Product } from "@/types";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const total_capital = products.reduce(
    (sum, p) => sum + p.cost * p.current_stock,
    0
  );
  const critical_products = products.filter(
    (p) => p.status === "Crítico"
  ).length;
  const pending_orders = products.filter(
    (p) => p.status !== "Óptimo"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Cargando panel...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista general del estado de tu inventario"
      />

      <div className="space-y-6">
        <KPICards
          total_capital={total_capital}
          total_products={products.length}
          critical_products={critical_products}
          pending_orders={pending_orders}
        />

        {critical_products > 0 && (
          <Alert variant="danger" title="Productos en estado crítico">
            Hay {critical_products} producto{critical_products > 1 ? "s" : ""}{" "}
            por debajo del punto de reorden. Se recomienda realizar pedidos de
            reabastecimiento lo antes posible.
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <UrgentItemsChart products={products} />
          </div>
          <div className="lg:col-span-2">
            <SummaryTable products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
