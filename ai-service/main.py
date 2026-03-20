"""
School ERP AI Microservice
FastAPI-based machine learning service for admission prediction, 
fee default prediction, and smart communications
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routers
from routes import (
    admission_router,
    fee_router,
    followup_router,
    communication_router,
    health_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    logger.info("School ERP AI Microservice starting...")
    yield
    # Shutdown
    logger.info("School ERP AI Microservice shutting down...")


# Create FastAPI app
app = FastAPI(
    title="School ERP AI Microservice",
    description="Machine Learning APIs for School ERP System",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router.router, prefix="/health", tags=["health"])
app.include_router(admission_router.router, prefix="/api/ai/admission", tags=["admission"])
app.include_router(fee_router.router, prefix="/api/ai/fees", tags=["fees"])
app.include_router(followup_router.router, prefix="/api/ai/followup", tags=["followup"])
app.include_router(communication_router.router, prefix="/api/ai/communication", tags=["communication"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "School ERP AI Microservice",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENV", "development") == "development",
    )
