"""
Fee Default Prediction API endpoints
Exposes the fee default prediction model via REST API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from models.fee_default_predictor import fee_default_predictor

logger = logging.getLogger(__name__)
router = APIRouter()


# Request Models
class FeeDefaultRiskRequest(BaseModel):
    """Request for fee default risk prediction"""
    student_id: str
    days_overdue: int = Field(default=0, ge=0, description="Days overdue (0 if not yet due)")
    outstanding_amount: float = Field(default=0, ge=0, description="Amount still outstanding")
    original_fee_amount: float = Field(default=0, ge=0, description="Original fee amount")
    default_risk_probability: float = Field(default=0.5, ge=0, le=1, description="Historical default risk")
    days_since_last_reminder: int = Field(default=0, ge=0, description="Days since last reminder sent")
    reminder_count: int = Field(default=0, ge=0, description="Number of reminders sent")
    previous_defaults: int = Field(default=0, ge=0, description="Count of previous fee defaults")
    payment_history_score: float = Field(default=0.5, ge=0, le=1, description="Score of payment history (0-1)")
    parent_communication_score: float = Field(default=0.5, ge=0, le=1, description="Parent communication responsiveness (0-1)")
    family_income_range: str = Field(default="medium", description="Income level: low, medium, high")
    fee_month: Optional[str] = Field(default=None, description="Month of fee (Jan, Feb, etc)")
    current_month: Optional[int] = Field(default=None, ge=1, le=12, description="Current month (1-12)")
    student_performance: float = Field(default=50, ge=0, le=100, description="Student academic performance (0-100)")
    fees_paid_on_time_count: int = Field(default=0, ge=0, description="Count of fees paid on time")
    total_fee_instances: int = Field(default=1, ge=0, description="Total number of fee instances")


class BatchDefaultRiskRequest(BaseModel):
    """Request for batch default risk assessment"""
    students: List[FeeDefaultRiskRequest]
    sort_by: str = Field(default="risk", description="Sort by: risk, amount, days_overdue")


# Response Models
class RiskComponentBreakdown(BaseModel):
    """Breakdown of risk components"""
    overdue_risk: float = Field(description="Risk from days overdue")
    historical_risk: float = Field(description="Risk from payment history")
    responsiveness_risk: float = Field(description="Risk from communication responsiveness")
    financial_capacity_risk: float = Field(description="Risk from financial capacity")


class DefaultRiskResponse(BaseModel):
    """Response with default risk prediction"""
    student_id: str
    default_probability: float = Field(description="Probability of default (0-1)")
    default_probability_percentage: float = Field(description="Probability as percentage")
    payment_probability: float = Field(description="Probability of successful payment (0-1)")
    risk_level: str = Field(description="Risk level: critical, high, medium, low, very_low")
    action_urgency: str = Field(description="Action urgency: immediate, urgent, high, medium, low")
    collection_difficulty: str = Field(description="Collection difficulty assessment")
    days_until_critical: int = Field(description="Estimated days until legal action needed")
    confidence_score: float = Field(description="Confidence in prediction (0-1)")
    recommendations: List[str] = Field(description="Recommendations to prevent default")
    suggested_actions: List[str] = Field(description="Specific collection actions to take")
    component_risks: RiskComponentBreakdown
    error: Optional[str] = None


class BatchDefaultRiskResponse(BaseModel):
    """Response for batch risk assessment"""
    total_students: int
    assessed: int
    risk_distribution: Dict[str, int]
    financial_risk: Dict[str, float]
    results: List[DefaultRiskResponse]
    prioritized_for_collection: List[Dict[str, Any]]


# ==================== SINGLE PREDICTION ENDPOINTS ====================

@router.post("/predict-default-risk", response_model=DefaultRiskResponse)
async def predict_default_risk(request: FeeDefaultRiskRequest):
    """
    Predict fee payment default probability
    
    POST /api/ai/fees/predict-default-risk
    
    Analyzes multiple risk factors to predict likelihood of default:
    - Payment history and previous defaults
    - Days overdue and payment behavior
    - Parent communication responsiveness
    - Financial capacity indicators
    - Reminder effectiveness
    
    Args:
        request: FeeDefaultRiskRequest with student fee details
    
    Returns:
        DefaultRiskResponse with risk prediction and recommendations
    """
    try:
        logger.info(f"Predicting default risk for student: {request.student_id}")
        
        # Prepare data for model
        student_data = request.dict()
        
        # Run prediction
        result = fee_default_predictor.predict_default_probability(student_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        return DefaultRiskResponse(**result)
    
    except Exception as e:
        logger.error(f"Error predicting default risk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assess-batch-risk")
async def assess_batch_risk(request: BatchDefaultRiskRequest):
    """
    Assess default risk for multiple students
    
    POST /api/ai/fees/assess-batch-risk
    
    Processes multiple students and ranks by collection priority
    """
    try:
        logger.info(f"Assessing default risk for {len(request.students)} students")
        
        # Convert requests to dicts
        students_data = [s.dict() for s in request.students]
        
        # Run batch assessment
        result = fee_default_predictor.batch_risk_assessment(students_data)
        
        # Sort based on request
        if request.sort_by == "amount":
            result["prioritized_for_collection"] = sorted(
                result["prioritized_for_collection"],
                key=lambda x: students_data[next(i for i, s in enumerate(students_data) if s["student_id"] == x["student_id"])].get("outstanding_amount", 0),
                reverse=True
            )
        elif request.sort_by == "days_overdue":
            result["prioritized_for_collection"] = sorted(
                result["prioritized_for_collection"],
                key=lambda x: students_data[next(i for i, s in enumerate(students_data) if s["student_id"] == x["student_id"])].get("days_overdue", 0),
                reverse=True
            )
        # else: already sorted by risk (default)
        
        return result
    
    except Exception as e:
        logger.error(f"Error assessing batch risk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYSIS ENDPOINTS ====================

@router.post("/collection-strategy")
async def recommend_collection_strategy(request: FeeDefaultRiskRequest):
    """
    Get recommended collection strategy for a student
    
    POST /api/ai/fees/collection-strategy
    
    Provides tailored collection approach based on risk assessment
    """
    try:
        logger.info(f"Generating collection strategy for: {request.student_id}")
        
        student_data = request.dict()
        risk_result = fee_default_predictor.predict_default_probability(student_data)
        
        return {
            "student_id": request.student_id,
            "risk_assessment": {
                "probability": risk_result.get("default_probability"),
                "risk_level": risk_result.get("risk_level"),
                "urgency": risk_result.get("action_urgency"),
            },
            "collection_strategy": {
                "primary_approach": "Direct contact" if risk_result.get("action_urgency") in ["immediate", "urgent"] else "Friendly reminder",
                "communication_channels": ["phone", "whatsapp"] if risk_result.get("collection_difficulty") == "very_difficult" else ["email", "whatsapp"],
                "timeline": {
                    "next_contact": "Today" if risk_result.get("action_urgency") == "immediate" else "Within 24 hours" if risk_result.get("action_urgency") == "urgent" else "Within 3 days",
                    "follow_up_frequency": "Daily" if risk_result.get("action_urgency") == "immediate" else "Every 2-3 days",
                },
                "incentives": [
                    "Offer installment plan",
                    "Provide early settlement discount",
                ] if risk_result.get("risk_level") in ["high", "critical"] else [],
                "escalation_plan": {
                    "if_no_response_in_days": 7 if risk_result.get("risk_level") != "critical" else 2,
                    "next_escalation": "Manager involvement" if risk_result.get("risk_level") != "critical" else "Director intervention",
                },
            },
            "success_probability": round(1.0 - risk_result.get("default_probability", 0), 3),
            "recommendations": risk_result.get("recommendations", []),
        }
    
    except Exception as e:
        logger.error(f"Error in collection strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk-comparison")
async def compare_default_risks(student1: FeeDefaultRiskRequest, student2: FeeDefaultRiskRequest):
    """
    Compare default risks for two students
    
    POST /api/ai/fees/risk-comparison
    """
    try:
        logger.info(f"Comparing default risks: {student1.student_id} vs {student2.student_id}")
        
        risk1 = fee_default_predictor.predict_default_probability(student1.dict())
        risk2 = fee_default_predictor.predict_default_probability(student2.dict())
        
        prob1 = risk1.get("default_probability", 0)
        prob2 = risk2.get("default_probability", 0)
        
        return {
            "student1": {
                "id": student1.student_id,
                "default_probability": prob1,
                "risk_level": risk1.get("risk_level"),
            },
            "student2": {
                "id": student2.student_id,
                "default_probability": prob2,
                "risk_level": risk2.get("risk_level"),
            },
            "comparison": {
                "higher_risk_student": student1.student_id if prob1 > prob2 else student2.student_id,
                "probability_difference": round(abs(prob1 - prob2), 3),
                "percentage_difference": f"{abs((prob1 - prob2) * 100):.1f}%",
                "priority_ranking": [
                    {"rank": 1, "student_id": (student1.student_id if prob1 > prob2 else student2.student_id), "risk": round(max(prob1, prob2), 3)},
                    {"rank": 2, "student_id": (student2.student_id if prob1 > prob2 else student1.student_id), "risk": round(min(prob1, prob2), 3)},
                ],
            },
        }
    
    except Exception as e:
        logger.error(f"Error comparing risks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SAMPLE/TEST ENDPOINTS ====================

@router.get("/sample-risk-prediction")
async def sample_risk_prediction():
    """
    Get a sample default risk prediction
    
    GET /api/ai/fees/sample-risk-prediction
    """
    sample_student = {
        "student_id": "STU_SAMPLE_001",
        "days_overdue": 25,
        "outstanding_amount": 15000,
        "original_fee_amount": 100000,
        "days_since_last_reminder": 5,
        "reminder_count": 2,
        "previous_defaults": 0,
        "payment_history_score": 0.7,
        "parent_communication_score": 0.6,
        "family_income_range": "medium",
        "student_performance": 75,
        "fees_paid_on_time_count": 3,
        "total_fee_instances": 4,
    }
    
    result = fee_default_predictor.predict_default_probability(sample_student)
    return result


@router.post("/simulate-payment-scenario")
async def simulate_payment_scenario(request: FeeDefaultRiskRequest):
    """
    Simulate how risk changes with hypothetical payment
    
    POST /api/ai/fees/simulate-payment-scenario
    """
    try:
        logger.info(f"Simulating scenarios for: {request.student_id}")
        
        # Current risk
        current_risk = fee_default_predictor.predict_default_probability(request.dict())
        
        # Scenario 1: Partial payment
        scenario1_data = request.dict()
        scenario1_data["days_overdue"] = max(0, scenario1_data["days_overdue"] - 5)
        scenario1_data["outstanding_amount"] = max(0, scenario1_data["outstanding_amount"] / 2)
        scenario1_data["reminder_count"] = scenario1_data.get("reminder_count", 0) + 1
        scenario1_risk = fee_default_predictor.predict_default_probability(scenario1_data)
        
        # Scenario 2: Full payment received
        scenario2_data = request.dict()
        scenario2_data["days_overdue"] = 0
        scenario2_data["outstanding_amount"] = 0
        scenario2_data["previous_defaults"] = 0
        scenario2_risk = fee_default_predictor.predict_default_probability(scenario2_data)
        
        # Scenario 3: Installment plan accepted
        scenario3_data = request.dict()
        scenario3_data["parent_communication_score"] = min(1.0, scenario3_data["parent_communication_score"] + 0.2)
        scenario3_data["reminder_count"] = scenario3_data.get("reminder_count", 0) + 1
        scenario3_risk = fee_default_predictor.predict_default_probability(scenario3_data)
        
        return {
            "student_id": request.student_id,
            "current_state": {
                "default_probability": current_risk.get("default_probability"),
                "risk_level": current_risk.get("risk_level"),
            },
            "scenarios": [
                {
                    "scenario": "Partial Payment (50%)",
                    "default_probability": scenario1_risk.get("default_probability"),
                    "risk_reduction": round(current_risk.get("default_probability", 0) - scenario1_risk.get("default_probability", 0), 3),
                },
                {
                    "scenario": "Full Payment Received",
                    "default_probability": scenario2_risk.get("default_probability"),
                    "risk_reduction": round(current_risk.get("default_probability", 0) - scenario2_risk.get("default_probability", 0), 3),
                },
                {
                    "scenario": "Installment Plan Accepted",
                    "default_probability": scenario3_risk.get("default_probability"),
                    "risk_reduction": round(current_risk.get("default_probability", 0) - scenario3_risk.get("default_probability", 0), 3),
                },
            ],
            "best_action": "Full Payment Received (100% risk elimination)" if scenario2_risk.get("default_probability", 0) < scenario1_risk.get("default_probability", 0) else "Installment Plan Accepted",
        }
    
    except Exception as e:
        logger.error(f"Error in payment scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
