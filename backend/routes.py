"""
StockOptima — Rutas de la API (routes.py)
Endpoints organizados por módulo funcional.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io

from schemas import (
    ProductoBase, Configuracion, ConfiguracionResponse,
    EOQRequest, EOQResponse,
    ReorderRequest, ReorderResponse,
    SafetyStockRequest, SafetyStockResponse,
    ForecastRequest, ForecastResponse,
    CurrencySimulationRequest, CurrencySimulationResponse,
    VolumeDiscountRequest, VolumeDiscountResponse,
)
from inventory_math import (
    procesar_inventario, procesar_producto,
    calcular_eoq_completo,
    calcular_reorden_completo,
    calcular_safety_stock_completo,
    evaluar_descuentos_volumen,
    simular_volatilidad,
)
from forecasting import pronosticar
from database import (
    upsert_productos_batch, get_all_productos,
    get_configuracion, update_configuracion, get_producto,
)

router = APIRouter(prefix="/api")


# ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

@router.get("/config")
def obtener_configuracion():
    """Obtiene los parámetros globales del motor."""
    config = get_configuracion()
    return config.model_dump()


@router.post("/config")
def actualizar_configuracion(config: Configuracion):
    """Actualiza los parámetros globales del negocio."""
    update_configuracion(config)
    return {"estado": "exito", "mensaje": "Configuración actualizada", "configuracion": config.model_dump()}


# ─── IMPORTACIÓN DE INVENTARIO ───────────────────────────────────────────────

@router.post("/import")
async def cargar_inventario(file: UploadFile = File(...)):
    """Sube un archivo CSV o Excel con el inventario. Procesa y guarda en la base de datos."""
    nombre = file.filename or "archivo"
    contenido = await file.read()
    filas_invalidas = 0

    try:
        if nombre.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contenido))
        elif nombre.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contenido))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa CSV o Excel (.xlsx).")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

    df.columns = df.columns.str.strip()

    # Mapeo flexible de columnas
    mapeo_columnas = {
        "SKU": "sku", "sku": "sku", "Codigo": "sku", "codigo": "sku",
        "Nombre": "nombre", "nombre": "nombre", "name": "nombre", "Name": "nombre",
        "Costo Unitario": "costo_unitario", "costo_unitario": "costo_unitario",
        "cost": "costo_unitario", "Costo": "costo_unitario", "precio": "costo_unitario",
        "Stock Actual": "stock_actual", "stock_actual": "stock_actual",
        "current_stock": "stock_actual", "Stock": "stock_actual", "stock": "stock_actual",
        "Tiempo Entrega": "tiempo_entrega", "tiempo_entrega": "tiempo_entrega",
        "lead_time_days": "tiempo_entrega", "Lead Time": "tiempo_entrega",
        "Proveedor": "proveedor", "proveedor": "proveedor", "supplier": "proveedor",
        "Demanda Anual": "demanda_anual", "demanda_anual": "demanda_anual",
        "annual_demand_estimated": "demanda_anual", "annual_demand": "demanda_anual",
    }
    df = df.rename(columns={k: v for k, v in mapeo_columnas.items() if k in df.columns})

    # Buscar columnas de ventas mensuales (mes_1, mes_2, ... mes_12)
    meses_cols = [col for col in df.columns if col.startswith("mes_")]

    requeridas = ['sku', 'nombre', 'costo_unitario', 'stock_actual', 'tiempo_entrega']
    for col in requeridas:
        if col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Falta la columna requerida: '{col}'. Columnas disponibles: {list(df.columns)}"
            )

    if "proveedor" not in df.columns:
        df["proveedor"] = ""
    if "demanda_anual" not in df.columns:
        df["demanda_anual"] = 0

    # Limpieza de tipos
    total_filas = len(df)
    df["costo_unitario"] = pd.to_numeric(df["costo_unitario"], errors="coerce")
    df["stock_actual"] = pd.to_numeric(df["stock_actual"], errors="coerce")
    df["tiempo_entrega"] = pd.to_numeric(df["tiempo_entrega"], errors="coerce")
    df["demanda_anual"] = pd.to_numeric(df["demanda_anual"], errors="coerce").fillna(0)

    # Marcar filas inválidas
    invalidas = df[df[["sku", "costo_unitario", "stock_actual", "tiempo_entrega"]].isna().any(axis=1)]
    filas_invalidas = len(invalidas)

    # Quedarnos solo con filas válidas
    df = df.dropna(subset=["sku", "costo_unitario", "stock_actual", "tiempo_entrega"])
    df["costo_unitario"] = df["costo_unitario"].astype(float)
    df["stock_actual"] = df["stock_actual"].astype(int)
    df["tiempo_entrega"] = df["tiempo_entrega"].astype(int).clip(lower=1)

    productos = []
    for _, row in df.iterrows():
        # Extraer ventas históricas de columnas mes_*
        ventas = []
        for col in meses_cols:
            val = pd.to_numeric(row.get(col, 0), errors="coerce")
            if not pd.isna(val):
                ventas.append(float(val))

        # Si hay ventas mensuales y no hay demanda anual, calcularla
        demanda = float(row.get("demanda_anual", 0))
        if demanda == 0 and ventas:
            demanda = sum(ventas)

        productos.append(ProductoBase(
            sku=str(row["sku"]).strip(),
            nombre=str(row["nombre"]).strip(),
            costo_unitario=float(row["costo_unitario"]),
            stock_actual=int(row["stock_actual"]),
            tiempo_entrega=int(row["tiempo_entrega"]),
            proveedor=str(row.get("proveedor", "")).strip(),
            demanda_anual=demanda,
            ventas_historicas=ventas,
        ))

    upsert_productos_batch(productos)

    config = get_configuracion()
    procesados = procesar_inventario(productos, config)

    return {
        "estado": "exito",
        "mensaje": f"Archivo '{nombre}' procesado. {len(procesados)} productos guardados.",
        "total_productos": len(procesados),
        "filas_validas": len(procesados),
        "filas_invalidas": filas_invalidas,
        "productos": [p.model_dump() for p in procesados]
    }


# ─── PRODUCTOS ───────────────────────────────────────────────────────────────

@router.get("/products")
def listar_productos():
    """Lista todos los productos con los cálculos del motor matemático."""
    config = get_configuracion()
    productos = get_all_productos()
    procesados = procesar_inventario(productos, config)
    return {"productos": [p.model_dump() for p in procesados]}


@router.get("/products/{sku}")
def obtener_producto_por_sku(sku: str):
    """Obtiene un producto específico por SKU."""
    config = get_configuracion()
    producto = get_producto(sku)
    if not producto:
        raise HTTPException(status_code=404, detail=f"Producto '{sku}' no encontrado")
    procesado = procesar_producto(producto, config)
    return procesado.model_dump()


# ─── EOQ ─────────────────────────────────────────────────────────────────────

@router.post("/eoq")
def calcular_eoq_endpoint(req: EOQRequest) -> EOQResponse:
    """Calcula la Cantidad Económica de Pedido (EOQ) con explicación completa."""
    return calcular_eoq_completo(req)


# ─── PUNTO DE REORDEN ────────────────────────────────────────────────────────

@router.post("/reorder")
def calcular_reorden_endpoint(req: ReorderRequest) -> ReorderResponse:
    """Calcula y compara punto de reorden determinístico vs probabilístico."""
    return calcular_reorden_completo(req)


# ─── STOCK DE SEGURIDAD ──────────────────────────────────────────────────────

@router.post("/safety-stock")
def calcular_safety_stock_endpoint(req: SafetyStockRequest) -> SafetyStockResponse:
    """Calcula y compara stock de seguridad Normal vs Poisson."""
    return calcular_safety_stock_completo(req)


# ─── PRONÓSTICO ──────────────────────────────────────────────────────────────

@router.post("/forecast")
def pronosticar_endpoint(req: ForecastRequest) -> ForecastResponse:
    """Ejecuta pronóstico de demanda con múltiples métodos y selecciona el mejor."""
    return pronosticar(req)


# ─── SIMULACIÓN CAMBIARIA ────────────────────────────────────────────────────

@router.post("/currency-simulation")
def simular_volatilidad_endpoint(req: CurrencySimulationRequest) -> CurrencySimulationResponse:
    """Simula el impacto de la volatilidad cambiaria en costos de inventario."""
    return simular_volatilidad(req)


# ─── DESCUENTOS POR VOLUMEN ──────────────────────────────────────────────────

@router.post("/volume-discount")
def evaluar_descuentos_endpoint(req: VolumeDiscountRequest) -> VolumeDiscountResponse:
    """Evalúa múltiples tramos de descuento y encuentra la cantidad óptima."""
    return evaluar_descuentos_volumen(req)


# ─── DASHBOARD ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard_resumen():
    """Retorna el resumen del dashboard con KPIs expandidos."""
    config = get_configuracion()
    productos_raw = get_all_productos()
    procesados = procesar_inventario(productos_raw, config)

    if not procesados:
        return {
            "nombre_negocio": config.nombre_negocio,
            "moneda": config.moneda,
            "total_capital": 0,
            "total_productos": 0,
            "productos_criticos": 0,
            "ordenes_sugeridas": 0,
            "productos_optimos": 0,
            "productos_en_reorden": 0,
            "costo_total_inventario": 0,
            "nivel_servicio_promedio": config.service_level * 100,
            "ahorro_estimado_eoq": 0,
            "productos": []
        }

    total_capital = sum(p.cost * p.current_stock for p in procesados)
    criticos = sum(1 for p in procesados if p.status == "Crítico")
    en_reorden = sum(1 for p in procesados if p.status == "En Reorden")
    optimos = sum(1 for p in procesados if p.status == "Óptimo")
    ordenes = criticos + en_reorden
    costo_total = sum(p.total_annual_cost for p in procesados)

    # Ahorro estimado: diferencia entre pedir en lotes arbitrarios vs EOQ
    ahorro = 0
    for p in procesados:
        if p.economic_order_quantity > 0:
            # Costo si se pidiera el doble de Q* (subóptimo)
            Q_sub = p.economic_order_quantity * 2
            Ch = p.cost * p.holding_cost_rate
            costo_sub = (p.annual_demand_estimated / Q_sub) * p.ordering_cost + (Q_sub / 2) * Ch
            costo_opt = (p.annual_demand_estimated / p.economic_order_quantity) * p.ordering_cost + (p.economic_order_quantity / 2) * Ch
            ahorro += max(0, costo_sub - costo_opt)

    return {
        "nombre_negocio": config.nombre_negocio,
        "moneda": config.moneda,
        "total_capital": round(total_capital, 2),
        "total_productos": len(procesados),
        "productos_criticos": criticos,
        "ordenes_sugeridas": ordenes,
        "productos_optimos": optimos,
        "productos_en_reorden": en_reorden,
        "costo_total_inventario": round(costo_total, 2),
        "nivel_servicio_promedio": round(config.service_level * 100, 1),
        "ahorro_estimado_eoq": round(ahorro, 2),
        "productos": [p.model_dump() for p in procesados]
    }
