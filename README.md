# StockOptima 📦⚙️

**StockOptima** es un motor y sistema de optimización de inventarios diseñado para funcionar de manera universal en cualquier tipo de comercio (ferreterías, farmacias, tiendas de ropa, minimarkets, etc.), sin importar el rubro. Su propósito principal es automatizar las decisiones financieras y logísticas del inventario, resolviendo mediante modelos matemáticos de investigación operativa el dilema clásico de **cuánto** y **cuándo** reabastecer para minimizar los costos totales de almacenamiento y gestión.

---

## 🚀 Características Principales

* **Agnóstico al Producto:** Se adapta a cualquier catálogo de productos de manera universal utilizando campos estándar como SKU, costo unitario, stock actual y tiempo de entrega del proveedor.
* **Núcleo Matemático de Investigación Operativa:** Automatiza el cálculo de la Cantidad Económica de Pedido ($Q^*$), el punto de reorden ($r$) y evalúa escenarios complejos como faltantes planeados (*backorders*) y descuentos por volumen.
* **Modelado Estocástico y de Demanda:** Estima la demanda esperada y calcula de forma dinámica los stocks de seguridad basándose en niveles de servicio objetivo (probabilidades de no quiebre de stock).
* **Reportes Operativos Claros:** Traduce fórmulas matemáticas complejas en alertas visuales de reabastecimiento y métricas de control de inventario listas para el comerciante.

---

## 🛠️ Arquitectura y División del Trabajo

El proyecto está estructurado para ser desarrollado eficientemente entre **dos integrantes**:

### Integrante 1: Backend, Lógica Matemática y Motor de Inventarios
* **Fase 1 (Configuración e Importación):** Estructura de datos genérica para los productos y lector/validador de archivos de inventario (CSV/Excel).
* **Fase 2 (El Cerebro Matemático):** Programación de las fórmulas analíticas de Investigación Operativa ($Q^*$, $r$, costos totales, faltantes planeados y descuentos por volumen).
* **Fase 3 (Pronóstico de Demanda):** Algoritmos de cálculo de demanda esperada y stock de seguridad probabilístico.

### Integrante 2: Interfaz, Reportes y Gestión de Datos
* **Fase 1 (Almacenamiento):** Configuración de la base de datos (SQLite o PostgreSQL) para guardar los parámetros globales y el catálogo.
* **Fase 4 (Panel de Control y Reportes):** Desarrollo de la interfaz de usuario para la carga de datos y visualización del inventario.
* **Fase 4 (Sistema de Alertas y Métricas):** Generación de reportes de productos críticos en punto de reorden, cantidades exactas de pedido y cálculo del capital inmovilizado.

---

## ⚙️ Requisitos Técnicos

* **Python 3.10+**
* Librerías recomendadas: `NumPy`, `SciPy`, `Pandas`, `FastAPI` (para la capa de servicios opcional).

- **Node 20+**

---

## 📌 Contribución y Uso Académico

Este proyecto surge como una herramienta práctica para llevar los modelos cuantitativos de los libros de texto y la investigación operativa directamente a entornos comerciales reales y accesibles.

```

```
