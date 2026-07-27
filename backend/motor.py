import numpy as np
from scipy.stats import norm, poisson
from schemas import ProductoBase, ProductoResponse, Configuracion


def calcular_z(nivel_servicio: float) -> float:
    """Calcula el valor Z de la distribución Normal para un nivel de servicio dado."""
    return norm.ppf(nivel_servicio)


def pronosticar_demanda_promedio_movil(ventas_historicas: list[float], ventana: int = 6) -> float:
    """Promedio móvil de las últimas `ventana` observaciones."""
    if not ventas_historicas:
        return 0.0
    datos = ventas_historicas[-ventana:]
    return float(np.mean(datos))


def pronosticar_demanda_suavizacion_exponencial(
    ventas_historicas: list[float], alpha: float = 0.3
) -> float:
    """Suavizamiento exponencial simple. Alpha controla la ponderación reciente."""
    if not ventas_historicas:
        return 0.0
    forecast = float(ventas_historicas[0])
    for venta in ventas_historicas[1:]:
        forecast = alpha * venta + (1 - alpha) * forecast
    return forecast


def calcular_stock_seguridad_normal(
    desviacion_estandar: float,
    tiempo_entrega: int,
    nivel_servicio: float
) -> int:
    """SS = Z * sigma * sqrt(L) — distribución Normal."""
    z = calcular_z(nivel_servicio)
    return int(round(z * desviacion_estandar * np.sqrt(tiempo_entrega)))


def calcular_stock_seguridad_poisson(
    demanda_diaria_promedio: float,
    tiempo_entrega: int,
    nivel_servicio: float
) -> int:
    """Stock de seguridad usando distribución de Poisson.
    Encuentra el menor SS tal que P(demanda durante L <= media_L + SS) >= nivel_servicio."""
    if demanda_diaria_promedio <= 0 or tiempo_entrega <= 0:
        return 0
    media_l = demanda_diaria_promedio * tiempo_entrega
    ss = 0
    while True:
        prob = poisson.cdf(media_l + ss, media_l)
        if prob >= nivel_servicio:
            return int(ss)
        ss += 1
        if ss > 500:
            return int(ss)


def calcular_eoq(demanda_anual: float, costo_pedido: float, costo_mantenimiento: float) -> float:
    """Q* = sqrt(2*D*S/H) — Cantidad Económica de Pedido."""
    if costo_mantenimiento <= 0:
        return 0
    return np.sqrt((2 * demanda_anual * costo_pedido) / costo_mantenimiento)


def calcular_punto_reorden(
    demanda_diaria: float, tiempo_entrega: int, stock_seguridad: int
) -> int:
    """r = (D/365)*L + SS"""
    return int(round(demanda_diaria * tiempo_entrega + stock_seguridad))


def calcular_costo_total_anual(
    demanda_anual: float,
    eoq: float,
    costo_pedido: float,
    costo_unitario: float,
    tasa_mantenimiento: float
) -> float:
    """TC = (D/Q)*S + (Q/2)*H + D*C"""
    if eoq <= 0:
        return demanda_anual * costo_unitario
    H = costo_unitario * tasa_mantenimiento
    costo_ordenar = (demanda_anual / eoq) * costo_pedido
    costo_mantener = (eoq / 2) * H
    costo_producto = demanda_anual * costo_unitario
    return round(costo_ordenar + costo_mantener + costo_producto, 2)


def calcular_costo_almacenamiento(eoq: float, costo_unitario: float, tasa: float) -> float:
    return round((eoq / 2) * costo_unitario * tasa, 2)


def calcular_costo_pedido_total(demanda_anual: float, eoq: float, costo_pedido: float) -> float:
    if eoq <= 0:
        return 0
    return round((demanda_anual / eoq) * costo_pedido, 2)


def calcular_costo_backorder(
    demanda_anual: float, eoq: float, stock_seguridad: int, penalizacion_faltante: float
) -> float:
    """Modelo de faltantes planeados: CB = (D/Q)*B*SS / (Q + SS) simplificado.
    Costo esperado de backorders por ciclo."""
    if eoq <= 0 or stock_seguridad <= 0:
        return 0.0
    num_ordenes = demanda_anual / eoq
    costo_por_orden = penalizacion_faltante * (stock_seguridad ** 2) / (2 * (eoq + stock_seguridad))
    return round(num_ordenes * costo_por_orden, 2)


def evaluar_descuento_volumen(
    eoq: float, costo_unitario: float, descuento_pct: float, cantidad_minima: float
) -> dict:
    """Evalúa si conviene pedir la cantidad mínima con descuento vs. Q* sin descuento."""
    costo_sin_descuento = eoq * costo_unitario
    if eoq >= cantidad_minima:
        return {
            "aplicado": False,
            "cantidad_sugerida": int(round(eoq)),
            "precio_unitario": costo_unitario
        }
    costo_con_descuento = cantidad_minima * costo_unitario * (1 - descuento_pct / 100)
    if costo_con_descuento < costo_sin_descuento:
        return {
            "aplicado": True,
            "cantidad_sugerida": int(round(cantidad_minima)),
            "precio_unitario": round(costo_unitario * (1 - descuento_pct / 100), 2)
        }
    return {
        "aplicado": False,
        "cantidad_sugerida": int(round(eoq)),
        "precio_unitario": costo_unitario
    }


def calcular_estado(stock_actual: int, punto_reorden: int) -> str:
    """Clasifica el estado del producto."""
    if stock_actual <= punto_reorden * 0.5:
        return "Crítico"
    elif stock_actual <= punto_reorden:
        return "En Reorden"
    return "Óptimo"


def procesar_producto(producto: ProductoBase, config: Configuracion) -> ProductoResponse:
    """Procesa un producto individual con todos los cálculos del motor."""
    demanda = producto.demanda_anual if producto.demanda_anual > 0 else config.demanda_anual_global
    H = producto.costo_unitario * config.holding_cost_rate

    eoq = calcular_eoq(demanda, config.ordering_cost, H)
    demanda_diaria = demanda / 365

    ss_normal = calcular_stock_seguridad_normal(
        config.desviacion_estandar, producto.tiempo_entrega, config.service_level
    )
    ss_poisson = calcular_stock_seguridad_poisson(
        demanda_diaria, producto.tiempo_entrega, config.service_level
    )
    ss = max(ss_normal, ss_poisson)

    punto_reorden = calcular_punto_reorden(demanda_diaria, producto.tiempo_entrega, ss)

    total_cost = calcular_costo_total_anual(
        demanda, eoq, config.ordering_cost, producto.costo_unitario, config.holding_cost_rate
    )
    holding = calcular_costo_almacenamiento(eoq, producto.costo_unitario, config.holding_cost_rate)
    ordering = calcular_costo_pedido_total(demanda, eoq, config.ordering_cost)
    backorder = calcular_costo_backorder(demanda, eoq, ss, config.penalizacion_faltante)

    discount = evaluar_descuento_volumen(eoq, producto.costo_unitario, 10, eoq * 1.5)

    status = calcular_estado(producto.stock_actual, punto_reorden)

    return ProductoResponse(
        sku=producto.sku,
        name=producto.nombre,
        cost=producto.costo_unitario,
        current_stock=producto.stock_actual,
        lead_time_days=producto.tiempo_entrega,
        supplier=producto.proveedor,
        annual_demand_estimated=round(demanda, 2),
        ordering_cost=config.ordering_cost,
        holding_cost_rate=config.holding_cost_rate,
        economic_order_quantity=int(round(eoq)),
        reorder_point=punto_reorden,
        safety_stock=ss,
        total_annual_cost=total_cost,
        holding_cost=holding,
        ordering_cost_total=ordering,
        backorder_cost=backorder,
        discount_applied=discount["aplicado"],
        discount_quantity=discount["cantidad_sugerida"],
        discount_price=discount["precio_unitario"],
        status=status
    )


def procesar_inventario(
    productos: list[ProductoBase], config: Configuracion
) -> list[ProductoResponse]:
    """Procesa todo el inventario con el motor matemático."""
    return [procesar_producto(p, config) for p in productos]
