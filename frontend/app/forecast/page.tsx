"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { getProducts, calculateForecast } from "@/services/apiService";
import type { Product, ForecastResponse } from "@/types";
import { toast } from "sonner";
import { TrendingUp, Award, BookOpen, BarChart3, Package, AlertCircle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ForecastPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [loading, setLoading] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [customSales, setCustomSales] = useState("");

  const selectedProduct = products.find((p) => p.sku === selectedSku);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      if (data.length > 0) {
        setSelectedSku(data[0].sku);
        const first = data[0];
        if (first.ventas_historicas && first.ventas_historicas.length > 0) {
          setCustomSales(first.ventas_historicas.join(", "));
        }
      }
    } catch {
      toast.error("Error al cargar productos", {
        description: "No se pudo obtener la lista de productos del servidor.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleProductChange = (sku: string) => {
    setSelectedSku(sku);
    setResult(null);
    const product = products.find((p) => p.sku === sku);
    if (product && product.ventas_historicas && product.ventas_historicas.length > 0) {
      setCustomSales(product.ventas_historicas.join(", "));
    } else {
      setCustomSales("");
    }
  };

  const handleForecast = async () => {
    const sales = customSales
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (sales.length < 3) {
      toast.error("Datos insuficientes", {
        description: "Ingresa al menos 3 valores de ventas mensuales separados por coma.",
      });
      return;
    }

    setForecasting(true);
    setResult(null);
    try {
      const res = await calculateForecast({ ventas_historicas: sales });
      setResult(res);
      toast.success("Pronóstico completado", {
        description: `Mejor método: ${res.mejor_metodo} — Siguiente período: ${res.mejor_pronostico.toFixed(2)} unidades.`,
      });
    } catch (err) {
      toast.error("Error al calcular pronóstico", {
        description: err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setForecasting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Pronóstico de Demanda" description="Predice la demanda futura usando modelos de series de tiempo" />
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pronóstico de Demanda" description="¿Cuánto venderé? — Predicción con modelos de series de tiempo" />

      <div className="space-y-6">
        {/* Academic Explanation */}
        <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Métodos de Pronóstico Implementados
            </p>
            <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
              <li><strong>Promedio Móvil (3 y 6 períodos):</strong> F(t+1) = (1/k) × Σ D(t-i). Simple y efectivo sin tendencia.</li>
              <li><strong>Suavización Exponencial:</strong> F(t+1) = α·D(t) + (1-α)·F(t). El sistema busca el α óptimo automáticamente.</li>
              <li><strong>Métricas:</strong> MAE (Error Absoluto Medio) y RMSE (Raíz del Error Cuadrático Medio).</li>
            </ul>
          </div>
        </div>

        {/* Product Selector + Sales Input */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Datos de Ventas Históricas
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            {products.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Seleccionar producto (carga sus ventas históricas)
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  <select
                    value={selectedSku}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full rounded-lg border px-9 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  >
                    {products.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {selectedProduct && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                    Stock actual: {selectedProduct.current_stock} | Demanda anual: {selectedProduct.annual_demand_estimated} | Status: {selectedProduct.status}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                Ventas mensuales separadas por comas (mínimo 3 períodos)
              </label>
              <textarea
                value={customSales}
                onChange={(e) => setCustomSales(e.target.value)}
                rows={2}
                className="w-full rounded-lg border px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                placeholder="120, 135, 110, 140, 155, 130..."
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                {(() => {
                  const nums = customSales.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
                  return nums.length === 0
                    ? "No se detectaron valores numéricos"
                    : `${nums.length} valor(es) detectado(s) — ${nums.length < 3 ? "se necesitan al menos 3" : "listo para pronosticar"}`;
                })()}
              </p>
            </div>

            <motion.button
              onClick={handleForecast}
              disabled={forecasting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileTap={forecasting ? undefined : { scale: 0.97 }}
            >
              <TrendingUp className="w-4 h-4" />
              {forecasting ? "Pronosticando..." : "Pronosticar"}
            </motion.button>
          </CardContent>
        </Card>

        {/* No products warning */}
        {products.length === 0 && !loading && (
          <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                No hay productos cargados
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                Sube un archivo CSV desde la sección Inventario para cargar productos con sus ventas históricas, o ingresa los valores manualmente arriba.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Best Method Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Mejor método: {result.mejor_metodo}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Pronóstico siguiente período: <strong>{result.mejor_pronostico.toFixed(2)}</strong> unidades
                  • MAE: {result.mejor_mae.toFixed(2)} • RMSE: {result.mejor_rmse.toFixed(2)}
                </p>
              </div>
            </motion.div>

            {/* Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Histórico vs Pronóstico
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: result.historico.map((_, i) =>
                          i < MESES.length ? MESES[i] : `P${i + 1}`
                        ),
                        datasets: [
                          {
                            label: "Demanda Real",
                            data: result.historico,
                            borderColor: "#3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            fill: true,
                            tension: 0.3,
                            pointRadius: 4,
                            pointBackgroundColor: "#3b82f6",
                            borderWidth: 2,
                          },
                          ...result.metodos.map((m, idx) => ({
                            label: m.nombre,
                            data: m.serie_pronostico,
                            borderColor: ["#f59e0b", "#8b5cf6", "#10b981"][idx % 3],
                            borderDash: [6, 3],
                            tension: 0.3,
                            pointRadius: 3,
                            borderWidth: 2,
                            fill: false,
                          })),
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: "index" },
                        plugins: {
                          legend: {
                            position: "top",
                            align: "end",
                            labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
                          },
                          tooltip: {
                            backgroundColor: "#1e293b",
                            padding: 12,
                            cornerRadius: 8,
                          },
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                          y: { grid: { color: "var(--border-secondary)" }, ticks: { font: { size: 11 } } },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Metrics Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Comparación de Métodos
                    </h3>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          {["Método", "Pronóstico Sgte.", "MAE", "RMSE", "Parámetros", ""].map((h) => (
                            <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-tertiary)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.metodos.map((m) => (
                          <tr
                            key={m.nombre}
                            className={m.nombre === result.mejor_metodo ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}
                            style={{ borderBottom: "1px solid var(--border-secondary)" }}
                          >
                            <td className="px-6 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{m.nombre}</td>
                            <td className="px-6 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{m.pronostico_siguiente.toFixed(2)}</td>
                            <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{m.mae.toFixed(4)}</td>
                            <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{m.rmse.toFixed(4)}</td>
                            <td className="px-6 py-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {Object.entries(m.parametros).map(([k, v]) => `${k}=${v}`).join(", ")}
                            </td>
                            <td className="px-6 py-3">
                              {m.nombre === result.mejor_metodo && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">MEJOR</span>
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

            {/* Explanation */}
            <div className="rounded-xl border p-4" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {result.explanation}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
