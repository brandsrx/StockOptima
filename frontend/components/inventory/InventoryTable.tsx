"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { getStatusBadge } from "@/components/ui/Badge";
import type { Product } from "@/types";

interface InventoryTableProps {
  products: Product[];
}

export function InventoryTable({ products }: InventoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-gray-900">
          Catálogo de Productos
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q*
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorden
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SS
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrega
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr
                  key={product.sku}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs text-gray-500">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-medium text-gray-900">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    ${product.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`font-medium ${
                        product.status === "Crítico"
                          ? "text-red-600"
                          : product.status === "En Reorden"
                            ? "text-amber-600"
                            : "text-gray-900"
                      }`}
                    >
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-gray-900">
                    {product.economic_order_quantity}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {product.reorder_point}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {product.safety_stock}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {product.lead_time_days}d
                  </td>
                  <td className="px-6 py-3.5">
                    {getStatusBadge(product.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
