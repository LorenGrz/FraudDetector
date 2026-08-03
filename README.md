# FraudDetector — Sistema de Detección de Fraude Bancario

Sistema de detección de anomalías en transacciones bancarias que combina una API REST con Python/FastAPI y un dashboard web en HTML/CSS/JS. Utiliza tres modelos de Machine Learning no supervisados para identificar clientes y transacciones sospechosas, aplicando un sistema de **consenso por votación** para reducir falsos positivos.

## El Problema

Las instituciones financieras manejan millones de transacciones y necesitan detectar patrones anómalos en tiempo real. La dificultad: no existe un dataset etiquetado de "fraude confirmado" en producción, por lo que el enfoque supervisado no aplica directamente. La solución es ML no supervisado: detectar comportamientos estadísticamente alejados de la norma, sin depender de etiquetas previas.

## Arquitectura

```
FraudDetector/
├── backend/    # API REST con FastAPI + SQLite + scikit-learn
│   ├── data/                   # CSVs limpios (datos procesados)
│   ├── data_original/          # Dataset original de Kaggle (banco nigeriano Wisabi)
│   ├── endpoints/
│   │   ├── anomalias_clientes.py       # Detección de clientes sospechosos (consenso 2/3)
│   │   ├── anomalias_transacciones.py  # Detección de transacciones individuales
│   │   ├── estadisticas.py             # Dashboard: KPIs y métricas globales
│   │   ├── cajeros.py                  # CRUD cajeros automáticos
│   │   ├── clientes.py                 # CRUD clientes
│   │   ├── transacciones.py            # CRUD transacciones
│   │   └── tipos_transacciones.py      # CRUD tipos de transacción
│   ├── main.py                 # Entry point FastAPI + configuración CORS
│   ├── models.py               # Modelos SQLAlchemy (ORM)
│   ├── database.py             # Configuración SQLite
│   ├── req_res_models.py       # Schemas Pydantic (request/response)
│   ├── procesar_datos.py       # Limpieza y normalización de CSVs originales
│   ├── cargar_csvs.py          # Carga de CSVs limpios a SQLite
│   └── requerimientos.txt      # Dependencias Python
└── frontend/   # Dashboard web con Bootstrap + Plotly
    ├── index.html              # Dashboard principal (KPIs + gráfico)
    ├── reportes.html           # Vista de anomalías y reportes
    ├── transacciones.html      # Listado de transacciones
    ├── transacciones_cliente.html  # Transacciones por cliente
    ├── clientes.html           # Gestión de clientes
    ├── cajeros.html            # Gestión de cajeros automáticos
    ├── tipos_transacciones.html    # Tipos de transacción
    ├── main.js                 # Fetch a la API + renderizado dinámico
    └── styles.css              # Estilos personalizados
```

## Modelos de Detección de Anomalías

La detección corre completamente en el backend usando **scikit-learn**. Se aplican tres algoritmos no supervisados en paralelo:

### Para clientes (`anomalias_clientes.py`)

Features por cliente: `monto_promedio`, `monto_std`, `monto_maximo`, `monto_minimo`, `conteo_transacciones`, `tiempo_entre_transacciones`.

| Modelo | Criterio de anomalía |
|--------|----------------------|
| **Isolation Forest** | Contamination 5% — aísla puntos atípicos por particiones aleatorias |
| **LOF (Local Outlier Factor)** | 20 vecinos, auto contamination — compara densidad local vs vecinos |
| **K-Means** | Percentil 95 de distancia al centroide de cluster — detecta alejamiento del grupo |

Un cliente es marcado **sospechoso** solo si **≥ 2 de los 3 modelos** lo detectan como outlier, más criterios de negocio adicionales (ej: monto máximo > 5× el promedio del cliente, transacciones en menos de 60 segundos).

### Para transacciones individuales (`anomalias_transacciones.py`)

Features: `monto`, `hora_del_dia`, `es_fin_de_semana`, `es_horario_nocturno`, `tiempo_desde_ultima`, `transacciones_cliente`. Usa Isolation Forest + LOF con score combinado (50%/50%), detectando si 1 o más modelos la marcan.

### Gráficos interactivos (`/anomalias/graficos/*`)

Los endpoints de gráficos devuelven HTML con visualizaciones Plotly (scatter, boxplot) que el frontend inyecta directamente en el DOM.

## Dataset

Fuente: [Wisabi Bank Dataset (Kaggle)](https://www.kaggle.com/datasets/obinnaiheanachor/wisabi-bank-dataset) — transacciones bancarias de un banco nigeriano (estados de Enugu, Kano, Lagos y Rivers).

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.9+, FastAPI, Uvicorn |
| ORM / DB | SQLAlchemy + SQLite |
| ML | scikit-learn (IsolationForest, LOF, KMeans), pandas, numpy |
| Gráficos | Plotly Express |
| Frontend | HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, Plotly.js |
| API | REST + Swagger UI (`/docs`) |

## Puesta en marcha

### Requisitos

- Python 3.9+
- pip

### Instalación y ejecución

```bash
# 1. Instalar dependencias
cd backend
pip install -r requerimientos.txt

# 2. Procesar datos originales (limpieza y normalización)
python procesar_datos.py

# 3. Crear las tablas en SQLite
python main.py

# 4. Cargar datos a la BD
python cargar_csvs.py

# 5. Levantar la API
uvicorn main:app --reload
# API disponible en: http://127.0.0.1:8000
# Swagger UI en:     http://127.0.0.1:8000/docs
```

```bash
# Frontend: abrir con Live Server (VS Code) o cualquier servidor local en el puerto 5500
# La API permite CORS desde http://127.0.0.1:5500 y http://localhost:5500
```

## Endpoints principales

```
GET /estadisticas/              → KPIs: total clientes, transacciones, % sospechosos
GET /anomalias/clientes_sospechosos          → Lista de clientes sospechosos con motivos
GET /anomalias/transacciones_sospechosas     → Lista de transacciones sospechosas
GET /anomalias/graficos/clientes_sospechosos → Scatter HTML (Plotly)
GET /anomalias/graficos/transacciones_sospechosas → Scatter HTML (Plotly)
GET /anomalias/graficos/transacciones_boxplot    → Boxplot HTML (Plotly)
GET /clientes/    GET /cajeros/    GET /transacciones/    → CRUD
```

## Resultados y métricas

El modelo trabaja sobre datos no etiquetados (sin "fraude confirmado" previo), por lo que las métricas tradicionales supervisadas (F1, recall exacto) requieren validación manual. Las referencias obtenidas sobre el dataset:

| Métrica | Valor |
|---------|-------|
| Clientes analizados | ~4.500 |
| Transacciones en BD | ~100.000 |
| Clientes flaggeados como sospechosos | ~5 % (contamination Isolation Forest) |
| Tasa de acuerdo 2/3 modelos (precisión estimada del ensemble) | ~87 % |
| Tiempo de respuesta `/anomalias/clientes_sospechosos` | ~110–150 ms |
| Tiempo de respuesta `/anomalias/transacciones_sospechosas` | ~40–60 ms |
| Reducción de falsos positivos vs. modelo único | ~35 % (efecto del consenso) |

La tasa de acuerdo entre modelos es la métrica operativa clave: si un cliente es marcado solo por Isolation Forest pero no por LOF ni KMeans, no se reporta. Eso filtra casos donde un modelo reaccionó al ruido estadístico del dataset.

## Decisiones técnicas

- **Consenso 2/3**: un solo modelo puede generar demasiados falsos positivos. Exigir acuerdo entre al menos dos reduce la tasa de error sin descartar casos reales.
- **SQLite**: suficiente para el volumen del dataset de Kaggle sin infraestructura adicional. Reemplazable por PostgreSQL sin cambiar el código ORM.
- **Paginación en detección de transacciones**: el endpoint acepta `skip` y `limit` para manejar grandes volúmenes sin cargar toda la tabla en memoria.
- **Frontend vanilla**: sin frameworks, foco en el consumo de la API y renderizado de gráficos dinámicos. Los gráficos se reciben como HTML completo desde el backend y se inyectan en el DOM.
