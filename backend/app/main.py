from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app import models  # noqa: F401
from app.database import Base, engine

from app.routers.orders import router as orders_router
from app.routers.inventory import router as inventory_router
from app.routers.plants import router as plants_router
from app.routers.wagons import router as wagons_router
from app.routers.freight_rates import router as freight_rates_router
from app.routers.railway_rules import router as railway_rules_router
from app.routers.rake_plans import router as rake_plans_router
from app.routers.approvals import router as approvals_router
from app.routers.users import router as users_router
from app.routers.recommendations import router as recommendations_router

from app.utils.logger import logger

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError as exc:
    logger.warning(
        "Database initialization skipped because the database is unavailable: %s",
        exc,
    )

# FastAPI App
app = FastAPI(
    title="Rake Formation Decision Support System",
    version="1.0.0",
    description="AI-powered decision support backend for railway rake formation operations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root API
@app.get("/")
def root():
    return {
        "message": "Welcome to Rake Formation Decision Support System"
    }

# Health Check API
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "rake-formation"
    }

# Include Routers
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(plants_router)
app.include_router(wagons_router)
app.include_router(freight_rates_router)
app.include_router(railway_rules_router)
app.include_router(rake_plans_router)
app.include_router(approvals_router)
app.include_router(users_router)
app.include_router(recommendations_router)

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Database Error Handler
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    request: Request,
    exc: SQLAlchemyError
):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Database operation failed",
            "error": str(exc),
        },
    )