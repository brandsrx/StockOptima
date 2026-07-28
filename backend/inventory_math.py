"""
StockOptima — Motor Matemático de Inventarios (inventory_math.py)

Implementa los modelos clásicos de Investigación Operativa para optimización
de inventarios orientados a MIPYMES.

Modelos implementados:
  - EOQ (Economic Order Quantity) — Cantidad Económica de Pedido
  - Punto de Reorden (Determinístico y Probabilístico)
  - Stock de Seguridad (Normal y Poisson)
  - Descuentos por Volumen (multi-tramo)
  - Costo Total Anual con desglose
  - Simulación de Volatilidad Cambiaria
"""

import math
import numpy as np
from scipy.stats import norm, poisson
from schemas import (
    ProductoBase, ProductoResponse, Configuracion,
    EOQRequest, EOQResponse,
    ReorderRequest, ReorderResponse,
    SafetyStockRequest, SafetyStockResponse,
    VolumeDiscountRequest, VolumeDiscountResponse, VolumeDiscountTierResult,
    CurrencySimulationRequest, CurrencySimulationResponse, CurrencyScenario,
)


# ─── TABLA Z ─────────────────────────────────────────────────────────────────
# Valores Z precalculados para niveles de servicio comunes en OPE II

TABLA_Z = {
    0.90: 1.2816,
    0.95: 1.6449,
    0.97: 1.8808,
    0.99: 2.3263,
}


def calcular_z(nivel_servicio: float) -> float:
    """Calcula el valor Z de la distribución Normal estándar.

    Para niveles de servicio comunes (90%, 95%, 97%, 99%) devuelve
    valores precalculados. Para otros niveles, usa la función inversa
    de la distribución Normal (ppf).

    Parámetros:
        nivel_servicio: Probabilidad objetivo (ej. 0.95 = 95%)

    Retorna:
        Valor Z correspondiente
    """
    rounded = round(nivel_servicio, 2)
    if rounded in TABLA_Z:
        return TABLA_Z[rounded]
    return float(norm.ppf(nivel_servicio))


# ─── EOQ — CANTIDAD ECONÓMICA DE PEDIDO ──────────────────────────────────────

def calcular_eoq(demanda_anual: float, costo_pedido: float, costo_mantenimiento: float) -> float:
    """Q* = √(2·D·Co / Ch) — Modelo EOQ clásico de Harris-Wilson.

    Determina la cantidad óptima de pedido que minimiza la suma de:
    - Costos de ordenar: (D/Q)·Co
    - Costos de mantener: (Q/2)·Ch

    Parámetros:
        demanda_anual (D): Demanda anual en unidades
        costo_pedido (Co): Costo fijo por cada orden de compra
        costo_mantenimiento (Ch): Costo de mantener una unidad durante un año = I × C

    Retorna:
        Q* — Cantidad económica de pedido (float, sin redondear)
    """
    if demanda_anual <= 0 or costo_pedido <= 0 or costo_mantenimiento <= 0:
        return 0.0
    return float(np.sqrt((2 * demanda_anual * costo_pedido) / costo_mantenimiento))


def calcular_eoq_completo(req: EOQRequest) -> EOQResponse:
    """Calcula EOQ con desglose completo y explicación académica."""
    Ch = req.tasa_retencion * req.costo_unitario
    if Ch <= 0:
        return EOQResponse(
            eoq=0, holding_cost=0, ordering_cost_total=0, total_annual_cost=0,
            numero_pedidos_anual=0, dias_entre_pedidos=0, annual_demand=req.demanda_anual,
            explanation="No se puede calcular: el costo de mantenimiento es cero.",
            variables={"D": req.demanda_anual, "Co": req.costo_pedido, "C": req.costo_unitario, "I": req.tasa_retencion, "Ch": 0}
        )

    eoq_raw = calcular_eoq(req.demanda_anual, req.costo_pedido, Ch)
    eoq = max(1, int(round(eoq_raw)))

    ordering = (req.demanda_anual / eoq) * req.costo_pedido
    holding = (eoq / 2) * Ch
    total = ordering + holding + (req.demanda_anual * req.costo_unitario)
    num_pedidos = req.demanda_anual / eoq
    dias_entre = 365 / num_pedidos if num_pedidos > 0 else 0

    explanation = (
        f"La cantidad óptima de pedido es {eoq} unidades. "
        f"Esto significa que se deben realizar aproximadamente {num_pedidos:.1f} pedidos al año, "
        f"uno cada {dias_entre:.0f} días. "
        f"El costo anual de almacenamiento (${holding:,.2f}) y el costo de pedido (${ordering:,.2f}) "
        f"se equilibran en este punto óptimo, minimizando el costo total."
    )

    return EOQResponse(
        eoq=eoq,
        holding_cost=round(holding, 2),
        ordering_cost_total=round(ordering, 2),
        total_annual_cost=round(total, 2),
        numero_pedidos_anual=round(num_pedidos, 2),
        dias_entre_pedidos=round(dias_entre, 1),
        annual_demand=req.demanda_anual,
        explanation=explanation,
        variables={
            "D": req.demanda_anual,
            "Co": req.costo_pedido,
            "C": req.costo_unitario,
            "I": req.tasa_retencion,
            "Ch": round(Ch, 4),
        }
    )


# ─── PUNTO DE REORDEN ────────────────────────────────────────────────────────

def calcular_punto_reorden_deterministico(demanda_diaria: float, tiempo_entrega: int) -> int:
    """r = d × m — Punto de reorden determinístico (sin incertidumbre).

    Asume demanda constante y tiempo de entrega fijo.
    Se usa cuando la variabilidad es baja o despreciable.
    """
    return max(0, int(round(demanda_diaria * tiempo_entrega)))


def calcular_punto_reorden_probabilistico(
    demanda_diaria: float,
    tiempo_entrega: int,
    nivel_servicio: float,
    desviacion_estandar: float
) -> tuple[int, int]:
    """r = μ + z·σ·√m — Punto de reorden probabilístico.

    Incluye stock de seguridad para cubrir la incertidumbre en la demanda.

    Retorna:
        (punto_reorden, stock_seguridad)
    """
    z = calcular_z(nivel_servicio)
    mu = demanda_diaria * tiempo_entrega
    ss = z * desviacion_estandar * math.sqrt(tiempo_entrega)
    r = mu + ss
    return max(0, int(round(r))), max(0, int(round(ss)))


def calcular_reorden_completo(req: ReorderRequest) -> ReorderResponse:
    """Compara los métodos determinístico y probabilístico."""
    demanda_diaria = req.demanda_anual / req.dias_laborables
    if req.demanda_diaria_promedio is not None:
        demanda_diaria = req.demanda_diaria_promedio

    r_det = calcular_punto_reorden_deterministico(demanda_diaria, req.tiempo_entrega)
    r_prob, ss = calcular_punto_reorden_probabilistico(
        demanda_diaria, req.tiempo_entrega, req.nivel_servicio, req.desviacion_estandar
    )
    z = calcular_z(req.nivel_servicio)

    deterministico = {
        "punto_reorden": r_det,
        "formula": "r = d × m",
        "demanda_diaria": round(demanda_diaria, 4),
        "tiempo_entrega": req.tiempo_entrega,
        "descripcion": "Asume demanda constante y lead time fijo. Útil cuando la variabilidad es baja."
    }

    probabilistico = {
        "punto_reorden": r_prob,
        "stock_seguridad": ss,
        "z": round(z, 4),
        "formula": "r = d·m + z·σ·√m",
        "nivel_servicio": f"{req.nivel_servicio * 100:.0f}%",
        "descripcion": "Incluye un colchón de seguridad para cubrir la variabilidad de la demanda."
    }

    recomendado = "probabilístico"
    explanation = (
        f"El punto de reorden determinístico es {r_det} unidades (solo cubre la demanda promedio). "
        f"El punto de reorden probabilístico es {r_prob} unidades, que incluye {ss} unidades "
        f"de stock de seguridad para alcanzar un nivel de servicio del {req.nivel_servicio * 100:.0f}%. "
        f"Para una MIPYME se recomienda el método probabilístico porque protege contra la variabilidad real de la demanda."
    )

    return ReorderResponse(
        deterministico=deterministico,
        probabilistico=probabilistico,
        recomendado=recomendado,
        explanation=explanation
    )


# ─── STOCK DE SEGURIDAD ──────────────────────────────────────────────────────

def calcular_stock_seguridad_normal(
    desviacion_estandar: float,
    tiempo_entrega: int,
    nivel_servicio: float
) -> int:
    """SS = z × σ × √m — Distribución Normal.

    Se utiliza cuando la demanda es relativamente alta y simétrica
    (más de ~20 unidades diarias). Modela la variabilidad con la
    campana de Gauss.
    """
    if desviacion_estandar <= 0 or tiempo_entrega <= 0:
        return 0
    z = calcular_z(nivel_servicio)
    ss = z * desviacion_estandar * math.sqrt(tiempo_entrega)
    return max(0, int(round(ss)))


def calcular_stock_seguridad_poisson(
    demanda_diaria_promedio: float,
    tiempo_entrega: int,
    nivel_servicio: float
) -> int:
    """SS = z × √(λ × m) — Distribución de Poisson.

    Se utiliza cuando la demanda es discreta y baja (productos de
    rotación lenta, ~1-20 unidades diarias). La varianza es igual
    a la media (σ² = λ).
    """
    if demanda_diaria_promedio <= 0 or tiempo_entrega <= 0:
        return 0
    media_l = demanda_diaria_promedio * tiempo_entrega
    # Método exacto: buscar el menor SS donde P(demanda ≤ media + SS) ≥ nivel_servicio
    ss = 0
    while ss <= 500:
        prob = poisson.cdf(media_l + ss, media_l)
        if prob >= nivel_servicio:
            return int(ss)
        ss += 1
    return int(ss)


def calcular_safety_stock_completo(req: SafetyStockRequest) -> SafetyStockResponse:
    """Compara stock de seguridad con distribución Normal vs Poisson."""
    z = calcular_z(req.nivel_servicio)
    ss_normal = calcular_stock_seguridad_normal(
        req.desviacion_estandar, req.tiempo_entrega, req.nivel_servicio
    )
    ss_poisson = calcular_stock_seguridad_poisson(
        req.demanda_diaria_promedio, req.tiempo_entrega, req.nivel_servicio
    )

    # Recomendación basada en volumen de demanda
    if req.demanda_diaria_promedio < 20:
        recomendado = "poisson"
        recomendacion_uso = (
            "Con una demanda diaria promedio menor a 20 unidades, la distribución de Poisson "
            "es más apropiada porque modela eventos discretos de baja frecuencia."
        )
    else:
        recomendado = "normal"
        recomendacion_uso = (
            "Con una demanda diaria promedio de 20 o más unidades, la distribución Normal "
            "es más apropiada por el Teorema del Límite Central."
        )

    normal_dict = {
        "stock_seguridad": ss_normal,
        "formula": "SS = z × σ × √m",
        "z": round(z, 4),
        "sigma": req.desviacion_estandar,
        "lead_time": req.tiempo_entrega,
        "cuando_usar": "Demanda alta (≥ 20 uds/día), distribución simétrica."
    }

    poisson_dict = {
        "stock_seguridad": ss_poisson,
        "formula": "SS = z × √(λ × m)",
        "lambda": req.demanda_diaria_promedio,
        "lead_time": req.tiempo_entrega,
        "cuando_usar": "Demanda baja (< 20 uds/día), eventos discretos."
    }

    explanation = (
        f"Stock de seguridad Normal: {ss_normal} unidades (z={z:.4f}, σ={req.desviacion_estandar}). "
        f"Stock de seguridad Poisson: {ss_poisson} unidades (λ={req.demanda_diaria_promedio}). "
        f"Recomendación: usar {recomendado.capitalize()} para este producto."
    )

    return SafetyStockResponse(
        normal=normal_dict,
        poisson=poisson_dict,
        recomendado=recomendado,
        recomendacion_uso=recomendacion_uso,
        explanation=explanation
    )


# ─── DESCUENTOS POR VOLUMEN ──────────────────────────────────────────────────

def evaluar_descuentos_volumen(req: VolumeDiscountRequest) -> VolumeDiscountResponse:
    """Evalúa múltiples tramos de descuento para encontrar la cantidad óptima.

    Algoritmo:
    1. Ordenar tramos de menor a mayor precio (mayor a menor descuento)
    2. Para cada tramo, calcular el EOQ con ese precio
    3. Si Q* < cantidad mínima del tramo, ajustar Q = min_qty
    4. Calcular costo total anual para cada escenario
    5. Elegir el de menor costo total
    """
    tramos_sorted = sorted(req.tramos, key=lambda t: t.price, reverse=True)
    resultados: list[VolumeDiscountTierResult] = []
    mejor_costo = float('inf')
    tramo_optimo = 0

    for idx, tramo in enumerate(tramos_sorted):
        Ch = req.tasa_retencion * tramo.price
        eoq_raw = calcular_eoq(req.demanda_anual, req.costo_pedido, Ch)
        eoq = max(1, int(round(eoq_raw)))

        # Si EOQ < cantidad mínima del tramo, usar la cantidad mínima
        if eoq < tramo.min_qty and tramo.min_qty > 0:
            cantidad = tramo.min_qty
        else:
            cantidad = eoq

        # Verificar que la cantidad sea válida para este tramo
        # y que no supere la cantidad mínima del siguiente tramo más barato
        costo_pedido_anual = (req.demanda_anual / cantidad) * req.costo_pedido
        costo_almacenamiento = (cantidad / 2) * Ch
        costo_producto = req.demanda_anual * tramo.price
        costo_total = costo_pedido_anual + costo_almacenamiento + costo_producto

        es_optimo = False
        if costo_total < mejor_costo:
            mejor_costo = costo_total
            tramo_optimo = idx + 1
            es_optimo = True

        resultados.append(VolumeDiscountTierResult(
            tramo=idx + 1,
            min_qty=tramo.min_qty,
            precio_unitario=tramo.price,
            eoq_calculado=eoq,
            cantidad_a_pedir=cantidad,
            costo_pedido_anual=round(costo_pedido_anual, 2),
            costo_almacenamiento_anual=round(costo_almacenamiento, 2),
            costo_producto_anual=round(costo_producto, 2),
            costo_total_anual=round(costo_total, 2),
            es_optimo=False
        ))

    # Marcar el óptimo
    for r in resultados:
        if r.tramo == tramo_optimo:
            r.es_optimo = True

    optimo = next(r for r in resultados if r.es_optimo)
    ahorro = resultados[0].costo_total_anual - optimo.costo_total_anual if len(resultados) > 1 else 0

    explanation = (
        f"Después de evaluar {len(resultados)} tramos de descuento, el tramo óptimo "
        f"es el #{tramo_optimo} (precio ${optimo.precio_unitario}/ud, "
        f"pedido de {optimo.cantidad_a_pedir} unidades) con un costo total anual de "
        f"${optimo.costo_total_anual:,.2f}."
    )
    if ahorro > 0:
        explanation += f" Esto representa un ahorro de ${ahorro:,.2f} respecto al precio sin descuento."

    return VolumeDiscountResponse(
        tramos=resultados,
        tramo_optimo=tramo_optimo,
        explanation=explanation
    )


# ─── SIMULACIÓN DE VOLATILIDAD CAMBIARIA ────────────────────────────────────

def simular_volatilidad(req: CurrencySimulationRequest) -> CurrencySimulationResponse:
    """Simula el impacto de la volatilidad cambiaria en los costos de inventario.

    Para mercados emergentes, la fluctuación del tipo de cambio afecta directamente:
    - El costo unitario de productos importados
    - La cantidad óptima de pedido (EOQ)
    - El capital inmovilizado en inventario
    - El costo total anual de operación

    Fórmula: C_ajustado = C × (1 + variación/100)
    """
    escenarios: list[CurrencyScenario] = []
    escenario_base = None

    for variacion in req.variaciones:
        factor = 1 + (variacion / 100)
        tipo_cambio = round(req.tipo_cambio_actual * factor, 4)
        costo_ajustado = round(req.costo_unitario * factor, 4)

        Ch = req.tasa_retencion * costo_ajustado
        eoq_raw = calcular_eoq(req.demanda_anual, req.costo_pedido, Ch)
        eoq = max(1, int(round(eoq_raw)))

        ordering = (req.demanda_anual / eoq) * req.costo_pedido
        holding = (eoq / 2) * Ch
        costo_total = ordering + holding + (req.demanda_anual * costo_ajustado)
        capital_inmovilizado = (eoq / 2) * costo_ajustado

        escenario = CurrencyScenario(
            variacion_pct=variacion,
            tipo_cambio=tipo_cambio,
            costo_ajustado=round(costo_ajustado, 2),
            eoq=eoq,
            costo_total_anual=round(costo_total, 2),
            capital_inmovilizado=round(capital_inmovilizado, 2),
            diferencia_costo=0,
            diferencia_pct=0,
        )
        escenarios.append(escenario)

        if variacion == 0:
            escenario_base = escenario

    # Si no hay escenario base (variación 0%), usar el primero
    if escenario_base is None:
        escenario_base = escenarios[0]

    # Calcular diferencias respecto al escenario base
    for e in escenarios:
        e.diferencia_costo = round(e.costo_total_anual - escenario_base.costo_total_anual, 2)
        if escenario_base.costo_total_anual > 0:
            e.diferencia_pct = round(
                (e.costo_total_anual - escenario_base.costo_total_anual) / escenario_base.costo_total_anual * 100, 2
            )

    peor = max(escenarios, key=lambda e: e.costo_total_anual)
    explanation = (
        f"La simulación muestra cómo la volatilidad cambiaria afecta los costos del inventario. "
        f"En el escenario base (tipo de cambio {escenario_base.tipo_cambio}), el costo total anual "
        f"es ${escenario_base.costo_total_anual:,.2f} con un EOQ de {escenario_base.eoq} unidades. "
        f"En el peor escenario (+{peor.variacion_pct}%), el costo aumenta a "
        f"${peor.costo_total_anual:,.2f} ({peor.diferencia_pct:+.1f}%). "
        f"Esta herramienta permite a las MIPYMES anticipar el impacto de la devaluación "
        f"en su capital de trabajo y ajustar proactivamente sus políticas de compra."
    )

    return CurrencySimulationResponse(
        escenarios=escenarios,
        escenario_base=escenario_base,
        explanation=explanation
    )


# ─── COSTOS AUXILIARES ───────────────────────────────────────────────────────

def calcular_costo_total_anual(
    demanda_anual: float,
    eoq: float,
    costo_pedido: float,
    costo_unitario: float,
    tasa_mantenimiento: float
) -> float:
    """TC = (D/Q)·Co + (Q/2)·Ch + D·C — Costo total anual."""
    if eoq <= 0:
        return demanda_anual * costo_unitario
    H = costo_unitario * tasa_mantenimiento
    costo_ordenar = (demanda_anual / eoq) * costo_pedido
    costo_mantener = (eoq / 2) * H
    costo_producto = demanda_anual * costo_unitario
    return round(costo_ordenar + costo_mantener + costo_producto, 2)


def calcular_costo_almacenamiento(eoq: float, costo_unitario: float, tasa: float) -> float:
    """Costo anual de almacenamiento = (Q/2) × Ch."""
    return round((eoq / 2) * costo_unitario * tasa, 2)


def calcular_costo_pedido_total(demanda_anual: float, eoq: float, costo_pedido: float) -> float:
    """Costo anual de pedidos = (D/Q) × Co."""
    if eoq <= 0:
        return 0
    return round((demanda_anual / eoq) * costo_pedido, 2)


def calcular_costo_backorder(
    demanda_anual: float, eoq: float, stock_seguridad: int, penalizacion_faltante: float
) -> float:
    """Costo esperado de backorders por ciclo (simplificado)."""
    if eoq <= 0 or stock_seguridad <= 0:
        return 0.0
    num_ordenes = demanda_anual / eoq
    costo_por_orden = penalizacion_faltante * (stock_seguridad ** 2) / (2 * (eoq + stock_seguridad))
    return round(num_ordenes * costo_por_orden, 2)


def calcular_estado(stock_actual: int, punto_reorden: int) -> str:
    """Clasifica el estado de un producto según su stock vs punto de reorden."""
    if punto_reorden <= 0:
        return "Óptimo"
    if stock_actual <= punto_reorden * 0.5:
        return "Crítico"
    elif stock_actual <= punto_reorden:
        return "En Reorden"
    return "Óptimo"


# ─── PROCESAMIENTO DE PRODUCTOS ──────────────────────────────────────────────

def procesar_producto(producto: ProductoBase, config: Configuracion) -> ProductoResponse:
    """Procesa un producto individual con todos los cálculos del motor matemático."""
    demanda = producto.demanda_anual if producto.demanda_anual > 0 else config.demanda_anual_global
    H = producto.costo_unitario * config.holding_cost_rate

    eoq_raw = calcular_eoq(demanda, config.ordering_cost, H)
    eoq = max(1, int(round(eoq_raw)))

    demanda_diaria = demanda / config.dias_laborables

    ss_normal = calcular_stock_seguridad_normal(
        config.desviacion_estandar, producto.tiempo_entrega, config.service_level
    )
    ss_poisson = calcular_stock_seguridad_poisson(
        demanda_diaria, producto.tiempo_entrega, config.service_level
    )
    ss = max(ss_normal, ss_poisson)

    r_det = calcular_punto_reorden_deterministico(demanda_diaria, producto.tiempo_entrega)
    punto_reorden = r_det + ss

    total_cost = calcular_costo_total_anual(
        demanda, eoq, config.ordering_cost, producto.costo_unitario, config.holding_cost_rate
    )
    holding = calcular_costo_almacenamiento(eoq, producto.costo_unitario, config.holding_cost_rate)
    ordering = calcular_costo_pedido_total(demanda, eoq, config.ordering_cost)
    backorder = calcular_costo_backorder(demanda, eoq, ss, config.penalizacion_faltante)

    status = calcular_estado(producto.stock_actual, punto_reorden)

    num_pedidos = demanda / eoq if eoq > 0 else 0
    dias_entre = config.dias_laborables / num_pedidos if num_pedidos > 0 else 0

    explanation = (
        f"Pedir {eoq} unidades cada {dias_entre:.0f} días. "
        f"Reabastecer cuando el stock baje a {punto_reorden} unidades. "
        f"Mantener {ss} unidades de seguridad."
    )

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
        economic_order_quantity=eoq,
        reorder_point=punto_reorden,
        safety_stock=ss,
        safety_stock_normal=ss_normal,
        safety_stock_poisson=ss_poisson,
        total_annual_cost=total_cost,
        holding_cost=holding,
        ordering_cost_total=ordering,
        backorder_cost=backorder,
        discount_applied=False,
        discount_quantity=None,
        discount_price=None,
        status=status,
        explanation=explanation
    )


def procesar_inventario(
    productos: list[ProductoBase], config: Configuracion
) -> list[ProductoResponse]:
    """Procesa todo el inventario con el motor matemático."""
    return [procesar_producto(p, config) for p in productos]
