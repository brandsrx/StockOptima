"""
StockOptima — Schemas Pydantic v2
Modelos de request/response para todos los endpoints del motor de optimización.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── CONFIGURACIÓN DEL NEGOCIO ───────────────────────────────────────────────

class Configuracion(BaseModel):
    nombre_negocio: str = "Mi Negocio"
    holding_cost_rate: float = Field(0.20, ge=0, le=1, description="Tasa anual de retención (I)")
    ordering_cost: float = Field(25.0, ge=0, description="Costo fijo por pedido (Co)")
    service_level: float = Field(0.95, ge=0.50, le=0.9999, description="Nivel de servicio objetivo")
    dias_laborables: int = Field(365, ge=1, le=365, description="Días laborables al año")
    moneda: str = "USD"
    demanda_anual_global: float = Field(1200.0, ge=0, description="Demanda anual por defecto")
    desviacion_estandar: float = Field(2.5, ge=0, description="Desviación estándar de demanda diaria")
    penalizacion_faltante: float = Field(5.0, ge=0, description="Costo por unidad faltante")


class ConfiguracionResponse(BaseModel):
    estado: str
    mensaje: str
    configuracion: Configuracion


# ─── PRODUCTO ────────────────────────────────────────────────────────────────

class ProductoBase(BaseModel):
    sku: str
    nombre: str
    costo_unitario: float = Field(ge=0)
    stock_actual: int = Field(ge=0)
    tiempo_entrega: int = Field(ge=1, description="Lead time en días")
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
    safety_stock_normal: int
    safety_stock_poisson: int
    total_annual_cost: float
    holding_cost: float
    ordering_cost_total: float
    backorder_cost: float
    discount_applied: bool
    discount_quantity: Optional[float] = None
    discount_price: Optional[float] = None
    status: str
    explanation: str = ""
    ventas_historicas: list[float] = []


class UploadResponse(BaseModel):
    estado: str
    mensaje: str
    total_productos: int
    filas_validas: int
    filas_invalidas: int
    productos: list[ProductoResponse]


# ─── EOQ ─────────────────────────────────────────────────────────────────────

class EOQRequest(BaseModel):
    demanda_anual: float = Field(gt=0, description="D — Demanda anual en unidades")
    costo_pedido: float = Field(gt=0, description="Co — Costo fijo por pedido")
    costo_unitario: float = Field(gt=0, description="C — Costo unitario del producto")
    tasa_retencion: float = Field(gt=0, le=1, description="I — Tasa anual de retención")


class EOQResponse(BaseModel):
    eoq: int
    holding_cost: float
    ordering_cost_total: float
    total_annual_cost: float
    numero_pedidos_anual: float
    dias_entre_pedidos: float
    annual_demand: float
    explanation: str
    formula: str = "Q* = √(2·D·Co / Ch), donde Ch = I × C"
    variables: dict


# ─── PUNTO DE REORDEN ────────────────────────────────────────────────────────

class ReorderRequest(BaseModel):
    demanda_anual: float = Field(gt=0)
    tiempo_entrega: int = Field(gt=0, description="Lead time en días")
    dias_laborables: int = Field(default=365, gt=0)
    nivel_servicio: float = Field(default=0.95, ge=0.50, le=0.9999)
    desviacion_estandar: float = Field(default=2.5, ge=0)
    demanda_diaria_promedio: Optional[float] = None


class ReorderResponse(BaseModel):
    deterministico: dict
    probabilistico: dict
    recomendado: str
    explanation: str


# ─── STOCK DE SEGURIDAD ──────────────────────────────────────────────────────

class SafetyStockRequest(BaseModel):
    demanda_diaria_promedio: float = Field(gt=0)
    desviacion_estandar: float = Field(ge=0)
    tiempo_entrega: int = Field(gt=0)
    nivel_servicio: float = Field(default=0.95, ge=0.50, le=0.9999)


class SafetyStockResponse(BaseModel):
    normal: dict
    poisson: dict
    recomendado: str
    recomendacion_uso: str
    explanation: str


# ─── PRONÓSTICO DE DEMANDA ───────────────────────────────────────────────────

class ForecastRequest(BaseModel):
    ventas_historicas: list[float] = Field(min_length=3, description="Ventas mensuales históricas")
    alpha: Optional[float] = Field(default=None, ge=0.01, le=0.99, description="Alpha para suavización (None = auto)")


class ForecastMethodResult(BaseModel):
    nombre: str
    pronostico_siguiente: float
    serie_pronostico: list[float | None]
    mae: float
    rmse: float
    parametros: dict


class ForecastResponse(BaseModel):
    historico: list[float]
    metodos: list[ForecastMethodResult]
    mejor_metodo: str
    mejor_pronostico: float
    mejor_mae: float
    mejor_rmse: float
    explanation: str


# ─── SIMULACIÓN CAMBIARIA ────────────────────────────────────────────────────

class CurrencySimulationRequest(BaseModel):
    sku: Optional[str] = None
    costo_unitario: float = Field(gt=0)
    demanda_anual: float = Field(gt=0)
    costo_pedido: float = Field(gt=0)
    tasa_retencion: float = Field(gt=0, le=1)
    tipo_cambio_actual: float = Field(gt=0, description="Tipo de cambio actual")
    variaciones: list[float] = Field(
        default=[0, 5, 10, 15, 20],
        description="Porcentajes de variación a simular"
    )


class CurrencyScenario(BaseModel):
    variacion_pct: float
    tipo_cambio: float
    costo_ajustado: float
    eoq: int
    costo_total_anual: float
    capital_inmovilizado: float
    diferencia_costo: float
    diferencia_pct: float


class CurrencySimulationResponse(BaseModel):
    escenarios: list[CurrencyScenario]
    escenario_base: CurrencyScenario
    explanation: str


# ─── DESCUENTOS POR VOLUMEN ──────────────────────────────────────────────────

class DiscountTier(BaseModel):
    min_qty: int = Field(ge=0)
    price: float = Field(gt=0)


class VolumeDiscountRequest(BaseModel):
    demanda_anual: float = Field(gt=0)
    costo_pedido: float = Field(gt=0)
    tasa_retencion: float = Field(gt=0, le=1)
    tramos: list[DiscountTier] = Field(min_length=1)


class VolumeDiscountTierResult(BaseModel):
    tramo: int
    min_qty: int
    precio_unitario: float
    eoq_calculado: int
    cantidad_a_pedir: int
    costo_pedido_anual: float
    costo_almacenamiento_anual: float
    costo_producto_anual: float
    costo_total_anual: float
    es_optimo: bool


class VolumeDiscountResponse(BaseModel):
    tramos: list[VolumeDiscountTierResult]
    tramo_optimo: int
    explanation: str


# ─── DASHBOARD ───────────────────────────────────────────────────────────────

class DashboardResumen(BaseModel):
    nombre_negocio: str
    moneda: str
    total_capital: float
    total_productos: int
    productos_criticos: int
    ordenes_sugeridas: int
    productos_optimos: int
    productos_en_reorden: int
    costo_total_inventario: float
    nivel_servicio_promedio: float
    ahorro_estimado_eoq: float
    productos: list[ProductoResponse]
