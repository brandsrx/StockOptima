"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { getSettings, updateSettings } from "@/services/apiService";
import { Save, CheckCircle, Building2, Calculator, Shield, Info } from "lucide-react";

const settingsSchema = z.object({
  nombre_negocio: z.string().min(1, "Nombre requerido"),
  holding_cost_rate: z.number().min(0).max(1, "Debe ser entre 0 y 1"),
  ordering_cost: z.number().min(0, "Debe ser positivo"),
  service_level: z.number().min(0.5).max(0.9999, "Entre 50% y 99.99%"),
  dias_laborables: z.number().int().min(1).max(365),
  moneda: z.string().min(1),
  demanda_anual_global: z.number().min(0),
  desviacion_estandar: z.number().min(0),
  penalizacion_faltante: z.number().min(0),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  const serviceLevel = watch("service_level");

  useEffect(() => {
    getSettings()
      .then((data) => reset(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Configuración" description="Parámetros del motor de optimización" />
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Configuración" },
      ]} />
      <PageHeader title="Configuración" description="Ajusta los parámetros globales del motor de optimización" />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Info Banner */}
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Los parámetros modificados se aplicarán a todos los cálculos del motor
            matemático (EOQ, punto de reorden, stock de seguridad y costos totales).
          </p>
        </div>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Información del Negocio
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <InputField
              label="Nombre del Negocio"
              description="Identificador de la empresa o comercio"
              error={errors.nombre_negocio?.message}
              {...register("nombre_negocio")}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Días Laborables al Año"
                type="number"
                error={errors.dias_laborables?.message}
                {...register("dias_laborables", { valueAsNumber: true })}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Moneda
                </label>
                <select
                  {...register("moneda")}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="USD">USD — Dólar</option>
                  <option value="BOB">BOB — Boliviano</option>
                  <option value="MXN">MXN — Peso Mexicano</option>
                  <option value="ARS">ARS — Peso Argentino</option>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="PEN">PEN — Sol Peruano</option>
                  <option value="BRL">BRL — Real Brasileño</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Math Parameters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Motor Matemático
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <InputField
              label="Tasa Anual de Retención (I)"
              description="Porcentaje del costo unitario para almacenamiento (ej. 0.20 = 20%)"
              type="number"
              step="0.01"
              suffix={`${((watch("holding_cost_rate") || 0) * 100).toFixed(0)}%`}
              error={errors.holding_cost_rate?.message}
              {...register("holding_cost_rate", { valueAsNumber: true })}
            />
            <InputField
              label="Costo Fijo por Pedido (Co)"
              description="Costo administrativo y logístico por cada orden de compra"
              type="number"
              step="0.01"
              prefix="$"
              error={errors.ordering_cost?.message}
              {...register("ordering_cost", { valueAsNumber: true })}
            />
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Nivel de Servicio Objetivo
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                Probabilidad de no quedarse sin stock (ej. 0.95 = 95%)
              </p>
              <input
                type="range"
                min="0.80"
                max="0.99"
                step="0.01"
                className="w-full accent-blue-600"
                {...register("service_level", { valueAsNumber: true })}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>80%</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {((serviceLevel || 0.95) * 100).toFixed(0)}%
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>99%</span>
              </div>
            </div>
            <InputField
              label="Demanda Anual Global"
              description="Demanda estimada por defecto para productos sin datos históricos"
              type="number"
              error={errors.demanda_anual_global?.message}
              {...register("demanda_anual_global", { valueAsNumber: true })}
            />
            <InputField
              label="Desviación Estándar de Demanda"
              description="Variabilidad diaria de la demanda (para stock de seguridad Normal)"
              type="number"
              step="0.1"
              error={errors.desviacion_estandar?.message}
              {...register("desviacion_estandar", { valueAsNumber: true })}
            />
            <InputField
              label="Penalización por Faltante"
              description="Costo unitario estimado por cada unidad faltante (backorder)"
              type="number"
              step="0.5"
              prefix="$"
              error={errors.penalizacion_faltante?.message}
              {...register("penalizacion_faltante", { valueAsNumber: true })}
            />
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={saved || !isDirty}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

// ─── REUSABLE INPUT ─────────────────────────────────────────────────────────

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, description, error, prefix, suffix, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {description && (
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </p>
      )}
      <div className="relative">
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            prefix ? "pl-8" : ""
          } ${suffix ? "pr-16" : ""}`}
          style={{
            background: "var(--bg-secondary)",
            borderColor: error ? "var(--color-danger)" : "var(--border-primary)",
            color: "var(--text-primary)",
          }}
          {...props}
        />
        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            ({suffix})
          </span>
        )}
      </div>
      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  )
);

InputField.displayName = "InputField";
