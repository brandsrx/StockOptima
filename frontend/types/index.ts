// ─── PRODUCTO ────────────────────────────────────────────────────────────────

export interface Product {
  sku: string;
  name: string;
  cost: number;
  current_stock: number;
  lead_time_days: number;
  supplier: string;
  annual_demand_estimated: number;
  ordering_cost: number;
  holding_cost_rate: number;
  economic_order_quantity: number;
  reorder_point: number;
  safety_stock: number;
  safety_stock_normal: number;
  safety_stock_poisson: number;
  total_annual_cost: number;
  holding_cost: number;
  ordering_cost_total: number;
  backorder_cost: number;
  discount_applied: boolean;
  discount_quantity: number | null;
  discount_price: number | null;
  status: "Óptimo" | "En Reorden" | "Crítico";
  explanation: string;
  ventas_historicas: number[];
}

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────

export interface BusinessSettings {
  nombre_negocio: string;
  holding_cost_rate: number;
  ordering_cost: number;
  service_level: number;
  dias_laborables: number;
  moneda: string;
  demanda_anual_global: number;
  desviacion_estandar: number;
  penalizacion_faltante: number;
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export interface DashboardData {
  nombre_negocio: string;
  moneda: string;
  total_capital: number;
  total_productos: number;
  productos_criticos: number;
  ordenes_sugeridas: number;
  productos_optimos: number;
  productos_en_reorden: number;
  costo_total_inventario: number;
  nivel_servicio_promedio: number;
  ahorro_estimado_eoq: number;
  productos: Product[];
}

// ─── EOQ ────────────────────────────────────────────────────────────────────

export interface EOQRequest {
  demanda_anual: number;
  costo_pedido: number;
  costo_unitario: number;
  tasa_retencion: number;
}

export interface EOQResponse {
  eoq: number;
  holding_cost: number;
  ordering_cost_total: number;
  total_annual_cost: number;
  numero_pedidos_anual: number;
  dias_entre_pedidos: number;
  annual_demand: number;
  explanation: string;
  formula: string;
  variables: Record<string, number>;
}

// ─── PUNTO DE REORDEN ───────────────────────────────────────────────────────

export interface ReorderRequest {
  demanda_anual: number;
  tiempo_entrega: number;
  dias_laborables?: number;
  nivel_servicio?: number;
  desviacion_estandar?: number;
}

export interface ReorderResponse {
  deterministico: {
    punto_reorden: number;
    formula: string;
    demanda_diaria: number;
    tiempo_entrega: number;
    descripcion: string;
  };
  probabilistico: {
    punto_reorden: number;
    stock_seguridad: number;
    z: number;
    formula: string;
    nivel_servicio: string;
    descripcion: string;
  };
  recomendado: string;
  explanation: string;
}

// ─── STOCK DE SEGURIDAD ─────────────────────────────────────────────────────

export interface SafetyStockRequest {
  demanda_diaria_promedio: number;
  desviacion_estandar: number;
  tiempo_entrega: number;
  nivel_servicio?: number;
}

export interface SafetyStockResponse {
  normal: {
    stock_seguridad: number;
    formula: string;
    z: number;
    sigma: number;
    lead_time: number;
    cuando_usar: string;
  };
  poisson: {
    stock_seguridad: number;
    formula: string;
    lambda: number;
    lead_time: number;
    cuando_usar: string;
  };
  recomendado: string;
  recomendacion_uso: string;
  explanation: string;
}

// ─── PRONÓSTICO ─────────────────────────────────────────────────────────────

export interface ForecastRequest {
  ventas_historicas: number[];
  alpha?: number | null;
}

export interface ForecastMethodResult {
  nombre: string;
  pronostico_siguiente: number;
  serie_pronostico: (number | null)[];
  mae: number;
  rmse: number;
  parametros: Record<string, unknown>;
}

export interface ForecastResponse {
  historico: number[];
  metodos: ForecastMethodResult[];
  mejor_metodo: string;
  mejor_pronostico: number;
  mejor_mae: number;
  mejor_rmse: number;
  explanation: string;
}

// ─── SIMULACIÓN CAMBIARIA ───────────────────────────────────────────────────

export interface CurrencySimulationRequest {
  sku?: string;
  costo_unitario: number;
  demanda_anual: number;
  costo_pedido: number;
  tasa_retencion: number;
  tipo_cambio_actual: number;
  variaciones?: number[];
}

export interface CurrencyScenario {
  variacion_pct: number;
  tipo_cambio: number;
  costo_ajustado: number;
  eoq: number;
  costo_total_anual: number;
  capital_inmovilizado: number;
  diferencia_costo: number;
  diferencia_pct: number;
}

export interface CurrencySimulationResponse {
  escenarios: CurrencyScenario[];
  escenario_base: CurrencyScenario;
  explanation: string;
}

// ─── DESCUENTOS POR VOLUMEN ─────────────────────────────────────────────────

export interface DiscountTier {
  min_qty: number;
  price: number;
}

export interface VolumeDiscountRequest {
  demanda_anual: number;
  costo_pedido: number;
  tasa_retencion: number;
  tramos: DiscountTier[];
}

export interface VolumeDiscountTierResult {
  tramo: number;
  min_qty: number;
  precio_unitario: number;
  eoq_calculado: number;
  cantidad_a_pedir: number;
  costo_pedido_anual: number;
  costo_almacenamiento_anual: number;
  costo_producto_anual: number;
  costo_total_anual: number;
  es_optimo: boolean;
}

export interface VolumeDiscountResponse {
  tramos: VolumeDiscountTierResult[];
  tramo_optimo: number;
  explanation: string;
}
