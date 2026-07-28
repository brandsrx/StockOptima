"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";
import { getProducts, getSettings, simulateCurrency } from "@/services/apiService";
import type { Product, BusinessSettings, CurrencySimulationResponse } from "@/types";
import {
  DollarSign, ChevronDown, TrendingDown, TrendingUp,
  ArrowRight, BookOpen, AlertTriangle,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function CurrencyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [selectedSku, setSelectedSku] = useState("");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [tipoCambio, setTipoCambio] = useState(6.96);
  const [variaciones, setVariaciones] = useState("0, 5, 10, 15, 20, 30");
  const [result, setResult] = useState<CurrencySimulationResponse | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [prods, setts] = await Promise.all([getProducts(), getSettings()]);
      setProducts(prods);
      setSettings(setts);
      if (prods.length > 0) setSelectedSku(prods[0].sku);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selected = products.find((p) => p.sku === selectedSku);

  const handleSimulate = async () => {
    if (!selected || !settings) return;
    const vars = variaciones.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    setSimulating(true);
    try {
      const res = await simulateCurrency({
        sku: selected.sku,
        costo_unitario: selected.cost,
        demanda_anual: selected.annual_demand_estimated,
        costo_pedido: settings.ordering_cost,
        tasa_retencion: settings.holding_cost_rate,
        tipo_cambio_actual: tipoCambio,
        variaciones: vars,
      });
      setResult(res);
    } catch { /* empty */ }
    finally { setSimulating(false); }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Volatilidad Cambiaria" description="Simulación para mercados emergentes" />
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Simulación de Volatilidad Cambiaria"
        description="¿Cómo afecta el tipo de cambio a tu inventario? — Diferencial para mercados emergentes"
      />

      <div className="space-y-6">
        {/* Academic Context */}
        <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Modelo de Volatilidad Cambiaria para MIPYMES
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Las MIPYMES en mercados emergentes enfrentan alta volatilidad cambiaria. Cuando el tipo de cambio
              sube, el costo de productos importados aumenta, afectando el EOQ, el capital inmovilizado y el
              costo total del inventario. Este módulo permite simular escenarios para tomar decisiones proactivas.
            </p>
            <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-tertiary)" }}>
              C_ajustado = C × (1 + variación%) → recalcula EOQ, Punto de Reorden y Capital
            </p>
          </div>
        </div>

        {/* Input Panel */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Parámetros de Simulación
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Producto a analizar
              </label>
              <div className="relative">
                <select
                  value={selectedSku}
                  onChange={(e) => { setSelectedSku(e.target.value); setResult(null); }}
                  className="w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                >
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>{p.sku} — {p.name} (${p.cost})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Tipo de Cambio Actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Variaciones a Simular (%)
                </label>
                <input
                  type="text"
                  value={variaciones}
                  onChange={(e) => setVariaciones(e.target.value)}
                  placeholder="0, 5, 10, 15, 20"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <motion.button
              onClick={handleSimulate}
              disabled={simulating || !selected}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
            >
              <DollarSign className="w-4 h-4" />
              {simulating ? "Simulando..." : "Simular Escenarios"}
            </motion.button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Scenario Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Tabla Comparativa de Escenarios
                  </h3>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          {["Escenario", "T/C", "Costo Ajustado", "EOQ", "Costo Total Anual", "Capital Inmov.", "Δ Costo"].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-tertiary)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.escenarios.map((e) => (
                          <tr
                            key={e.variacion_pct}
                            className={e.variacion_pct === 0 ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                            style={{ borderBottom: "1px solid var(--border-secondary)" }}
                          >
                            <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                              {e.variacion_pct === 0 ? "Base" : `+${e.variacion_pct}%`}
                            </td>
                            <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                              {e.tipo_cambio.toFixed(2)}
                            </td>
                            <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                              ${e.costo_ajustado.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                              {e.eoq}
                            </td>
                            <td className="px-5 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                              ${e.costo_total_anual.toLocaleString("es-MX")}
                            </td>
                            <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                              ${e.capital_inmovilizado.toLocaleString("es-MX")}
                            </td>
                            <td className="px-5 py-3">
                              {e.variacion_pct === 0 ? (
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                  e.diferencia_pct > 0 ? "text-red-600" : "text-emerald-600"
                                }`}>
                                  {e.diferencia_pct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {e.diferencia_pct > 0 ? "+" : ""}{e.diferencia_pct.toFixed(1)}%
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      EOQ por Escenario
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: result.escenarios.map((e) => e.variacion_pct === 0 ? "Base" : `+${e.variacion_pct}%`),
                          datasets: [{
                            label: "EOQ (unidades)",
                            data: result.escenarios.map((e) => e.eoq),
                            backgroundColor: result.escenarios.map((e) =>
                              e.variacion_pct === 0
                                ? "rgba(59, 130, 246, 0.8)"
                                : "rgba(239, 68, 68, 0.6)"
                            ),
                            borderRadius: 6,
                            barThickness: 32,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { display: false } },
                            y: { grid: { color: "var(--border-secondary)" } },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Costo Total Anual por Escenario
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: result.escenarios.map((e) => e.variacion_pct === 0 ? "Base" : `+${e.variacion_pct}%`),
                          datasets: [{
                            label: "Costo Total ($)",
                            data: result.escenarios.map((e) => e.costo_total_anual),
                            backgroundColor: result.escenarios.map((_, i) => {
                              const colors = [
                                "rgba(59, 130, 246, 0.8)",
                                "rgba(245, 158, 11, 0.7)",
                                "rgba(239, 68, 68, 0.6)",
                                "rgba(239, 68, 68, 0.7)",
                                "rgba(239, 68, 68, 0.8)",
                                "rgba(239, 68, 68, 0.9)",
                              ];
                              return colors[i % colors.length];
                            }),
                            borderRadius: 6,
                            barThickness: 32,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: { label: (ctx) => `$${(ctx.parsed.y ?? 0).toLocaleString("es-MX")}` },
                            },
                          },
                          scales: {
                            x: { grid: { display: false } },
                            y: { grid: { color: "var(--border-secondary)" } },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Impact Alert */}
            {result.escenarios.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">
                      Impacto de la Volatilidad
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400/80">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
