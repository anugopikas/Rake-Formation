# Rake Formation Decision Support System

This backend provides a scalable FastAPI foundation for AI-assisted rake formation planning with PostgreSQL and SQLAlchemy.

## Structure

- app/main.py: application entry point
- app/routers: domain-specific REST routers
- app/services: business logic for forecasting, optimization, and recommendations
- app/crud.py: database access layer
- app/models.py: SQLAlchemy ORM models
- app/schemas.py: Pydantic validation models

## Configuration

Set the PostgreSQL connection string in the environment file before running the service.
