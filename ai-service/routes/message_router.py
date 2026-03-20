"""
Smart Message Generation API endpoints
Exposes the message generation engine via REST API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
import logging

from models.message_generator import message_generator

logger = logging.getLogger(__name__)
router = APIRouter()


# Request Models
class EnquiryMessageRequest(BaseModel):
    """Request for generating enquiry-related messages"""
    enquiry_id: str
    student_name: str
    parent_name: Optional[str] = None
    class_requested: Optional[str] = None
    status: str = Field(default="INQUIRY", description="INQUIRY, APPLIED, SHORTLISTED, ADMITTED")
    days_since_enquiry: int = Field(default=0, ge=0)
    conversion_probability: float = Field(default=0.5, ge=0, le=1)
    parent_type: str = Field(default="neutral", description="engaged, neutral, disengaged")
    message_type: str = Field(
        default="inquiry_initial",
        description="inquiry_initial, inquiry_followup, test_schedule, shortlist, admission_offer"
    )
    channel: str = Field(default="email", description="email, sms, whatsapp, phone")
    test_date: Optional[str] = None
    test_time: Optional[str] = None


class FeeMessageRequest(BaseModel):
    """Request for generating fee-related messages"""
    student_id: str
    student_name: str
    parent_name: Optional[str] = None
    days_overdue: int = Field(default=0, ge=0)
    outstanding_amount: float = Field(default=0, ge=0)
    default_risk_probability: float = Field(default=0.5, ge=0, le=1)
    parent_communication_score: float = Field(default=0.5, ge=0, le=1)
    message_type: str = Field(
        default="fee_reminder",
        description="fee_reminder, fee_urgent, fee_overdue, fee_critical"
    )
    channel: str = Field(default="whatsapp", description="email, sms, whatsapp, phone")


class BatchMessageRequest(BaseModel):
    """Request for batch message generation"""
    messages: List[Dict[str, Any]]
    message_template: str
    channel: str = "email"


# Response Models
class GeneratedMessage(BaseModel):
    """Generated message with components"""
    subject: Optional[str] = Field(None, description="Subject (for email)")
    greeting: str = Field(description="Greeting line")
    body: str = Field(description="Main message body")
    closing: str = Field(description="Closing statement")
    cta: str = Field(description="Call to action")


class EnquiryMessageResponse(BaseModel):
    """Response with generated enquiry message"""
    enquiry_id: str
    message_type: str
    channel: str
    tone: str = Field(description="professional or friendly")
    message: GeneratedMessage
    personalization_level: str = Field(description="low, medium, high")
    generated_at: str
    preview: str = Field(description="Full message preview")
    error: Optional[str] = None


class FeeMessageResponse(BaseModel):
    """Response with generated fee message"""
    student_id: str
    message_type: str
    channel: str
    tone: str
    message: GeneratedMessage
    urgency_level: str
    generated_at: str
    preview: str
    error: Optional[str] = None


# ==================== ENQUIRY MESSAGE ENDPOINTS ====================

@router.post("/generate-enquiry-message", response_model=EnquiryMessageResponse)
async def generate_enquiry_message(request: EnquiryMessageRequest):
    """
    Generate personalized enquiry-related message
    
    POST /api/ai/messages/generate-enquiry-message
    
    Generates contextual messages for different enquiry stages:
    - Initial inquiry acknowledgement
    - Follow-up messages
    - Test schedule notification
    - Shortlist notification
    - Admission offer letter
    
    Args:
        request: EnquiryMessageRequest
    
    Returns:
        EnquiryMessageResponse with personalized message
    """
    try:
        logger.info(f"Generating enquiry message for: {request.enquiry_id}")
        
        enquiry_data = request.dict()
        
        # Generate message
        result = message_generator.generate_enquiry_message(
            enquiry_data,
            message_type=request.message_type,
            channel=request.channel
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Format response
        message_dict = result.get("message", {})
        
        # Create full message preview
        preview = f"""{message_dict.get('greeting', '')}

{message_dict.get('body', '')}

{message_dict.get('closing', '')}

{message_dict.get('cta', '')}"""
        
        return EnquiryMessageResponse(
            enquiry_id=result.get("enquiry_id"),
            message_type=result.get("message_type"),
            channel=result.get("channel"),
            tone=result.get("tone", "professional"),
            message=GeneratedMessage(**message_dict),
            personalization_level=result.get("personalization_level", "medium"),
            generated_at=result.get("generated_at"),
            preview=preview.strip(),
        )
    
    except Exception as e:
        logger.error(f"Error generating enquiry message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-enquiry-message-variants")
async def generate_enquiry_message_variants(request: EnquiryMessageRequest):
    """
    Generate multiple variants of enquiry message
    
    POST /api/ai/messages/generate-enquiry-message-variants
    
    Returns different tones and styles for A/B testing
    """
    try:
        logger.info(f"Generating message variants for: {request.enquiry_id}")
        
        variants = []
        
        # Generate professional variant
        enquiry_data = request.dict()
        professional_result = message_generator.generate_enquiry_message(
            enquiry_data,
            message_type=request.message_type,
            channel=request.channel
        )
        
        if "error" not in professional_result:
            variants.append({
                "variant_id": "professional",
                "tone": "professional",
                "message": professional_result.get("message"),
                "description": "Formal, professional tone",
            })
        
        # Generate friendly variant
        enquiry_data_friendly = enquiry_data.copy()
        enquiry_data_friendly["tone_preference"] = "friendly"
        friendly_result = message_generator.generate_enquiry_message(
            enquiry_data_friendly,
            message_type=request.message_type,
            channel=request.channel
        )
        
        if "error" not in friendly_result:
            variants.append({
                "variant_id": "friendly",
                "tone": "friendly",
                "message": friendly_result.get("message"),
                "description": "Warm, friendly, approachable tone",
            })
        
        return {
            "enquiry_id": request.enquiry_id,
            "message_type": request.message_type,
            "channel": request.channel,
            "variant_count": len(variants),
            "variants": variants,
            "recommendation": "professional" if request.parent_type == "neutral" else "friendly",
        }
    
    except Exception as e:
        logger.error(f"Error generating variants: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FEE MESSAGE ENDPOINTS ====================

@router.post("/generate-fee-message", response_model=FeeMessageResponse)
async def generate_fee_message(request: FeeMessageRequest):
    """
    Generate personalized fee-related message
    
    POST /api/ai/messages/generate-fee-message
    
    Generates contextual fee collection messages:
    - Friendly payment reminders
    - Urgent payment notices
    - Overdue payment demands
    - Critical notices
    
    Args:
        request: FeeMessageRequest
    
    Returns:
        FeeMessageResponse with personalized message
    """
    try:
        logger.info(f"Generating fee message for: {request.student_id}")
        
        student_data = request.dict()
        
        # Generate message
        result = message_generator.generate_fee_message(
            student_data,
            message_type=request.message_type,
            channel=request.channel
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Format response
        message_dict = result.get("message", {})
        
        # Create full message preview
        preview = f"""{message_dict.get('greeting', '')}

{message_dict.get('body', '')}

{message_dict.get('closing', '')}

{message_dict.get('cta', '')}"""
        
        return FeeMessageResponse(
            student_id=result.get("student_id"),
            message_type=result.get("message_type"),
            channel=result.get("channel"),
            tone=result.get("tone", "professional"),
            message=GeneratedMessage(**message_dict),
            urgency_level=result.get("urgency_level", "medium"),
            generated_at=result.get("generated_at"),
            preview=preview.strip(),
        )
    
    except Exception as e:
        logger.error(f"Error generating fee message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BATCH MESSAGE ENDPOINTS ====================

@router.post("/batch-generate-enquiry-messages")
async def batch_generate_enquiry_messages(requests: List[EnquiryMessageRequest]):
    """
    Generate messages for multiple enquiries
    
    POST /api/ai/messages/batch-generate-enquiry-messages
    """
    try:
        logger.info(f"Generating messages for {len(requests)} enquiries")
        
        results = []
        
        for req in requests:
            enquiry_data = req.dict()
            result = message_generator.generate_enquiry_message(
                enquiry_data,
                message_type=req.message_type,
                channel=req.channel
            )
            
            if "error" not in result:
                results.append({
                    "enquiry_id": result.get("enquiry_id"),
                    "message_type": result.get("message_type"),
                    "channel": result.get("channel"),
                    "tone": result.get("tone"),
                })
        
        return {
            "total_requested": len(requests),
            "generated": len(results),
            "failed": len(requests) - len(results),
            "results": results,
        }
    
    except Exception as e:
        logger.error(f"Error in batch generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-generate-fee-messages")
async def batch_generate_fee_messages(requests: List[FeeMessageRequest]):
    """
    Generate messages for multiple students' fees
    
    POST /api/ai/messages/batch-generate-fee-messages
    """
    try:
        logger.info(f"Generating fee messages for {len(requests)} students")
        
        results = []
        
        for req in requests:
            student_data = req.dict()
            result = message_generator.generate_fee_message(
                student_data,
                message_type=req.message_type,
                channel=req.channel
            )
            
            if "error" not in result:
                results.append({
                    "student_id": result.get("student_id"),
                    "message_type": result.get("message_type"),
                    "channel": result.get("channel"),
                    "urgency": result.get("urgency_level"),
                })
        
        return {
            "total_requested": len(requests),
            "generated": len(results),
            "failed": len(requests) - len(results),
            "results": results,
        }
    
    except Exception as e:
        logger.error(f"Error in batch generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TEMPLATE & PREVIEW ENDPOINTS ====================

@router.get("/available-templates")
async def get_available_templates():
    """
    Get list of available message templates
    
    GET /api/ai/messages/available-templates
    """
    return {
        "enquiry_templates": [
            {
                "id": "inquiry_initial",
                "name": "Initial Inquiry Acknowledgement",
                "description": "Welcome message for new enquiries",
                "channels": ["email", "whatsapp", "sms"],
            },
            {
                "id": "inquiry_followup",
                "name": "Enquiry Follow-up",
                "description": "Follow-up message for inactive enquiries",
                "channels": ["email", "whatsapp", "phone"],
            },
            {
                "id": "test_schedule",
                "name": "Test Schedule Notification",
                "description": "Notify about upcoming entrance test",
                "channels": ["email", "whatsapp", "sms"],
            },
            {
                "id": "shortlist_notification",
                "name": "Shortlist Notification",
                "description": "Congratulations on shortlisting",
                "channels": ["email", "phone", "whatsapp"],
            },
            {
                "id": "admission_offer",
                "name": "Admission Offer Letter",
                "description": "Formal admission offer",
                "channels": ["email", "whatsapp"],
            },
        ],
        "fee_templates": [
            {
                "id": "fee_reminder",
                "name": "Fee Payment Reminder",
                "description": "Friendly payment reminder",
                "channels": ["whatsapp", "sms", "email"],
            },
            {
                "id": "fee_urgent",
                "name": "Urgent Fee Notice",
                "description": "Urgent payment notification",
                "channels": ["whatsapp", "phone", "email"],
            },
            {
                "id": "fee_overdue",
                "name": "Overdue Payment Notice",
                "description": "Formal overdue notice",
                "channels": ["email", "phone"],
            },
            {
                "id": "fee_critical",
                "name": "Critical Payment Notice",
                "description": "Final critical notice",
                "channels": ["email", "phone"],
            },
        ],
    }


@router.post("/preview-message-on-channel")
async def preview_message_on_channel(request: Dict[str, Any]):
    """
    Preview how message appears on specific channel
    
    POST /api/ai/messages/preview-message-on-channel
    """
    return {
        "channel": request.get("channel", "email"),
        "layout": "formatted" if request.get("channel") == "email" else "text-wrapped",
        "character_limit": 4000 if request.get("channel") == "email" else 160,
        "preview": request.get("message", ""),
    }


# ==================== SAMPLE ENDPOINTS ====================

@router.get("/sample-enquiry-message")
async def sample_enquiry_message():
    """
    Get a sample enquiry message
    
    GET /api/ai/messages/sample-enquiry-message
    """
    sample_request = EnquiryMessageRequest(
        enquiry_id="ENQ_SAMPLE_001",
        student_name="Arjun Kumar",
        parent_name="Rajesh Kumar",
        class_requested="10",
        status="APPLIED",
        days_since_enquiry=15,
        conversion_probability=0.75,
        parent_type="engaged",
        message_type="inquiry_followup",
        channel="email",
    )
    
    enquiry_data = sample_request.dict()
    result = message_generator.generate_enquiry_message(
        enquiry_data,
        message_type=sample_request.message_type,
        channel=sample_request.channel
    )
    
    return result


@router.get("/sample-fee-message")
async def sample_fee_message():
    """
    Get a sample fee message
    
    GET /api/ai/messages/sample-fee-message
    """
    sample_request = FeeMessageRequest(
        student_id="STU_SAMPLE_001",
        student_name="Arjun Kumar",
        parent_name="Rajesh Kumar",
        days_overdue=20,
        outstanding_amount=15000,
        default_risk_probability=0.6,
        parent_communication_score=0.7,
        message_type="fee_urgent",
        channel="whatsapp",
    )
    
    student_data = sample_request.dict()
    result = message_generator.generate_fee_message(
        student_data,
        message_type=sample_request.message_type,
        channel=sample_request.channel
    )
    
    return result
