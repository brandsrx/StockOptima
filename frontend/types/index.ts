export interface Product {
  sku: string;
  name: string;
  cost: number;
  current_stock: number;
  lead_time_days: number;
  annual_demand_estimated: number;
  ordering_cost: number;
  holding_cost_rate: number;
  economic_order_quantity: number;
  reorder_point: number;
  status: "Óptimo" | "En Reorden" | "Crítico";
}

export interface BusinessSettings {
  holding_cost_rate: number;
  ordering_cost: number;
  service_level: number;
}

export interface KPIData {
  total_capital: number;
  total_products: number;
  critical_products: number;
  pending_orders: number;
}
