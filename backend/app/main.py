from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api import commits, branches, scan, metrics, agents, settings, cli
import structlog
import traceback

# OpenTelemetry imports
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

logger = structlog.get_logger()

app = FastAPI(title="CognitionVCS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler (Fix Issue 3)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), traceback=traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal Server Error", "details": str(exc)},
    )

app.include_router(commits.router, prefix="/commits", tags=["commits"])
app.include_router(branches.router, prefix="/branches", tags=["branches"])
app.include_router(scan.router, prefix="/scan", tags=["scan"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(cli.router, prefix="/cli", tags=["cli"])

# Instrument FastAPI with OpenTelemetry (Fix Issue 6)
FastAPIInstrumentor.instrument_app(app)

@app.get("/")
def read_root():
    logger.info("root_accessed", endpoint="/")
    return {"status": "ok", "message": "Welcome to CognitionVCS API"}
