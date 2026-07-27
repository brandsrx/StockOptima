import sqlite3
import json
from typing import Optional
from schemas import ProductoBase, Configuracion

DB_PATH = "stockoptima.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS productos (
            sku TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            costo_unitario REAL NOT NULL,
            stock_actual INTEGER NOT NULL,
            tiempo_entrega INTEGER NOT NULL,
            proveedor TEXT DEFAULT '',
            demanda_anual REAL DEFAULT 0,
            ventas_historicas TEXT DEFAULT '[]'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracion (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            holding_cost_rate REAL DEFAULT 0.20,
            ordering_cost REAL DEFAULT 25.0,
            service_level REAL DEFAULT 0.95,
            demanda_anual_global REAL DEFAULT 1200.0,
            desviacion_estandar REAL DEFAULT 2.5,
            penalizacion_faltante REAL DEFAULT 5.0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS historial_ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL,
            fecha TEXT NOT NULL,
            cantidad REAL NOT NULL,
            FOREIGN KEY (sku) REFERENCES productos(sku)
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM configuracion")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO configuracion (id, holding_cost_rate, ordering_cost, service_level, demanda_anual_global, desviacion_estandar, penalizacion_faltante)
            VALUES (1, 0.20, 25.0, 0.95, 1200.0, 2.5, 5.0)
        """)

    conn.commit()
    conn.close()


def upsert_producto(producto: ProductoBase):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO productos (sku, nombre, costo_unitario, stock_actual, tiempo_entrega, proveedor, demanda_anual, ventas_historicas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(sku) DO UPDATE SET
            nombre=excluded.nombre,
            costo_unitario=excluded.costo_unitario,
            stock_actual=excluded.stock_actual,
            tiempo_entrega=excluded.tiempo_entrega,
            proveedor=excluded.proveedor,
            demanda_anual=excluded.demanda_anual,
            ventas_historicas=excluded.ventas_historicas
    """, (
        producto.sku,
        producto.nombre,
        producto.costo_unitario,
        producto.stock_actual,
        producto.tiempo_entrega,
        producto.proveedor,
        producto.demanda_anual,
        json.dumps(producto.ventas_historicas)
    ))
    conn.commit()
    conn.close()


def upsert_productos_batch(productos: list[ProductoBase]):
    conn = get_db()
    cursor = conn.cursor()
    for p in productos:
        cursor.execute("""
            INSERT INTO productos (sku, nombre, costo_unitario, stock_actual, tiempo_entrega, proveedor, demanda_anual, ventas_historicas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(sku) DO UPDATE SET
                nombre=excluded.nombre,
                costo_unitario=excluded.costo_unitario,
                stock_actual=excluded.stock_actual,
                tiempo_entrega=excluded.tiempo_entrega,
                proveedor=excluded.proveedor,
                demanda_anual=excluded.demanda_anual,
                ventas_historicas=excluded.ventas_historicas
        """, (
            p.sku, p.nombre, p.costo_unitario, p.stock_actual,
            p.tiempo_entrega, p.proveedor, p.demanda_anual,
            json.dumps(p.ventas_historicas)
        ))
    conn.commit()
    conn.close()


def get_all_productos() -> list[ProductoBase]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append(ProductoBase(
            sku=row["sku"],
            nombre=row["nombre"],
            costo_unitario=row["costo_unitario"],
            stock_actual=row["stock_actual"],
            tiempo_entrega=row["tiempo_entrega"],
            proveedor=row["proveedor"],
            demanda_anual=row["demanda_anual"],
            ventas_historicas=json.loads(row["ventas_historicas"])
        ))
    return result


def get_producto(sku: str) -> Optional[ProductoBase]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE sku = ?", (sku,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return ProductoBase(
        sku=row["sku"],
        nombre=row["nombre"],
        costo_unitario=row["costo_unitario"],
        stock_actual=row["stock_actual"],
        tiempo_entrega=row["tiempo_entrega"],
        proveedor=row["proveedor"],
        demanda_anual=row["demanda_anual"],
        ventas_historicas=json.loads(row["ventas_historicas"])
    )


def get_configuracion() -> Configuracion:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM configuracion WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return Configuracion()
    return Configuracion(
        holding_cost_rate=row["holding_cost_rate"],
        ordering_cost=row["ordering_cost"],
        service_level=row["service_level"],
        demanda_anual_global=row["demanda_anual_global"],
        desviacion_estandar=row["desviacion_estandar"],
        penalizacion_faltante=row["penalizacion_faltante"]
    )


def update_configuracion(config: Configuracion):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE configuracion SET
            holding_cost_rate = ?,
            ordering_cost = ?,
            service_level = ?,
            demanda_anual_global = ?,
            desviacion_estandar = ?,
            penalizacion_faltante = ?
        WHERE id = 1
    """, (
        config.holding_cost_rate,
        config.ordering_cost,
        config.service_level,
        config.demanda_anual_global,
        config.desviacion_estandar,
        config.penalizacion_faltante
    ))
    conn.commit()
    conn.close()


def insert_venta_historica(sku: str, fecha: str, cantidad: float):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO historial_ventas (sku, fecha, cantidad) VALUES (?, ?, ?)",
        (sku, fecha, cantidad)
    )
    conn.commit()
    conn.close()


def get_ventas_historicas(sku: str) -> list[float]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT cantidad FROM historial_ventas WHERE sku = ? ORDER BY fecha",
        (sku,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [row["cantidad"] for row in rows]
