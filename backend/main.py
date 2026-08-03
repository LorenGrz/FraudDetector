from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from endpoints import anomalias_clientes, anomalias_transacciones, estadisticas, tipos_transacciones, cajeros, clientes, transacciones

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Transacciones bancarias")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CRUD
app.include_router(cajeros.router)
app.include_router(clientes.router)
app.include_router(transacciones.router)
app.include_router(tipos_transacciones.router)
# ML
app.include_router(anomalias_transacciones.router)
app.include_router(anomalias_clientes.router)
app.include_router(estadisticas.router)

# Serve frontend (present in Lambda image, absent in local dev)
_frontend = Path(__file__).parent / "frontend"
if _frontend.exists():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")
