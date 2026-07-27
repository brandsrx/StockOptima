# StockOptima

Sistema universal de optimizacion de inventarios para pequenos y medianos comercios. Automatiza las decisiones financieras y logisticas del inventario mediante modelos matematicos de investigacion operativa.

## Arquitectura

```
StockOptima/
├── backend/          Python (FastAPI)
│   ├── app.py        Endpoints REST API
│   ├── motor.py      Motor matematico (EOQ, SS, backorders, pronostico)
│   ├── database.py   SQLite para persistencia
│   ├── schemas.py    Modelos Pydantic
│   └── requirements.txt
│
└── frontend/         Next.js (React + TypeScript + Tailwind)
    ├── app/          Paginas: Dashboard, Inventario, Simulador, Configuracion
    ├── components/   Componentes UI reutilizables
    ├── services/     Cliente API conectado al backend
    ├── types/        Definiciones TypeScript
    └── data/         Datos mock (fallback)
```

## Motor Matematico

- **EOQ (Q\*)**: Cantidad Economica de Pedido `sqrt(2DS/H)`
- **Stock de Seguridad**: Distribucion Normal y Poisson con nivel de servicio configurable
- **Punto de Reorden (r)**: Demanda durante entrega + stock de seguridad
- **Costos Totales**: TC = (D/Q)S + (Q/2)H + DC
- **Backorders**: Penalizacion por faltantes planeados
- **Descuentos por Volumen**: Evaluacion automatica de descuentos del proveedor
- **Pronostico de Demanda**: Promedio movil y suavizamiento exponencial

## Como Ejecutar

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

El frontend corre en `http://localhost:3000` y proxies las llamadas `/api/v1/*` al backend en `http://localhost:8000`.

## Endpoints API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/productos` | Lista productos con calculos |
| GET | `/api/v1/productos/{sku}` | Detalle de un producto |
| POST | `/api/v1/inventario/cargar` | Subir CSV/Excel del inventario |
| GET | `/api/v1/configuracion` | Obtener parametros globales |
| POST | `/api/v1/configuracion` | Actualizar parametros |
| GET | `/api/v1/dashboard/resumen` | KPIs y metricas agregadas |

## Formato de Archivo de Inventario

CSV o Excel con estas columnas:

| Columna | Requerida | Descripcion |
|---------|-----------|-------------|
| SKU | Si | Codigo unico del producto |
| Nombre | Si | Nombre del producto |
| Costo Unitario | Si | Costo por unidad |
| Stock Actual | Si | Unidades en inventario |
| Tiempo Entrega | Si | Dias de entrega del proveedor |
| Proveedor | No | Nombre del proveedor |
| Demanda Anual | No | Demanda estimada anual |

## Tecnologias

- **Backend**: Python 3.10+, FastAPI, NumPy, SciPy, Pandas, SQLite
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Chart.js
