"""
Admission Probability Scoring API endpoints
Exposes the admission scoring model via REST API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from models.admission_scorer import admission_scorer

logger = logging.getLogger(__name__)
router = APIRouter()


# Request Models
class AdmissionScoringRequest(BaseModel):
    """Request for admission probability scoring"""
    enquiry_id: str
    status: str = Field(default="INQUIRY", description="Current status: INQUIRY, APPLIED, SHORTLISTED, ADMITTED")
    days_since_enquiry: int = Field(default=0, ge=0, description="Days since enquiry submitted")
    days_since_last_contact: int = Field(default=0, ge=0, description="Days since last contact")
    communication_frequency: int = Field(default=0, ge=0, le=100, description="Communication frequency score (0-100)")
    communication_count: int = Field(default=0, ge=0, description="Total number of communications")
    previous_enquiries: int = Field(default=0, ge=0, description="Previous enquiry count")
    student_performance: float = Field(default=50, ge=0, le=100, description="Test score (0-100)")
    student_test_score: Optional[float] = Field(default=None, description="Alternative field for test score")
    class_availability_score: float = Field(default=0.5, ge=0, le=1, description="Class availability (0-1)")
    parent_type: str = Field(default="neutral", description="Parent type: engaged, neutral, disengaged")
    parent_engagement_score: Optional[float] = Field(default=None, description="Custom engagement score")
    school_area: str = Field(default="suburban", description="Location: urban, suburban, rural")
    location_proximity_score: Optional[float] = Field(default=None, description="Custom proximity score")
    payment_capability_score: float = Field(default=0.5, ge=0, le=1, description="Payment capability (0-1)")
    enquiry_type: str = Field(default="online", description="Type of enquiry: phone, online, inperson")
    enquiry_month: Optional[int] = Field(default=None, ge=1, le=12, description="Month of enquiry")
    last_communication_type: Optional[str] = Field(default=None, description="Type of last communication")
    previous_interactions: int = Field(default=0, ge=0, description="Number of previous interactions")
    class_requested: Optional[str] = Field(default=None, description="Class for which enquiry is made")


class BatchScoringRequest(BaseModel):
    """Request for batch scoring"""
    enquiries: List[AdmissionScoringRequest]
    prioritize_by: str = Field(default="probability", description="Sort results by: probability, recent, engagement")


# Response Models
class ScoringComponentBreakdown(BaseModel):
    """Breakdown of scoring components"""
    days_since_contact: int
    communication_frequency: int
    student_performance: float
    class_availability: float
    parent_engagement: str
    payment_capability: float


class ScoringResponse(BaseModel):
    """Response with scoring results"""
    enquiry_id: str
    conversion_probability: float = Field(description="Probability score (0-1)")
    probability_percentage: float = Field(description="Probability as percentage (0-100)")
    confidence_score: float = Field(description="Confidence in prediction (0-1)")
    risk_level: str = Field(description="Risk level: high, medium, low")
    key_factors: List[str] = Field(description="Key factors affecting score")
    recommendations: List[str] = Field(description="Recommended actions")
    next_action: str = Field(description="Immediate next action")
    estimated_conversion_days: Optional[int] = Field(description="Estimated days to conversion")
    component_breakdown: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BatchScoringResponse(BaseModel):
    """Response for batch scoring"""
    total_enquiries: int
    processed: int
    failed: int
    statistics: Dict[str, Any]
    results: List[ScoringResponse]
    sorted_results: List[ScoringResponse] = Field(description="Results sorted by priority")


# ==================== SINGLE SCORING ENDPOINTS ====================

@router.post("/score", response_model=ScoringResponse)
async def score_enquiry(request: AdmissionScoringRequest):
    """
    Score a single admission enquiry
    
    POST /api/ai/scoring/score
    
    Calculates conversion probability based on:
    - Communication frequency and recency
    - Student academic performance
    - Parent engagement level
    - Class availability
    - Payment capability
    
    Args:
        request: AdmissionScoringRequest with enquiry details
    
    Returns:
        ScoringResponse with probability score and recommendations
    """
    try:
        logger.info(f"Scoring enquiry: {request.enquiry_id}")
        
        # Prepare enquiry data for the model
        enquiry_data = request.dict()
        
        # Use the first available test score field
        if request.student_test_score is not None:
            enquiry_data["student_performance"] = request.student_test_score
        
        # Score the enquiry
        result = admission_scorer.predict_conversion_probability(enquiry_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Format response
        return ScoringResponse(
            enquiry_id=result.get("enquiry_id"),
            conversion_probability=result.get("conversion_probability", 0),
            probability_percentage=result.get("conversion_probability", 0) * 100,
            confidence_score=result.get("confidence_score", 0),
            risk_level=result.get("risk_level", "medium"),
            key_factors=result.get("key_factors", []),
            recommendations=result.get("recommendations", []),
            next_action=result.get("next_action", "Follow up with enquiry"),
            estimated_conversion_days=result.get("estimated_conversion_days"),
            component_breakdown=request.dict(),
        )
    
    except Exception as e:
        logger.error(f"Error scoring enquiry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score-and-rank")
async def score_and_rank_enquiries(requests: List[AdmissionScoringRequest]):
    """
    Score multiple enquiries and rank by conversion probability
    
    POST /api/ai/scoring/score-and-rank
    
    Args:
        requests: List of AdmissionScoringRequest
    
    Returns:
        Enquiries ranked by conversion probability (highest first)
    """
    try:
        logger.info(f"Scoring and ranking {len(requests)} enquiries")
        
        results = []
        high_probability_count = 0
        medium_probability_count = 0
        low_probability_count = 0
        
        for req in requests:
            enquiry_data = req.dict()
            if req.student_test_score:
                enquiry_data["student_performance"] = req.student_test_score
            
            result = admission_scorer.predict_conversion_probability(enquiry_data)
            
            if "error" not in result:
                results.append(result)
                prob = result.get("conversion_probability", 0)
                
                if prob >= 0.7:
                    high_probability_count += 1
                elif prob >= 0.4:
                    medium_probability_count += 1
                else:
                    low_probability_count += 1
        
        # Sort by probability (highest first)
        sorted_results = sorted(
            results,
            key=lambda x: x.get("conversion_probability", 0),
            reverse=True
        )
        
        return {
            "total_enquiries": len(requests),
            "scored": len(results),
            "failed": len(requests) - len(results),
            "statistics": {
                "high_probability_count": high_probability_count,
                "medium_probability_count": medium_probability_count,
                "low_probability_count": low_probability_count,
                "average_probability": round(
                    sum(r.get("conversion_probability", 0) for r in results) / len(results) if results else 0,
                    3
                ),
            },
            "ranked_results": [
                {
                    "rank": idx + 1,
                    "enquiry_id": r.get("enquiry_id"),
                    "probability": r.get("conversion_probability"),
                    "risk_level": r.get("risk_level"),
                    "next_action": r.get("next_action"),
                } for idx, r in enumerate(sorted_results)
            ],
            "all_results": sorted_results,
        }
    
    except Exception as e:
        logger.error(f"Error in ranking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYSIS ENDPOINTS ====================

@router.post("/compare-scores")
async def compare_enquiry_scores(enquiry1: AdmissionScoringRequest, enquiry2: AdmissionScoringRequest):
    """
    Compare scores and probabilities for two enquiries
    
    POST /api/ai/scoring/compare-scores
    """
    try:
        logger.info(f"Comparing enquiries: {enquiry1.enquiry_id} vs {enquiry2.enquiry_id}")
        
        score1 = admission_scorer.predict_conversion_probability(enquiry1.dict())
        score2 = admission_scorer.predict_conversion_probability(enquiry2.dict())
        
        prob1 = score1.get("conversion_probability", 0)
        prob2 = score2.get("conversion_probability", 0)
        difference = abs(prob1 - prob2)
        
        return {
            "enquiry1": {
                "id": enquiry1.enquiry_id,
                "probability": prob1,
                "risk_level": score1.get("risk_level"),
            },
            "enquiry2": {
                "id": enquiry2.enquiry_id,
                "probability": prob2,
                "risk_level": score2.get("risk_level"),
            },
            "comparison": {
                "difference": round(difference, 3),
                "higher_probability": enquiry1.enquiry_id if prob1 > prob2 else enquiry2.enquiry_id,
                "probability_gap": f"{(difference * 100):.1f}%",
                "summary": f"{('Higher' if prob1 > prob2 else 'Lower')} probability for {enquiry1.enquiry_id if prob1 > prob2 else enquiry2.enquiry_id}",
            },
        }
    
    except Exception as e:
        logger.error(f"Error comparing scores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SAMPLE/TEST ENDPOINTS ====================

@router.get("/sample-scoring")
async def sample_scoring():
    """
    Get a sample scoring result
    
    GET /api/ai/scoring/sample-scoring
    """
    sample_enquiry = {
        "enquiry_id": "ENQ_SAMPLE_001",
        "status": "APPLIED",
        "days_since_enquiry": 25,
        "days_since_last_contact": 5,
        "communication_frequency": 65,
        "communication_count": 4,
        "student_performance": 78,
        "class_availability_score": 0.8,
        "parent_type": "engaged",
        "school_area": "urban",
        "payment_capability_score": 0.75,
        "enquiry_type": "inperson",
        "enquiry_month": 3,
    }
    
    result = admission_scorer.predict_conversion_probability(sample_enquiry)
    return result


@router.post("/what-if-analysis")
async def what_if_analysis(base_request: AdmissionScoringRequest):
    """
    Analyze how different scenario changes affect score
    
    POST /api/ai/scoring/what-if-analysis
    
    Shows how probability changes with different factors
    """
    try:
        logger.info(f"Running what-if analysis for: {base_request.enquiry_id}")
        
        base_data = base_request.dict()
        base_score = admission_scorer.predict_conversion_probability(base_data)
        
        scenarios = []
        
        # Scenario 1: Increased communication
        data_increased_comm = base_data.copy()
        data_increased_comm["communication_frequency"] = min(100, base_data.get("communication_frequency", 0) + 30)
        score_increased_comm = admission_scorer.predict_conversion_probability(data_increased_comm)
        scenarios.append({
            "scenario": "20% increase in communication frequency",
            "new_probability": score_increased_comm.get("conversion_probability"),
            "change": score_increased_comm.get("conversion_probability", 0) - base_score.get("conversion_probability", 0),
        })
        
        # Scenario 2: Improved test score
        data_improved_test = base_data.copy()
        data_improved_test["student_performance"] = min(100, base_data.get("student_performance", 50) + 15)
        score_improved_test = admission_scorer.predict_conversion_probability(data_improved_test)
        scenarios.append({
            "scenario": "15 point increase in test score",
            "new_probability": score_improved_test.get("conversion_probability"),
            "change": score_improved_test.get("conversion_probability", 0) - base_score.get("conversion_probability", 0),
        })
        
        # Scenario 3: Better parent engagement
        data_better_engagement = base_data.copy()
        data_better_engagement["parent_type"] = "engaged"
        score_better_engagement = admission_scorer.predict_conversion_probability(data_better_engagement)
        scenarios.append({
            "scenario": "Parent engagement improved to 'engaged'",
            "new_probability": score_better_engagement.get("conversion_probability"),
            "change": score_better_engagement.get("conversion_probability", 0) - base_score.get("conversion_probability", 0),
        })
        
        return {
            "enquiry_id": base_request.enquiry_id,
            "base_probability": base_score.get("conversion_probability"),
            "scenarios": scenarios,
            "highest_impact_factor": max(scenarios, key=lambda x: x["change"])["scenario"],
        }
    
    except Exception as e:
        logger.error(f"Error in what-if analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
