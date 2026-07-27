"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getSettings, updateSettings } from "@/services/apiService";
import { Save, CheckCircle } from "lucide-react";
import type { BusinessSettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error silently
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Ajusta los parámetros globales del motor de optimización"
      />

      <div className="max-w-2xl space-y-6">
        <Alert variant="info">
          Los parámetros modificados se aplicarán a todos los cálculos del motor
          matemático (EOQ, punto de reorden, costos totales y backorders).
        </Alert>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">
              Parámetros del Motor Matemático
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tasa Anual de Costo de Retención (I)
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Porcentaje del costo unitario que representa almacenar un
                producto durante un año (ej. 0.20 = 20%).
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.holding_cost_rate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      holding_cost_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ({(settings.holding_cost_rate * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Costo Fijo por Pedido (Co)
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Costo administrativo y logístico fijo que se incurre cada vez
                que se realiza un pedido al proveedor.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.ordering_cost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ordering_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nivel de Servicio Objetivo
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Probabilidad objetivo de no quedarse sin stock (ej. 0.95 = 95%
                de servicio).
              </p>
              <div className="relative">
                <input
                  type="range"
                  min="0.80"
                  max="0.99"
                  step="0.01"
                  value={settings.service_level}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      service_level: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">80%</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(settings.service_level * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400">99%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Demanda Anual Global
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Demanda estimada anual por defecto para productos sin datos históricos.
              </p>
              <input
                type="number"
                step="1"
                min="0"
                value={settings.demanda_anual_global}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    demanda_anual_global: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Desviación Estándar de Demanda
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Variabilidad de la demanda diaria. Usada para calcular el stock de seguridad con distribución Normal.
              </p>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.desviacion_estandar}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    desviacion_estandar: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Penalización por Faltante (Backorder)
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Costo unitario estimado por cada unidad faltante (backorder).
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={settings.penalizacion_faltante}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      penalizacion_faltante: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saved}>
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
          </Button>
        </div>
      </div>
    </div>
  );
}
