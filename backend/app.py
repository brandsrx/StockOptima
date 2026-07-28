"""
StockOptima — Punto de entrada de la API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import router

app = FastAPI(
    title="StockOptima API",
    description="Sistema Inteligente de Optimización de Inventarios y Precios para Mercados Emergentes",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def read_root():
    return {
        "app": "StockOptima API",
        "version": "2.0.0",
        "description": "Motor de Optimización de Inventarios para MIPYMES",
        "docs": "/docs"
    }
