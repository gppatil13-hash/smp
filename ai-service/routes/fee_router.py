"""
Fee default prediction API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from models.fee_predictor import fee_predictor

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class FeeDefaultPredictionRequest(BaseModel):
    """Request model for fee default prediction"""
    student_id: str
    class_level: int  # 1-12
    days_overdue: int = 0
    outstanding_amount: float
    total_expected_fees: float
    payment_history: List[str] = []  # ["on_time", "late_1_30", "late_30_60", "default"]
    parent_communication_score: float = 0.5  # 0-1
    previous_arrears_count: int = 0
    admission_method: str = "paying"  # merit, scholarship, paying
    parent_occupation: str = "other"  # business, service, education, other


class FeeDefaultPredictionResponse(BaseModel):
    """Response model for fee default prediction"""
    student_id: str
    default_risk_probability: float
    confidence_score: float
    risk_level: str
    reason_for_risk: str
    risk_factors: List[str]
    intervention_type: str
    suggested_action: str
    expected_recovery_days: int


@router.post("/predict-default", response_model=FeeDefaultPredictionResponse)
async def predict_fee_default(request: FeeDefaultPredictionRequest):
    """
    Predict likelihood of fee default
    
    POST /api/ai/fees/predict-default
    
    Args:
        request: FeeDefaultPredictionRequest with student fee info
    
    Returns:
        FeeDefaultPredictionResponse with prediction and interventions
    """
    try:
        logger.info(f"Predicting default risk for student: {request.student_id}")
        
        # Prepare data
        student_data = request.dict()
        
        # Get prediction
        result = fee_predictor.predict_default_risk(student_data)
        
        # Validate result
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return FeeDefaultPredictionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error predicting fee default: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-predict-defaults")
async def batch_predict_defaults(requests: List[FeeDefaultPredictionRequest]):
    """
    Predict default risk for multiple students
    
    POST /api/ai/fees/batch-predict-defaults
    
    Args:
        requests: List of FeeDefaultPredictionRequest
    
    Returns:
        List of predictions and analytics
    """
    try:
        logger.info(f"Batch predicting default risk for {len(requests)} students")
        
        results = []
        critical_count = 0
        high_count = 0
        
        for req in requests:
            student_data = req.dict()
            result = fee_predictor.predict_default_risk(student_data)
            results.append(result)
            
            # Count risk levels
            risk_level = result.get("risk_level")
            if risk_level == "critical":
                critical_count += 1
            elif risk_level == "high":
                high_count += 1
        
        return {
            "total_students": len(requests),
            "predictions": results,
            "summary": {
                "critical_risk": critical_count,
                "high_risk": high_count,
                "average_risk_score": sum(r.get("default_risk_probability", 0) for r in results) / len(results) if results else 0,
            },
        }
    
    except Exception as e:
        logger.error(f"Error in batch default prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/identify-defaulters")
async def identify_critical_defaulters(days_overdue_threshold: int = 30):
    """
    Identify students at risk of defaulting
    Returns students who should receive immediate intervention
    
    POST /api/ai/fees/identify-defaulters?days_overdue_threshold=30
    """
    return {
        "message": "Call backend API to get students with days_overdue >= threshold",
        "threshold": days_overdue_threshold,
        "next_step": "Send to predict-default endpoint for risk scoring",
    }


@router.get("/sample-prediction")
async def sample_prediction():
    """
    Get sample default prediction for demonstration
    
    GET /api/ai/fees/sample-prediction
    """
    sample_request = {
        "student_id": "STU_SAMPLE_001",
        "class_level": 10,
        "days_overdue": 45,
        "outstanding_amount": 5000,
        "total_expected_fees": 180000,
        "payment_history": ["on_time", "on_time", "late_1_30", "late_30_60"],
        "parent_communication_score": 0.3,
        "previous_arrears_count": 1,
        "admission_method": "paying",
        "parent_occupation": "business",
    }
    
    result = fee_predictor.predict_default_risk(sample_request)
    return result
