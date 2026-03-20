"""
Admission prediction API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from models.admission_scorer import admission_scorer

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class AdmissionPredictionRequest(BaseModel):
    """Request model for admission prediction"""
    enquiry_id: str
    days_since_enquiry: int
    communication_frequency: int  # 0-100
    previous_enquiries: int = 0
    student_performance: float = 50  # 0-100
    class_availability_score: float = 0.5  # 0-1
    parent_type: str = "neutral"  # engaged, neutral, disengaged
    school_area: str = "suburban"  # urban, suburban, rural
    enquiry_type: str = "online"  # phone, online, inperson
    enquiry_month: Optional[int] = None
    payment_capability_score: float = 0.5  # 0-1


class AdmissionPredictionResponse(BaseModel):
    """Response model for admission prediction"""
    enquiry_id: str
    conversion_probability: float
    confidence_score: float
    risk_level: str
    key_factors: List[str]
    recommendations: List[str]
    next_action: str
    estimated_conversion_days: int


@router.post("/predict-conversion", response_model=AdmissionPredictionResponse)
async def predict_admission_conversion(request: AdmissionPredictionRequest):
    """
    Predict likelihood of enquiry converting to admission
    
    POST /api/ai/admission/predict-conversion
    
    Args:
        request: AdmissionPredictionRequest with enquiry details
    
    Returns:
        AdmissionPredictionResponse with prediction and insights
    """
    try:
        logger.info(f"Predicting conversion for enquiry: {request.enquiry_id}")
        
        # Prepare data
        enquiry_data = request.dict()
        
        # Get prediction
        result = admission_scorer.predict_conversion_probability(enquiry_data)
        
        # Validate result
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return AdmissionPredictionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error predicting admission conversion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-predict")
async def batch_predict_admissions(requests: List[AdmissionPredictionRequest]):
    """
    Predict conversion probability for multiple enquiries
    
    POST /api/ai/admission/batch-predict
    
    Args:
        requests: List of AdmissionPredictionRequest
    
    Returns:
        List of predictions
    """
    try:
        logger.info(f"Batch predicting {len(requests)} enquiries")
        
        results = []
        for req in requests:
            enquiry_data = req.dict()
            result = admission_scorer.predict_conversion_probability(enquiry_data)
            results.append(result)
        
        return {
            "total_enquiries": len(requests),
            "predictions": results,
            "average_probability": sum(r.get("conversion_probability", 0) for r in results) / len(results) if results else 0,
        }
    
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sample-prediction")
async def sample_prediction():
    """
    Get sample prediction for demonstration
    
    GET /api/ai/admission/sample-prediction
    """
    sample_request = {
        "enquiry_id": "ENQ_SAMPLE_001",
        "days_since_enquiry": 15,
        "communication_frequency": 75,
        "previous_enquiries": 0,
        "student_performance": 85,
        "class_availability_score": 0.8,
        "parent_type": "engaged",
        "school_area": "urban",
        "enquiry_type": "inperson",
        "enquiry_month": 3,
        "payment_capability_score": 0.9,
    }
    
    result = admission_scorer.predict_conversion_probability(sample_request)
    return result
