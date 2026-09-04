# Contexto del proyecto

**FraudDetector**: detección de anomalías en transacciones bancarias, API
REST (Python/FastAPI) + dashboard web (HTML/CSS/JS con Bootstrap y Plotly).
No hay dataset etiquetado de "fraude confirmado" real → el enfoque es **ML no
supervisado**: tres modelos en paralelo detectan comportamientos alejados de
la norma sin depender de etiquetas previas.

## Cómo decide qué es sospechoso

- **Clientes** (`endpoints/anomalias_clientes.py`): Isolation Forest
  (contamination 5%) + LOF (20 vecinos) + K-Means (percentil 95 de distancia
  al centroide). Un cliente se marca sospechoso solo si **≥ 2 de los 3**
  modelos coinciden, más reglas de negocio (monto máximo > 5× el promedio del
  cliente, transacciones en menos de 60s entre sí).
- **Transacciones individuales** (`anomalias_transacciones.py`): Isolation
  Forest + LOF con score combinado 50/50.
- Los gráficos (`/anomalias/graficos/*`) devuelven HTML con Plotly que el
  frontend inyecta directo en el DOM.

## Stack

- Backend: FastAPI + SQLAlchemy (ORM) + SQLite + scikit-learn.
- Frontend: HTML/CSS/JS vanilla (sin framework), Bootstrap + Plotly.
- Dataset fuente: Wisabi Bank Dataset (Kaggle) — transacciones de un banco
  nigeriano. `procesar_datos.py` limpia los CSVs originales,
  `cargar_csvs.py` los carga a SQLite.
- Deploy: AWS Lambda vía imagen de contenedor (Mangum + FastAPI + SQLite +
  archivos estáticos servidos desde el mismo Lambda). Frontend también se
  publica en GitHub Pages.

## Última revisión

2026-09-04 — primera vez que se documenta en CLAUDE.md. De paso se agregó
`.aws-sam/` y `.vscode/` al `.gitignore` (quedaban sueltos en cada build de
SAM / apertura del editor).
