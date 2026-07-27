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
  total_annual_cost: number;
  holding_cost: number;
  ordering_cost_total: number;
  backorder_cost: number;
  discount_applied: boolean;
  discount_quantity: number | null;
  discount_price: number | null;
  status: "Óptimo" | "En Reorden" | "Crítico";
}

export interface BusinessSettings {
  holding_cost_rate: number;
  ordering_cost: number;
  service_level: number;
  demanda_anual_global: number;
  desviacion_estandar: number;
  penalizacion_faltante: number;
}

export interface KPIData {
  total_capital: number;
  total_products: number;
  critical_products: number;
  pending_orders: number;
}

export interface DashboardData {
  total_capital: number;
  total_productos: number;
  productos_criticos: number;
  ordenes_sugeridas: number;
  productos_optimos: number;
  productos_en_reorden: number;
  costo_total_inventario: number;
  productos: Product[];
}
