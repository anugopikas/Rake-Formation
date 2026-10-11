# Rake Formation Decision Support System

This project is a full-stack railway logistics and planning application built to support rake formation decisions. It helps teams manage customer orders, inventory, plant locations, wagon availability, freight rates, railway rules, and approved plan generation in a single operational dashboard.

The system combines a Python backend with a React frontend and includes rule-driven recommendation logic and analytics for operational planning.

## What this project does

The application is designed to help railway operations teams:

- Track and manage incoming orders
- Monitor inventory and material availability by plant
- Manage plants, wagons, and route freight rates
- Validate railway rules and operational constraints
- Recommend the best plant and wagon allocation for an order
- Generate rake plans and approval records
- View operational KPIs and dashboards for planning decisions

In practical terms, this project acts like a decision support platform for scheduling and evaluating rail freight movements.

## Core features

- Order management for customer demand and delivery planning
- Inventory and plant capacity tracking
- Wagon capacity and availability monitoring
- Freight rate and route analysis
- Railway rule enforcement for route feasibility
- AI-style recommendation engine for order-to-plant allocation
- Rake plan generation with assignment tracking
- Approval workflow for planners and approvers
- Analytics dashboard with KPI summaries, demand forecasting, operational alerts, and utilization charts
- Role-based web interface for planner/approver workflows

## Tech stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic

### Frontend
- React
- Vite
- React Router
- Recharts
- Tailwind CSS

## Project structure

```text
Rake-Formation/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env
│   ├── README.md
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── database/
├── datasets/
├── docs/
├── ml/
├── optimization/
├── .gitignore
├── .venv/
└── README.md
```

## Main backend modules

- `backend/app/main.py` - FastAPI application entry point
- `backend/app/models.py` - SQLAlchemy ORM models
- `backend/app/schemas.py` - Pydantic request/response schemas
- `backend/app/routers/` - API endpoint modules for orders, plants, wagons, plans, approvals, analytics, and recommendations
- `backend/app/ai/` - recommendation and optimization logic for allocation decisions
- `backend/app/services/` - planning and recommendation service layer

## Main frontend modules

The frontend is a dashboard-based application with pages for:

- Dashboard
- Orders
- Inventory
- Plants
- Wagons
- Rake Plans
- Recommendations
- Railway Rules
- Freight Rates
- Approvals
- Settings
- Login / Register / Forgot Password

This gives end users a visual way to work with the operational data and planning logic without directly calling APIs.

## How the system works

The platform follows a typical decision-support flow:

1. Orders are added to the system.
2. Inventory, plant capacity, and wagon availability are checked.
3. Freight and route rules are validated.
4. The AI/optimizer recommends the most suitable plant and capacity allocation.
5. A rake plan is created and assigned to the order.
6. Approvals and dashboard KPIs track the final operational outcome.

## Requirements

Before running the project, make sure you have:

- Python 3.11 or 3.12 (Python 3.12 is recommended for the pinned backend dependencies)
- Node.js 20.19+ or 22.12+ (required by the installed Vite version)
- PostgreSQL database server
- npm

## Setup

### 1. Clone the project

```bash
git clone <repository-url>
cd "RAKE FORMATION"
```

### 2. Install backend dependencies and configure PostgreSQL

From the project root, create the backend environment and install its packages:

```powershell
py -3.12 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

If `backend\.venv` was created with an unsupported Python version, remove and recreate that generated environment from the project root:

```powershell
Remove-Item -LiteralPath .\backend\.venv -Recurse -Force
py -3.12 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Create the local environment file and edit it with your PostgreSQL credentials:

```powershell
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
notepad backend\.env
```

Set `DATABASE_URL` in `backend/.env` to a PostgreSQL URL:

```text
postgresql+psycopg://<username>:<password>@localhost:5432/rake_formation
```

Start PostgreSQL and create the `rake_formation` database if it does not already exist. The backend creates its application tables when it starts, but it does not create the PostgreSQL database itself.

### 3. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

### 4. Start the full application with one command

From the project root, run:

```powershell
.\start.ps1
```

If PowerShell blocks local scripts, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

The script opens separate backend and frontend PowerShell windows. Keep both open while using the application; close each window to stop its service.

The frontend is at http://localhost:5173. The backend is at http://127.0.0.1:8000, with interactive API docs at http://127.0.0.1:8000/docs. The frontend API URL defaults to `http://127.0.0.1:8000`; override it by setting `VITE_API_BASE_URL` in a frontend `.env.local` file.

Vite is pinned to port 5173 so its origin matches the backend's local CORS allowlist. If that port is already in use, stop the conflicting process rather than allowing Vite to move to another port.

## Example API usage

The backend exposes routes such as:

- `GET /health`
- `GET /orders/`
- `POST /orders/`
- `PATCH /orders/{order_id}` and `DELETE /orders/{order_id}`
- `GET /plants/`
- `GET /wagons/`
- `POST /recommendations/`
- `POST /rake-plans/generate` - generate and persist a plan using selected orders
- `GET /rake-plans/{plan_id}` and `GET /rake-plans/{plan_id}/kpis`
- `POST /approvals/` and `PATCH /approvals/{approval_id}`
- `GET /forecast/demand` - order-volume forecast grouped by delivery date
- `GET /alerts/` - inventory, rake-capacity, and order-fulfillment alerts
- `GET /analytics/kpis`
- `GET /analytics/rake-plans/timeseries`

These endpoints power the frontend dashboard and planning flows.

The Orders page supports create, view, edit, and confirmed delete actions. Plants,
wagons, inventory, freight rates, and railway rules can be created from their
respective pages. Recommendation generation uses a selected order, while rake
plan generation and optimization call the backend planner and save its results.
Approval decisions are persisted through the approvals API.

## Useful notes

- The backend uses PostgreSQL and initializes application tables automatically when the database is reachable.
- The frontend is built for an operational dashboard experience and includes role-based navigation.
- The recommendation and optimization logic uses route, plant, inventory, and wagon constraints to evaluate whether an order can be approved.

## Future extension ideas

- Add real authentication and user roles in the backend
- Integrate a true optimization engine or linear programming solver
- Add CSV import/export for orders and inventory
- Add reporting and PDF/Excel export
- Add notifications for approval and rule violations
- Expand analytics with forecasting and predicted demand

## License

This project is currently for internal operational planning and decision support use.
