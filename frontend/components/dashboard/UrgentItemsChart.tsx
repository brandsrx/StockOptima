"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import type { Product } from "@/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface UrgentItemsChartProps {
  products: Product[];
}

export function UrgentItemsChart({ products }: UrgentItemsChartProps) {
  const urgentProducts = useMemo(() => {
    return products
      .filter((p) => p.status !== "Óptimo")
      .sort((a, b) => {
        const urgencyA = a.current_stock / a.reorder_point;
        const urgencyB = b.current_stock / b.reorder_point;
        return urgencyA - urgencyB;
      })
      .slice(0, 5);
  }, [products]);

  const data = {
    labels: urgentProducts.map((p) => p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name),
    datasets: [
      {
        label: "Stock Actual",
        data: urgentProducts.map((p) => p.current_stock),
        backgroundColor: urgentProducts.map((p) =>
          p.status === "Crítico" ? "rgba(239, 68, 68, 0.8)" : "rgba(245, 158, 11, 0.8)"
        ),
        borderRadius: 6,
        barThickness: 32,
      },
      {
        label: "Punto de Reorden",
        data: urgentProducts.map((p) => p.reorder_point),
        backgroundColor: "rgba(156, 163, 175, 0.3)",
        borderColor: "rgba(156, 163, 175, 0.6)",
        borderWidth: 1,
        borderDash: [4, 4],
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: "#f3f4f6" },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-gray-900">
          Productos Reabastecer con Urgencia
        </h3>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {urgentProducts.length > 0 ? (
            <Bar data={data} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              No hay productos en estado urgente
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
