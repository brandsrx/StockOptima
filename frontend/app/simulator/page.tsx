"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EOQResults, CostBreakdown } from "@/components/simulator/EOQResults";
import { ReorderAlert } from "@/components/simulator/ReorderAlert";
import { getProducts } from "@/services/apiService";
import {
  calculateEOQ,
  calculateReorderPoint,
  calculateTotalAnnualCost,
  calculateHoldingCost,
  calculateOrderingCost,
} from "@/lib/calculations";
import type { Product } from "@/types";
import { ChevronDown } from "lucide-react";

export default function SimulatorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      if (data.length > 0) setSelectedSku(data[0].sku);
      setLoading(false);
    });
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === selectedSku),
    [products, selectedSku]
  );

  const results = useMemo(() => {
    if (!selectedProduct) return null;

    const eoq = calculateEOQ(
      selectedProduct.annual_demand_estimated,
      selectedProduct.ordering_cost,
      selectedProduct.holding_cost_rate,
      selectedProduct.cost
    );
    const reorderPoint = calculateReorderPoint(
      selectedProduct.annual_demand_estimated,
      selectedProduct.lead_time_days
    );
    const totalCost = calculateTotalAnnualCost(
      selectedProduct.annual_demand_estimated,
      selectedProduct.ordering_cost,
      selectedProduct.holding_cost_rate,
      selectedProduct.cost,
      eoq
    );
    const holdingCost = calculateHoldingCost(
      eoq,
      selectedProduct.cost,
      selectedProduct.holding_cost_rate
    );
    const orderingCost = calculateOrderingCost(
      selectedProduct.annual_demand_estimated,
      eoq,
      selectedProduct.ordering_cost
    );

    return { eoq, reorderPoint, totalCost, holdingCost, orderingCost };
  }, [selectedProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Cargando simulador...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Simulador EOQ"
        description="Calcula la cantidad económica de pedido y el punto de reorden óptimo"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">
              Seleccionar Producto
            </h3>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </CardContent>
        </Card>

        {selectedProduct && results && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent>
                  <p className="text-xs text-gray-500">Demanda Anual</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedProduct.annual_demand_estimated}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-gray-500">Costo Unitario</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${selectedProduct.cost.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-gray-500">Tiempo de Entrega</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedProduct.lead_time_days} días
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-gray-500">Stock Actual</p>
                  <p
                    className={`text-lg font-bold ${
                      selectedProduct.current_stock <= results.reorderPoint
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {selectedProduct.current_stock} unidades
                  </p>
                </CardContent>
              </Card>
            </div>

            <ReorderAlert
              currentStock={selectedProduct.current_stock}
              reorderPoint={results.reorderPoint}
              productName={selectedProduct.name}
            />

            <EOQResults
              eoq={results.eoq}
              reorderPoint={results.reorderPoint}
              totalCost={results.totalCost}
            />

            <CostBreakdown
              holdingCost={results.holdingCost}
              orderingCost={results.orderingCost}
            />
          </>
        )}
      </div>
    </div>
  );
}
