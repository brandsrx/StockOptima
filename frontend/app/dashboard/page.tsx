"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { UrgentItemsChart } from "@/components/dashboard/UrgentItemsChart";
import { SummaryTable } from "@/components/dashboard/SummaryTable";
import { Alert } from "@/components/ui/Alert";
import { getDashboard } from "@/services/apiService";
import type { Product, DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const d = await getDashboard();
      setData(d);
    } catch {
      // keep last data or empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Cargando panel...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">No hay datos disponibles. Sube un inventario primero.</div>
      </div>
    );
  }

  const products = data.productos as Product[];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista general del estado de tu inventario"
      />

      <div className="space-y-6">
        <KPICards
          total_capital={data.total_capital}
          total_products={data.total_productos}
          critical_products={data.productos_criticos}
          pending_orders={data.ordenes_sugeridas}
        />

        {data.productos_criticos > 0 && (
          <Alert variant="danger" title="Productos en estado crítico">
            Hay {data.productos_criticos} producto{data.productos_criticos > 1 ? "s" : ""}{" "}
            por debajo del punto de reorden. Se recomienda realizar pedidos de
            reabastecimiento lo antes posible.
          </Alert>
        )}

        {data.productos_en_reorden > 0 && (
          <Alert variant="warning" title="Productos en punto de reorden">
            Hay {data.productos_en_reorden} producto{data.productos_en_reorden > 1 ? "s" : ""}{" "}
            cerca del punto de reorden. Monitorea su evolución.
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
