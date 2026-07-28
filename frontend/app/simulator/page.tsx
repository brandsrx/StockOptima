"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { getProducts, getSettings, evaluateVolumeDiscount } from "@/services/apiService";
import type { Product, BusinessSettings, VolumeDiscountResponse, DiscountTier } from "@/types";
import {
  ChevronDown, TrendingUp, Target, DollarSign, ShieldCheck,
  BookOpen, Plus, Trash2, Calculator, Upload,
} from "lucide-react";

export default function SimulatorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [selectedSku, setSelectedSku] = useState("");
  const [loading, setLoading] = useState(true);
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([
    { min_qty: 0, price: 10 },
    { min_qty: 100, price: 9.5 },
    { min_qty: 500, price: 8.8 },
  ]);
  const [discountResult, setDiscountResult] = useState<VolumeDiscountResponse | null>(null);
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prods, setts] = await Promise.all([getProducts(), getSettings()]);
      setProducts(prods);
      setSettings(setts);
      if (prods.length > 0 && !selectedSku) setSelectedSku(prods[0].sku);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [selectedSku]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selected = useMemo(() => products.find((p) => p.sku === selectedSku), [products, selectedSku]);

  const handleEvalDiscount = async () => {
    if (!selected || !settings) return;
    try {
      const result = await evaluateVolumeDiscount({
        demanda_anual: selected.annual_demand_estimated,
        costo_pedido: settings.ordering_cost,
        tasa_retencion: settings.holding_cost_rate,
        tramos: discountTiers,
      });
      setDiscountResult(result);
    } catch { /* empty */ }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Simulador EOQ" description="Calcula la cantidad económica de pedido" />
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <PageHeader title="Simulador EOQ" description="Calcula la cantidad económica de pedido" />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mb-4">
            <Calculator className="w-7 h-7" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Sin productos para simular
          </h3>
          <p className="text-sm max-w-sm mb-5" style={{ color: "var(--text-tertiary)" }}>
            Sube un archivo CSV o Excel con tu inventario primero.
          </p>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Inventario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Simulador EOQ" },
      ]} />
      <PageHeader title="Simulador EOQ" description="Análisis de cantidad económica de pedido, punto de reorden y stock de seguridad" />

      <div className="space-y-6">
        {/* Product Selector */}
        <Card>
          <CardContent>
            <div className="relative">
              <select
                value={selectedSku}
                onChange={(e) => { setSelectedSku(e.target.value); setDiscountResult(null); }}
                className="w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>{p.sku} — {p.name} (Stock: {p.current_stock})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
            </div>
          </CardContent>
        </Card>

        {selected && (
          <>
            {/* Product Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Demanda Anual (D)", value: selected.annual_demand_estimated, suffix: " uds" },
                { label: "Costo Unitario (C)", value: selected.cost, prefix: "$", decimals: 2 },
                { label: "Lead Time (m)", value: selected.lead_time_days, suffix: " días" },
                { label: "Stock Actual", value: selected.current_stock, suffix: " uds" },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent>
                    <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{m.label}</p>
                    <AnimatedCounter
                      value={m.value}
                      prefix={m.prefix || ""}
                      suffix={m.suffix || ""}
                      decimals={m.decimals || 0}
                      className="text-lg font-bold"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* EOQ Result with Academic Explanation */}
            <AcademicCard
              title="¿Cuánto pedir? — Cantidad Económica de Pedido (EOQ)"
              formula="Q* = √(2·D·Co / Ch), donde Ch = I × C"
              icon={TrendingUp}
              color="blue"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ResultItem label="Q* (EOQ)" value={`${selected.economic_order_quantity} uds`} big />
                <ResultItem label="Costo Almacenamiento" value={`$${selected.holding_cost.toLocaleString("es-MX")}`} />
                <ResultItem label="Costo de Pedido" value={`$${selected.ordering_cost_total.toLocaleString("es-MX")}`} />
              </div>
              <CostBar holding={selected.holding_cost} ordering={selected.ordering_cost_total} />
              <p className="text-sm mt-4" style={{ color: "var(--text-secondary)" }}>
                {selected.explanation}
              </p>
            </AcademicCard>

            {/* Reorder Point */}
            <AcademicCard
              title="¿Cuándo pedir? — Punto de Reorden"
              formula="r = d·m + SS (probabilístico)"
              icon={Target}
              color="emerald"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Determinístico</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {Math.round(selected.annual_demand_estimated / (settings?.dias_laborables || 365) * selected.lead_time_days)} uds
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>r = d × m (sin incertidumbre)</p>
                </div>
                <div className="p-4 rounded-lg border-2 border-emerald-500/30" style={{ background: "var(--bg-tertiary)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Probabilístico</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">RECOMENDADO</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{selected.reorder_point} uds</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    r = d·m + z·σ·√m (incluye SS = {selected.safety_stock} uds)
                  </p>
                </div>
              </div>
              {selected.current_stock <= selected.reorder_point && (
                <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    ⚠️ Stock actual ({selected.current_stock}) está por debajo del punto de reorden ({selected.reorder_point}).
                    Se recomienda pedir {selected.economic_order_quantity} unidades.
                  </p>
                </div>
              )}
            </AcademicCard>

            {/* Safety Stock */}
            <AcademicCard
              title="¿Cuánto protegerse? — Stock de Seguridad"
              formula="SS = z × σ × √m (Normal) | SS = z × √(λ×m) (Poisson)"
              icon={ShieldCheck}
              color="violet"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Normal (demanda ≥ 20 uds/día)
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {selected.safety_stock_normal} uds
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Usa la campana de Gauss. Apropiado para productos de alta rotación.
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Poisson (demanda &lt; 20 uds/día)
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {selected.safety_stock_poisson} uds
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Modela eventos discretos. Ideal para productos de rotación lenta.
                  </p>
                </div>
              </div>
              <p className="text-sm mt-4" style={{ color: "var(--text-secondary)" }}>
                Se usa max({selected.safety_stock_normal}, {selected.safety_stock_poisson}) = <strong>{selected.safety_stock}</strong> unidades
                para garantizar un nivel de servicio del {((settings?.service_level || 0.95) * 100).toFixed(0)}%.
              </p>
            </AcademicCard>

            {/* Volume Discount */}
            <AcademicCard
              title="Descuentos por Volumen"
              formula="TC = (D/Q)·Co + (Q/2)·Ch + D·C para cada tramo"
              icon={DollarSign}
              color="amber"
            >
              <div className="space-y-3">
                {discountTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Cant. mínima"
                        value={tier.min_qty}
                        onChange={(e) => {
                          const t = [...discountTiers];
                          t[idx] = { ...t[idx], min_qty: parseInt(e.target.value) || 0 };
                          setDiscountTiers(t);
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio unitario"
                        value={tier.price}
                        onChange={(e) => {
                          const t = [...discountTiers];
                          t[idx] = { ...t[idx], price: parseFloat(e.target.value) || 0 };
                          setDiscountTiers(t);
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <button
                      onClick={() => setDiscountTiers(discountTiers.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                      disabled={discountTiers.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDiscountTiers([...discountTiers, { min_qty: 0, price: 0 }])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3 h-3" /> Agregar tramo
                  </button>
                  <button
                    onClick={handleEvalDiscount}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Calculator className="w-3 h-3" /> Evaluar
                  </button>
                </div>
              </div>

              {discountResult && (
                <div className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          {["Tramo", "Cant. Mín", "Precio", "Q a Pedir", "Costo Total", ""].map((h) => (
                            <th key={h} className="text-left px-4 py-2 text-xs font-medium uppercase" style={{ color: "var(--text-tertiary)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {discountResult.tramos.map((t) => (
                          <tr
                            key={t.tramo}
                            className={t.es_optimo ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}
                            style={{ borderBottom: "1px solid var(--border-secondary)" }}
                          >
                            <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>#{t.tramo}</td>
                            <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{t.min_qty}</td>
                            <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>${t.precio_unitario}</td>
                            <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{t.cantidad_a_pedir}</td>
                            <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>${t.costo_total_anual.toLocaleString("es-MX")}</td>
                            <td className="px-4 py-2.5">
                              {t.es_optimo && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">ÓPTIMO</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                    {discountResult.explanation}
                  </p>
                </div>
              )}
            </AcademicCard>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ACADEMIC CARD ──────────────────────────────────────────────────────────

function AcademicCard({
  title, formula, icon: Icon, color, children,
}: {
  title: string;
  formula: string;
  icon: typeof TrendingUp;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                <code className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{formula}</code>
              </div>
            </div>
            <BookOpen className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function ResultItem({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className={`font-bold ${big ? "text-2xl" : "text-lg"}`} style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function CostBar({ holding, ordering }: { holding: number; ordering: number }) {
  const total = holding + ordering;
  const hPct = total > 0 ? (holding / total) * 100 : 50;
  return (
    <div className="mt-4 space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
        <div className="bg-blue-500 transition-all duration-500 rounded-l-full" style={{ width: `${hPct}%` }} />
        <div className="bg-violet-500 transition-all duration-500 rounded-r-full" style={{ width: `${100 - hPct}%` }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span>Almacenamiento ({hPct.toFixed(0)}%)</span>
        <span>Pedido ({(100 - hPct).toFixed(0)}%)</span>
      </div>
    </div>
  );
}
