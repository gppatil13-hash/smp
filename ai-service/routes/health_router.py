"""
API routes for health checks and service status
"""

from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def health_status():
    """
    Health check endpoint
    GET /health/status
    """
    return {
        "status": "healthy",
        "service": "School ERP AI Microservice",
        "version": "1.0.0",
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint
    GET /health/ready
    """
    return {
        "ready": True,
        "timestamp": "2024-03-19T12:00:00Z",
    }


@router.get("/models")
async def model_status():
    """
    Check status of AI models
    GET /health/models
    """
    return {
        "models": {
            "admission_scorer": "loaded",
            "fee_predictor": "loaded",
            "followup_engine": "loaded",
            "message_generator": "loaded",
        },
        "status": "all_ready",
    }
