from pydantic import BaseModel
from typing import Optional
from datetime import date


class ProductoBase(BaseModel):
    sku: str
    nombre: str
    costo_unitario: float
    stock_actual: int
    tiempo_entrega: int
    proveedor: Optional[str] = ""
    demanda_anual: Optional[float] = 0.0
    ventas_historicas: Optional[list[float]] = []


class ProductoResponse(BaseModel):
    sku: str
    name: str
    cost: float
    current_stock: int
    lead_time_days: int
    supplier: str
    annual_demand_estimated: float
    ordering_cost: float
    holding_cost_rate: float
    economic_order_quantity: int
    reorder_point: int
    safety_stock: int
    total_annual_cost: float
    holding_cost: float
    ordering_cost_total: float
    backorder_cost: float
    discount_applied: bool
    discount_quantity: Optional[float] = None
    discount_price: Optional[float] = None
    status: str


class Configuracion(BaseModel):
    holding_cost_rate: float = 0.20
    ordering_cost: float = 25.0
    service_level: float = 0.95
    demanda_anual_global: float = 1200.0
    desviacion_estandar: float = 2.5
    penalizacion_faltante: float = 5.0


class ConfiguracionResponse(BaseModel):
    holding_cost_rate: float
    ordering_cost: float
    service_level: float
    demanda_anual_global: float
    desviacion_estandar: float
    penalizacion_faltante: float


class VentaHistorica(BaseModel):
    sku: str
    fecha: date
    cantidad: float


class DashboardResumen(BaseModel):
    total_capital: float
    total_productos: int
    productos_criticos: int
    ordenes_sugeridas: int
    productos_optimos: int
    productos_en_reorden: int
    costo_total_inventario: float
    productos: list[ProductoResponse]


class UploadResponse(BaseModel):
    estado: str
    mensaje: str
    total_productos: int
    productos: list[ProductoResponse]
