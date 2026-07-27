import type { Product, BusinessSettings, DashboardData } from "@/types";

const API_BASE = "/api/v1";

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/productos`);
  if (!res.ok) throw new Error("Error al obtener productos");
  const data = await res.json();
  return data.productos;
}

export async function getProductBySku(sku: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/productos/${sku}`);
  if (!res.ok) throw new Error(`Producto '${sku}' no encontrado`);
  return res.json();
}

export async function getSettings(): Promise<BusinessSettings> {
  const res = await fetch(`${API_BASE}/configuracion`);
  if (!res.ok) throw new Error("Error al obtener configuración");
  return res.json();
}

export async function updateSettings(
  settings: BusinessSettings
): Promise<BusinessSettings> {
  const res = await fetch(`${API_BASE}/configuracion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Error al guardar configuración");
  const data = await res.json();
  return data.configuracion;
}

export async function uploadInventoryFile(
  file: File
): Promise<{ productos: Product[]; total_productos: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/inventario/cargar`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || "Error al subir el archivo");
  }
  return res.json();
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard/resumen`);
  if (!res.ok) throw new Error("Error al obtener dashboard");
  return res.json();
}
