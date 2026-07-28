"""
StockOptima — Módulo de Pronóstico de Demanda (forecasting.py)

Implementa métodos clásicos de pronóstico de series de tiempo
utilizados en Investigación Operativa II.

Métodos implementados:
  - Promedio Móvil Simple (3 y 6 períodos)
  - Suavización Exponencial Simple con búsqueda óptima de α

Métricas de error:
  - MAE (Mean Absolute Error)
  - RMSE (Root Mean Square Error)
"""

import math
import numpy as np
from schemas import ForecastRequest, ForecastResponse, ForecastMethodResult


def calcular_mae(reales: list[float], pronosticos: list[float]) -> float:
    """MAE = (1/n) × Σ|D(t) - F(t)|

    Error Absoluto Medio: promedio de las diferencias absolutas entre
    la demanda real y el pronóstico. Unidades iguales a la demanda.
    """
    if len(reales) == 0 or len(reales) != len(pronosticos):
        return 0.0
    errores = [abs(r - p) for r, p in zip(reales, pronosticos)]
    return round(sum(errores) / len(errores), 4)


def calcular_rmse(reales: list[float], pronosticos: list[float]) -> float:
    """RMSE = √((1/n) × Σ(D(t) - F(t))²)

    Raíz del Error Cuadrático Medio: penaliza más los errores grandes.
    Útil para identificar modelos que tienen picos de error.
    """
    if len(reales) == 0 or len(reales) != len(pronosticos):
        return 0.0
    errores_cuad = [(r - p) ** 2 for r, p in zip(reales, pronosticos)]
    return round(math.sqrt(sum(errores_cuad) / len(errores_cuad)), 4)


def promedio_movil(ventas: list[float], ventana: int) -> ForecastMethodResult:
    """Promedio Móvil Simple.

    F(t+1) = (1/k) × Σ D(t-i) para i = 0..k-1

    El pronóstico del siguiente período es el promedio de los últimos
    k períodos observados. Es simple y útil cuando la demanda no tiene
    tendencia marcada.

    Parámetros:
        ventas: Lista de ventas históricas
        ventana: Número de períodos a promediar (k)
    """
    if len(ventas) < ventana:
        # No hay suficientes datos, pronosticar con lo que hay
        promedio = sum(ventas) / len(ventas) if ventas else 0
        return ForecastMethodResult(
            nombre=f"Promedio Móvil ({ventana} períodos)",
            pronostico_siguiente=round(promedio, 2),
            serie_pronostico=[round(promedio, 2)] * len(ventas),
            mae=0,
            rmse=0,
            parametros={"ventana": ventana, "datos_insuficientes": True}
        )

    serie_pronostico: list[float] = []
    reales_para_error: list[float] = []
    pronosticos_para_error: list[float] = []

    for i in range(len(ventas)):
        if i < ventana:
            serie_pronostico.append(None)  # type: ignore
        else:
            prom = sum(ventas[i - ventana:i]) / ventana
            serie_pronostico.append(round(prom, 2))
            reales_para_error.append(ventas[i])
            pronosticos_para_error.append(prom)

    # Pronóstico del siguiente período
    pronostico_siguiente = round(sum(ventas[-ventana:]) / ventana, 2)

    mae = calcular_mae(reales_para_error, pronosticos_para_error)
    rmse = calcular_rmse(reales_para_error, pronosticos_para_error)

    return ForecastMethodResult(
        nombre=f"Promedio Móvil ({ventana} períodos)",
        pronostico_siguiente=pronostico_siguiente,
        serie_pronostico=serie_pronostico,
        mae=mae,
        rmse=rmse,
        parametros={"ventana": ventana}
    )


def suavizacion_exponencial(
    ventas: list[float], alpha: float
) -> ForecastMethodResult:
    """Suavización Exponencial Simple.

    F(t+1) = α × D(t) + (1-α) × F(t)

    Cada pronóstico es una combinación ponderada del último dato real
    y el pronóstico anterior. Alpha (α) controla qué tanto peso se le
    da al dato más reciente:
      - α alto (→ 1): responde rápido a cambios
      - α bajo (→ 0): suaviza más, más estable

    Parámetros:
        ventas: Lista de ventas históricas
        alpha: Factor de suavización (0 < α < 1)
    """
    if not ventas:
        return ForecastMethodResult(
            nombre=f"Suavización Exponencial (α={alpha})",
            pronostico_siguiente=0,
            serie_pronostico=[],
            mae=0,
            rmse=0,
            parametros={"alpha": alpha}
        )

    serie_pronostico: list[float] = []
    forecast = float(ventas[0])
    serie_pronostico.append(round(forecast, 2))

    reales_para_error: list[float] = []
    pronosticos_para_error: list[float] = []

    for i in range(1, len(ventas)):
        reales_para_error.append(ventas[i])
        pronosticos_para_error.append(forecast)
        forecast = alpha * ventas[i] + (1 - alpha) * forecast
        serie_pronostico.append(round(forecast, 2))

    # Pronóstico del siguiente período
    pronostico_siguiente = round(
        alpha * ventas[-1] + (1 - alpha) * forecast, 2
    )

    mae = calcular_mae(reales_para_error, pronosticos_para_error)
    rmse = calcular_rmse(reales_para_error, pronosticos_para_error)

    return ForecastMethodResult(
        nombre=f"Suavización Exponencial (α={alpha:.2f})",
        pronostico_siguiente=pronostico_siguiente,
        serie_pronostico=serie_pronostico,
        mae=mae,
        rmse=rmse,
        parametros={"alpha": alpha}
    )


def encontrar_alpha_optimo(ventas: list[float]) -> float:
    """Busca el valor óptimo de α que minimiza el MAE.

    Realiza un grid search sobre α ∈ [0.01, 0.99] con paso 0.01
    y selecciona el que produce el menor MAE en los datos históricos.

    Retorna:
        alpha_optimo (float)
    """
    if len(ventas) < 3:
        return 0.3  # Default razonable

    mejor_alpha = 0.3
    mejor_mae = float('inf')

    for alpha_int in range(1, 100):
        alpha = alpha_int / 100.0
        result = suavizacion_exponencial(ventas, alpha)
        if result.mae < mejor_mae:
            mejor_mae = result.mae
            mejor_alpha = alpha

    return round(mejor_alpha, 2)


def pronosticar(req: ForecastRequest) -> ForecastResponse:
    """Ejecuta todos los métodos de pronóstico y selecciona el mejor.

    Flujo:
    1. Calcula promedio móvil de 3 y 6 períodos
    2. Si α no es especificado, busca el óptimo automáticamente
    3. Calcula suavización exponencial con α
    4. Compara MAE de todos los métodos
    5. Selecciona el de menor error

    Retorna:
        ForecastResponse con todos los resultados y el mejor método
    """
    ventas = req.ventas_historicas
    metodos: list[ForecastMethodResult] = []

    # Promedio Móvil 3 períodos
    pm3 = promedio_movil(ventas, 3)
    metodos.append(pm3)

    # Promedio Móvil 6 períodos (solo si hay datos suficientes)
    if len(ventas) >= 6:
        pm6 = promedio_movil(ventas, 6)
        metodos.append(pm6)

    # Suavización Exponencial
    alpha = req.alpha
    if alpha is None:
        alpha = encontrar_alpha_optimo(ventas)

    se = suavizacion_exponencial(ventas, alpha)
    metodos.append(se)

    # Seleccionar el mejor método (menor MAE entre los que tienen métricas válidas)
    metodos_validos = [m for m in metodos if m.mae > 0]
    if metodos_validos:
        mejor = min(metodos_validos, key=lambda m: m.mae)
    else:
        mejor = metodos[0]

    explanation = (
        f"Se evaluaron {len(metodos)} métodos de pronóstico. "
        f"El mejor es '{mejor.nombre}' con un MAE de {mejor.mae:.2f} "
        f"y un RMSE de {mejor.rmse:.2f}. "
        f"El pronóstico para el siguiente período es {mejor.pronostico_siguiente:.2f} unidades. "
    )
    if alpha == req.alpha:
        explanation += f"Se usó α={alpha} según lo especificado. "
    else:
        explanation += (
            f"El valor óptimo de α encontrado automáticamente es {alpha}, "
            f"que minimiza el error absoluto medio sobre los datos históricos. "
        )

    return ForecastResponse(
        historico=ventas,
        metodos=metodos,
        mejor_metodo=mejor.nombre,
        mejor_pronostico=mejor.pronostico_siguiente,
        mejor_mae=mejor.mae,
        mejor_rmse=mejor.rmse,
        explanation=explanation
    )
