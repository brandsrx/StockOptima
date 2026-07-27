from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from motor import procesar_inventario, procesar_producto
from schemas import (
    ProductoBase, ProductoResponse, Configuracion, ConfiguracionResponse,
    DashboardResumen, UploadResponse
)
from database import (
    init_db, upsert_productos_batch, get_all_productos,
    get_configuracion, update_configuracion
)

app = FastAPI(
    title="StockOptima API",
    description="Motor y sistema de optimización de inventarios",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def read_root():
    return {"mensaje": "StockOptima API — Motor de Optimización de Inventarios"}


@app.get("/api/v1/productos")
def listar_productos():
    """Lista todos los productos con los cálculos del motor matemático."""
    config = get_configuracion()
    productos = get_all_productos()
    procesados = procesar_inventario(productos, config)
    return {"productos": [p.model_dump() for p in procesados]}


@app.get("/api/v1/productos/{sku}")
def obtener_producto(sku: str):
    """Obtiene un producto específico por SKU."""
    from database import get_producto
    config = get_configuracion()
    producto = get_producto(sku)
    if not producto:
        raise HTTPException(status_code=404, detail=f"Producto '{sku}' no encontrado")
    procesado = procesar_producto(producto, config)
    return procesado.model_dump()


@app.post("/api/v1/inventario/cargar")
async def cargar_inventario(file: UploadFile = File(...)):
    """Sube un archivo CSV o Excel con el inventario. Procesa y guarda en la base de datos."""
    nombre = file.filename
    contenido = await file.read()

    try:
        if nombre.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contenido))
        elif nombre.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contenido))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa CSV o Excel.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

    df.columns = df.columns.str.strip()

    mapeo_columnas = {
        "SKU": "sku", "sku": "sku",
        "Nombre": "nombre", "nombre": "nombre", "name": "nombre",
        "Costo Unitario": "costo_unitario", "costo_unitario": "costo_unitario",
        "cost": "costo_unitario",
        "Stock Actual": "stock_actual", "stock_actual": "stock_actual",
        "current_stock": "stock_actual",
        "Tiempo Entrega": "tiempo_entrega", "tiempo_entrega": "tiempo_entrega",
        "lead_time_days": "tiempo_entrega",
        "Proveedor": "proveedor", "proveedor": "proveedor",
        "Demanda Anual": "demanda_anual", "demanda_anual": "demanda_anual",
        "annual_demand_estimated": "demanda_anual",
    }
    df = df.rename(columns={k: v for k, v in mapeo_columnas.items() if k in df.columns})

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

    df["costo_unitario"] = pd.to_numeric(df["costo_unitario"], errors="coerce").fillna(0)
    df["stock_actual"] = pd.to_numeric(df["stock_actual"], errors="coerce").fillna(0).astype(int)
    df["tiempo_entrega"] = pd.to_numeric(df["tiempo_entrega"], errors="coerce").fillna(1).astype(int)
    df["demanda_anual"] = pd.to_numeric(df["demanda_anual"], errors="coerce").fillna(0)

    df = df.dropna(subset=["sku"])

    productos = []
    for _, row in df.iterrows():
        productos.append(ProductoBase(
            sku=str(row["sku"]).strip(),
            nombre=str(row["nombre"]).strip(),
            costo_unitario=float(row["costo_unitario"]),
            stock_actual=int(row["stock_actual"]),
            tiempo_entrega=int(row["tiempo_entrega"]),
            proveedor=str(row.get("proveedor", "")).strip(),
            demanda_anual=float(row.get("demanda_anual", 0)),
        ))

    upsert_productos_batch(productos)

    config = get_configuracion()
    procesados = procesar_inventario(productos, config)

    return {
        "estado": "exito",
        "mensaje": f"Archivo '{nombre}' procesado. {len(procesados)} productos guardados.",
        "total_productos": len(procesados),
        "productos": [p.model_dump() for p in procesados]
    }


@app.get("/api/v1/configuracion")
def obtener_configuracion():
    """Obtiene los parámetros globales del motor."""
    config = get_configuracion()
    return config.model_dump()


@app.post("/api/v1/configuracion")
def actualizar_configuracion(config: Configuracion):
    """Actualiza los parámetros globales. Se aplicarán a todos los cálculos futuros."""
    update_configuracion(config)
    return {"estado": "exito", "mensaje": "Configuración actualizada", "configuracion": config.model_dump()}


@app.get("/api/v1/dashboard/resumen")
def dashboard_resumen():
    """Retorna el resumen del dashboard con KPIs y métricas."""
    config = get_configuracion()
    productos = get_all_productos()
    procesados = procesar_inventario(productos, config)

    total_capital = sum(p.cost * p.current_stock for p in procesados)
    criticos = sum(1 for p in procesados if p.status == "Crítico")
    en_reorden = sum(1 for p in procesados if p.status == "En Reorden")
    optimos = sum(1 for p in procesados if p.status == "Óptimo")
    ordenes = criticos + en_reorden
    costo_total = sum(p.total_annual_cost for p in procesados)

    return {
        "total_capital": round(total_capital, 2),
        "total_productos": len(procesados),
        "productos_criticos": criticos,
        "ordenes_sugeridas": ordenes,
        "productos_optimos": optimos,
        "productos_en_reorden": en_reorden,
        "costo_total_inventario": round(costo_total, 2),
        "productos": [p.model_dump() for p in procesados]
    }
