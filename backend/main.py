from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware # <--- 1. IMPORTAMOS CORS
import pandas as pd
import io
from motor import calcular_eoq_basico

app = FastAPI(
    title="StockOptima API",
    description="Motor y sistema de optimización de inventarios",
    version="1.0.0"
)

# --- 2. CONFIGURAMOS EL PUENTE (CORS) ---
# Esto permite que el frontend (ej. React/Node) se comunique con este backend sin ser bloqueado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitimos cualquier origen por ahora (luego se puede restringir por seguridad)
    allow_credentials=True,
    allow_methods=["*"], # Permitimos GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al backend de StockOptima 📦⚙️"}

@app.post("/api/v1/inventario/cargar")
async def cargar_inventario(file: UploadFile = File(...)):
    """
    Endpoint para leer, validar y calcular variables de inventario.
    """
    nombre_archivo = file.filename
    contenido = await file.read()
    
    try:
        if nombre_archivo.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contenido))
        elif nombre_archivo.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contenido))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Sube CSV o Excel.")
        
        df.columns = df.columns.str.strip()
        
        columnas_requeridas = ['SKU', 'costo_unitario', 'stock_actual', 'tiempo_entrega']
        for col in columnas_requeridas:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Falta la columna: '{col}'")
                
        # Parámetros globales 
        DEMANDA_ANUAL_ESTIMADA = 1200  
        COSTO_POR_PEDIDO = 50.0        
        TASA_MANTENIMIENTO = 0.20      
        
        # Procesamiento matemático
        df_optimizado = calcular_eoq_basico(
            df=df, 
            demanda_anual=DEMANDA_ANUAL_ESTIMADA, 
            costo_pedido=COSTO_POR_PEDIDO, 
            tasa_mantenimiento=TASA_MANTENIMIENTO
        )
        
        productos = df_optimizado.to_dict(orient="records")
        
        return {
            "estado": "exito",
            "mensaje": f"Archivo '{nombre_archivo}' procesado correctamente.",
            "total_productos": len(productos),
            "muestra_productos": productos[:5]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")