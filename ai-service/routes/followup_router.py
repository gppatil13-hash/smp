"""
Follow-up suggestion API endpoints for admission enquiries and fee collection
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import logging

from models.followup_engine import followup_engine as engine

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class EnquiryFollowupRequest(BaseModel):
    """Request for admission enquiry follow-up suggestions"""
    enquiry_id: str
    status: str  # INQUIRY, APPLIED, SHORTLISTED, ADMITTED
    days_since_last_contact: int
    days_since_enquiry: int
    communication_count: int = 0
    last_communication_type: Optional[str] = None
    parent_type: str = "neutral"  # engaged, neutral, disengaged
    conversion_probability: float = 0.5
    student_test_score: Optional[float] = None


class FeeFollowupRequest(BaseModel):
    """Request for fee follow-up suggestions"""
    student_id: str
    days_overdue: int
    outstanding_amount: float
    default_risk_probability: float = 0.5
    days_since_last_reminder: int = 0
    reminder_count: int = 0
    fee_month: Optional[str] = None
    parent_communication_score: float = 0.5
    days_till_due: int = 0


class FollowupAction(BaseModel):
    """Individual follow-up action"""
    action: str
    description: str
    medium: str  # email, phone, whatsapp, in_person, etc
    priority: str  # low, medium, high, critical
    urgency: Optional[str] = None


class EnquiryFollowupResponse(BaseModel):
    """Response with follow-up suggestions for enquiry"""
    enquiry_id: str
    suggested_actions: List[Dict[str, Any]]
    primary_action: Dict[str, Any]
    urgency_level: str
    optimal_contact_time: str
    communication_channels: List[str]
    expected_outcome: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class FeeFollowupResponse(BaseModel):
    """Response with follow-up suggestions for fees"""
    student_id: str
    suggested_actions: List[Dict[str, Any]]
    primary_action: Dict[str, Any]
    urgency_level: str
    suggested_contact_time: str
    communication_channels: List[str]
    success_probability: float
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/admission", response_model=EnquiryFollowupResponse)
async def suggest_admission_followup(request: EnquiryFollowupRequest):
    """
    Get suggested follow-up actions for admission enquiry
    
    POST /api/ai/followup/admission
    
    Args:
        request: EnquiryFollowupRequest with enquiry state
    
    Returns:
        EnquiryFollowupResponse with suggested actions
    """
    try:
        logger.info(f"Getting follow-up suggestions for enquiry: {request.enquiry_id}")
        
        # Prepare data
        enquiry_data = request.dict()
        
        # Get suggestions using the engine
        result = engine.suggest_admission_followup(enquiry_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return EnquiryFollowupResponse(**result)
    
    except Exception as e:
        logger.error(f"Error suggesting admission followup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fees", response_model=FeeFollowupResponse)
async def suggest_fee_followup(request: FeeFollowupRequest):
    """
    Get suggested follow-up actions for fee collection
    
    POST /api/ai/followup/fees
    
    Args:
        request: FeeFollowupRequest with fee state
    
    Returns:
        FeeFollowupResponse with suggested actions
    """
    try:
        logger.info(f"Getting follow-up suggestions for student: {request.student_id}")
        
        # Prepare data
        student_data = request.dict()
        
        # Get suggestions using the engine
        result = engine.suggest_fee_followup(student_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return FeeFollowupResponse(**result)
    
    except Exception as e:
        logger.error(f"Error suggesting fee followup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-admission-suggestions")
async def batch_admission_suggestions(requests: List[EnquiryFollowupRequest]):
    """
    Get follow-up suggestions for multiple enquiries
    
    POST /api/ai/followup/batch-admission-suggestions
    """
    try:
        logger.info(f"Getting follow-up suggestions for {len(requests)} enquiries")
        
        results = []
        urgent_count = 0
        
        for req in requests:
            enquiry_data = req.dict()
            result = engine.suggest_admission_followup(enquiry_data)
            results.append(result)
            
            if result.get("urgency_level") in ["high", "critical"]:
                urgent_count += 1
        
        return {
            "total_enquiries": len(requests),
            "suggestions": results,
            "urgent_followups": urgent_count,
            "summary": f"{urgent_count} enquiries require urgent follow-up",
        }
    
    except Exception as e:
        logger.error(f"Error in batch suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-fee-suggestions")
async def batch_fee_suggestions(requests: List[FeeFollowupRequest]):
    """
    Get follow-up suggestions for multiple students' fees
    
    POST /api/ai/followup/batch-fee-suggestions
    """
    try:
        logger.info(f"Getting fee follow-up suggestions for {len(requests)} students")
        
        results = []
        critical_count = 0
        urgent_count = 0
        
        for req in requests:
            student_data = req.dict()
            result = engine.suggest_fee_followup(student_data)
            results.append(result)
            
            urgency = result.get("urgency_level")
            if urgency == "critical":
                critical_count += 1
            elif urgency == "high":
                urgent_count += 1
        
        return {
            "total_students": len(requests),
            "suggestions": results,
            "critical_followups": critical_count,
            "urgent_followups": urgent_count,
            "summary": f"{critical_count} critical, {urgent_count} urgent follow-ups needed",
        }
    
    except Exception as e:
        logger.error(f"Error in batch fee suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sample-admission")
async def sample_admission_suggestion():
    """
    Get sample follow-up suggestion for admission enquiry
    
    GET /api/ai/followup/sample-admission
    """
    sample_request = {
        "enquiry_id": "ENQ_SAMPLE_001",
        "status": "SHORTLISTED",
        "days_since_last_contact": 5,
        "days_since_enquiry": 25,
        "communication_count": 3,
        "last_communication_type": "phone",
        "parent_type": "engaged",
        "conversion_probability": 0.75,
    }
    
    result = engine.suggest_admission_followup(sample_request)
    return result


@router.get("/sample-fee")
async def sample_fee_suggestion():
    """
    Get sample follow-up suggestion for fee collection
    
    GET /api/ai/followup/sample-fee
    """
    sample_request = {
        "student_id": "STU_SAMPLE_001",
        "days_overdue": 20,
        "outstanding_amount": 15000,
        "default_risk_probability": 0.6,
        "days_since_last_reminder": 3,
        "reminder_count": 2,
        "parent_communication_score": 0.7,
    }
    
    result = engine.suggest_fee_followup(sample_request)
    return result
