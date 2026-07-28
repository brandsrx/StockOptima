"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";
import { getStatusBadge } from "@/components/ui/Badge";
import { getDashboard } from "@/services/apiService";
import type { DashboardData, Product } from "@/types";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Clock,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const d = await getDashboard();
      setData(d);
      setLastUpdated(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // keep null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Vista general del estado de tu inventario" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!data || data.total_productos === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Vista general del estado de tu inventario" />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mb-4">
            <Boxes className="w-8 h-8" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Sin datos de inventario
          </h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
            Sube un archivo CSV o Excel desde la sección de Inventario para comenzar a optimizar.
          </p>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Ir a Inventario
          </Link>
        </div>
      </div>
    );
  }

  const products = data.productos;
  const kpis = [
    {
      label: "Capital Inmovilizado",
      value: data.total_capital,
      prefix: "$",
      decimals: 2,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      bg: "from-blue-500/10 to-blue-600/10",
    },
    {
      label: "Productos Totales",
      value: data.total_productos,
      prefix: "",
      decimals: 0,
      icon: Package,
      gradient: "from-slate-500 to-slate-600",
      bg: "from-slate-500/10 to-slate-600/10",
    },
    {
      label: "Estado Crítico",
      value: data.productos_criticos,
      prefix: "",
      decimals: 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      bg: "from-red-500/10 to-rose-600/10",
    },
    {
      label: "Órdenes Sugeridas",
      value: data.ordenes_sugeridas,
      prefix: "",
      decimals: 0,
      icon: ShoppingCart,
      gradient: "from-amber-500 to-orange-500",
      bg: "from-amber-500/10 to-orange-500/10",
    },
    {
      label: "Nivel de Servicio",
      value: data.nivel_servicio_promedio,
      suffix: "%",
      decimals: 1,
      icon: Shield,
      gradient: "from-emerald-500 to-teal-600",
      bg: "from-emerald-500/10 to-teal-600/10",
    },
    {
      label: "Ahorro EOQ Estimado",
      value: data.ahorro_estimado_eoq,
      prefix: "$",
      decimals: 2,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
      bg: "from-violet-500/10 to-purple-600/10",
    },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={data.nombre_negocio || "Dashboard"}
          description="Vista general del estado de tu inventario"
        />
        {lastUpdated && (
          <div className="flex items-center gap-1.5 mt-2 shrink-0">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Última actualización: {lastUpdated}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.bg} shrink-0`}
                >
                  <kpi.icon className={`w-6 h-6 bg-gradient-to-br ${kpi.gradient} bg-clip-text`} style={{ color: `var(--color-brand-600)` }} />
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {kpi.label}
                  </p>
                  <AnimatedCounter
                    value={kpi.value}
                    prefix={kpi.prefix || ""}
                    suffix={kpi.suffix || ""}
                    decimals={kpi.decimals}
                    className="text-2xl font-bold"
                    duration={1.5}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Alerts */}
      {data.productos_criticos > 0 && (
        <motion.div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                {data.productos_criticos} producto{data.productos_criticos > 1 ? "s" : ""} en estado crítico
              </p>
              <p className="text-xs text-red-700 dark:text-red-400/80 mt-0.5">
                Se recomienda realizar pedidos de reabastecimiento lo antes posible.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Stock Distribution Doughnut */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Distribución por Estado
              </h3>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ["Óptimo", "En Reorden", "Crítico"],
                    datasets: [
                      {
                        data: [
                          data.productos_optimos,
                          data.productos_en_reorden,
                          data.productos_criticos,
                        ],
                        backgroundColor: [
                          "rgba(16, 185, 129, 0.8)",
                          "rgba(245, 158, 11, 0.8)",
                          "rgba(239, 68, 68, 0.8)",
                        ],
                        borderWidth: 0,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "65%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "circle",
                          padding: 16,
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Urgent Products Bar */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Capital Inmovilizado por Producto (Top 8)
              </h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar
                  data={{
                    labels: products
                      .sort((a, b) => b.cost * b.current_stock - a.cost * a.current_stock)
                      .slice(0, 8)
                      .map((p) => p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name),
                    datasets: [
                      {
                        label: "Capital ($)",
                        data: products
                          .sort((a, b) => b.cost * b.current_stock - a.cost * a.current_stock)
                          .slice(0, 8)
                          .map((p) => Math.round(p.cost * p.current_stock * 100) / 100),
                        backgroundColor: "rgba(99, 102, 241, 0.7)",
                        borderRadius: 6,
                        barThickness: 28,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                          label: (ctx) => `$${ctx.parsed.x?.toLocaleString("es-MX") ?? ""}`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { color: "var(--border-secondary)" }, ticks: { font: { size: 11 } } },
                      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Resumen de Productos — Acciones Sugeridas
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    {["Producto", "Stock", "Reorden", "Q* (EOQ)", "SS", "Estado", "Acción"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products
                    .sort((a, b) => {
                      const order = { Crítico: 0, "En Reorden": 1, Óptimo: 2 };
                      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
                    })
                    .map((product) => (
                      <tr
                        key={product.sku}
                        className="transition-colors hover:bg-[var(--bg-tertiary)]"
                        style={{ borderBottom: "1px solid var(--border-secondary)" }}
                      >
                        <td className="px-6 py-3.5">
                          <div>
                            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                              {product.name}
                            </p>
                            <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {product.sku}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className="font-medium"
                            style={{
                              color:
                                product.status === "Crítico"
                                  ? "var(--color-danger)"
                                  : product.status === "En Reorden"
                                    ? "var(--color-warning)"
                                    : "var(--text-primary)",
                            }}
                          >
                            {product.current_stock}
                          </span>
                        </td>
                        <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                          {product.reorder_point}
                        </td>
                        <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                          {product.economic_order_quantity}
                        </td>
                        <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                          {product.safety_stock}
                        </td>
                        <td className="px-6 py-3.5">{getStatusBadge(product.status)}</td>
                        <td className="px-6 py-3.5">
                          {product.status === "Crítico" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                              <ArrowUpRight className="w-3 h-3" />
                              Pedir {product.economic_order_quantity} uds
                            </span>
                          ) : product.status === "En Reorden" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                              <ArrowUpRight className="w-3 h-3" />
                              Monitorear
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                              <ArrowDownRight className="w-3 h-3" />
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
