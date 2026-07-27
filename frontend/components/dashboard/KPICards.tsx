"use client";

import { Card, CardContent } from "@/components/ui/Card";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

interface KPIProps {
  total_capital: number;
  total_products: number;
  critical_products: number;
  pending_orders: number;
}

export function KPICards({
  total_capital,
  total_products,
  critical_products,
  pending_orders,
}: KPIProps) {
  const items = [
    {
      label: "Capital Inmovilizado",
      value: `$${total_capital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Productos Totales",
      value: total_products.toString(),
      icon: Package,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      label: "Estado Crítico",
      value: critical_products.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Órdenes Sugeridas",
      value: pending_orders.toString(),
      icon: ShoppingCart,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${item.bg}`}
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
