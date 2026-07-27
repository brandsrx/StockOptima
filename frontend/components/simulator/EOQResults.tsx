"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { TrendingUp, Target, DollarSign, BarChart3 } from "lucide-react";

interface EOQResultsProps {
  eoq: number;
  reorderPoint: number;
  totalCost: number;
}

export function EOQResults({
  eoq,
  reorderPoint,
  totalCost,
}: EOQResultsProps) {
  const items = [
    {
      label: "Q* (Cantidad Económica)",
      value: eoq,
      suffix: "unidades",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "r (Punto de Reorden)",
      value: reorderPoint,
      suffix: "unidades",
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "TC (Costo Total Anual)",
      value: `$${totalCost.toLocaleString("es-MX")}`,
      suffix: "",
      icon: DollarSign,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${item.bg}`}
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xl font-bold text-gray-900">
                {item.value}{" "}
                {item.suffix && (
                  <span className="text-xs font-normal text-gray-400">
                    {item.suffix}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface CostBreakdownProps {
  holdingCost: number;
  orderingCost: number;
}

export function CostBreakdown({ holdingCost, orderingCost }: CostBreakdownProps) {
  const total = holdingCost + orderingCost;
  const holdingPct = total > 0 ? (holdingCost / total) * 100 : 0;
  const orderingPct = total > 0 ? (orderingCost / total) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-900">
            Desglose de Costos Anuales
          </h4>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Costo de Almacenamiento</span>
              <span className="font-medium text-gray-900">
                ${holdingCost.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${holdingPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Costo de Pedido</span>
              <span className="font-medium text-gray-900">
                ${orderingCost.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all"
                style={{ width: `${orderingPct}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
