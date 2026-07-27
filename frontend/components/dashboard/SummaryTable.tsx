"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { getStatusBadge } from "@/components/ui/Badge";
import type { Product } from "@/types";

interface SummaryTableProps {
  products: Product[];
}

export function SummaryTable({ products }: SummaryTableProps) {
  const urgentProducts = products
    .filter((p) => p.status !== "Óptimo")
    .sort((a, b) => {
      const urgencyA = a.current_stock / a.reorder_point;
      const urgencyB = b.current_stock / b.reorder_point;
      return urgencyA - urgencyB;
    });

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-gray-900">
          Resumen de Reabastecimiento
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorden
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedir (Q*)
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {urgentProducts.map((product) => (
                <tr
                  key={product.sku}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {product.current_stock}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {product.reorder_point}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-gray-900">
                    {product.economic_order_quantity}
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
