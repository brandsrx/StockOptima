import pandas as pd
import numpy as np
from scipy.stats import norm

def calcular_eoq_basico(df: pd.DataFrame, demanda_anual: float, costo_pedido: float, tasa_mantenimiento: float) -> pd.DataFrame:
    """
    Calcula la Cantidad Económica de Pedido (Q*), Stock de Seguridad (SS) y Punto de Reorden (r).
    """
    resultados = df.copy()
    
    # --- NUEVOS PARÁMETROS ESTADÍSTICOS SIMULADOS ---
    # En la vida real, sacarás esto del histórico de ventas
    desviacion_estandar_demanda_diaria = 2.5 
    nivel_servicio = 0.95 # Queremos un 95% de probabilidad de NO quebrar stock
    
    # Calculamos el valor Z automáticamente usando SciPy
    z = norm.ppf(nivel_servicio) 
    
    # 1. Costo de mantenimiento (H)
    resultados['costo_mantenimiento'] = resultados['costo_unitario'] * tasa_mantenimiento
    
    # 2. Cantidad Económica de Pedido (Q*)
    resultados['cantidad_optima_pedido'] = np.sqrt(
        (2 * demanda_anual * costo_pedido) / resultados['costo_mantenimiento']
    ).round().astype(int)
    
    # 3. Stock de Seguridad (SS)
    # Fórmula: Z * Desviación_Estándar * Raíz(Tiempo_de_Entrega)
    resultados['stock_seguridad'] = (
        z * desviacion_estandar_demanda_diaria * np.sqrt(resultados['tiempo_entrega'])
    ).round().astype(int)
    
    # 4. Punto de Reorden Dinámico (r)
    # r = (Demanda esperada durante la entrega) + Stock de Seguridad
    demanda_diaria = demanda_anual / 365
    resultados['punto_reorden'] = (
        (demanda_diaria * resultados['tiempo_entrega']) + resultados['stock_seguridad']
    ).round().astype(int)
    
    # 5. Alerta visual de reabastecimiento
    resultados['alerta_reabastecer'] = resultados['stock_actual'] <= resultados['punto_reorden']
    
    return resultados