import type {
  Product, BusinessSettings, DashboardData,
  EOQRequest, EOQResponse,
  ReorderRequest, ReorderResponse,
  SafetyStockRequest, SafetyStockResponse,
  ForecastRequest, ForecastResponse,
  CurrencySimulationRequest, CurrencySimulationResponse,
  VolumeDiscountRequest, VolumeDiscountResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<BusinessSettings> {
  return request<BusinessSettings>("/config");
}

export async function updateSettings(settings: BusinessSettings): Promise<BusinessSettings> {
  const data = await request<{ configuracion: BusinessSettings }>("/config", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return data.configuracion;
}

// ─── IMPORT ─────────────────────────────────────────────────────────────────

export async function uploadInventoryFile(
  file: File
): Promise<{ productos: Product[]; total_productos: number; filas_validas: number; filas_invalidas: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || "Error al subir el archivo");
  }
  return res.json();
}

// ─── PRODUCTS ───────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const data = await request<{ productos: Product[] }>("/products");
  return data.productos;
}

export async function getProductBySku(sku: string): Promise<Product> {
  return request<Product>(`/products/${sku}`);
}

// ─── EOQ ────────────────────────────────────────────────────────────────────

export async function calculateEOQ(req: EOQRequest): Promise<EOQResponse> {
  return request<EOQResponse>("/eoq", { method: "POST", body: JSON.stringify(req) });
}

// ─── REORDER ────────────────────────────────────────────────────────────────

export async function calculateReorder(req: ReorderRequest): Promise<ReorderResponse> {
  return request<ReorderResponse>("/reorder", { method: "POST", body: JSON.stringify(req) });
}

// ─── SAFETY STOCK ───────────────────────────────────────────────────────────

export async function calculateSafetyStock(req: SafetyStockRequest): Promise<SafetyStockResponse> {
  return request<SafetyStockResponse>("/safety-stock", { method: "POST", body: JSON.stringify(req) });
}

// ─── FORECAST ───────────────────────────────────────────────────────────────

export async function calculateForecast(req: ForecastRequest): Promise<ForecastResponse> {
  return request<ForecastResponse>("/forecast", { method: "POST", body: JSON.stringify(req) });
}

// ─── CURRENCY SIMULATION ────────────────────────────────────────────────────

export async function simulateCurrency(req: CurrencySimulationRequest): Promise<CurrencySimulationResponse> {
  return request<CurrencySimulationResponse>("/currency-simulation", { method: "POST", body: JSON.stringify(req) });
}

// ─── VOLUME DISCOUNT ────────────────────────────────────────────────────────

export async function evaluateVolumeDiscount(req: VolumeDiscountRequest): Promise<VolumeDiscountResponse> {
  return request<VolumeDiscountResponse>("/volume-discount", { method: "POST", body: JSON.stringify(req) });
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard");
}
