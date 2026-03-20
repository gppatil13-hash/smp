"""
Smart follow-up suggestion engine
AI-powered recommendations for next actions in admission and fee workflows
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FollowUpSuggestionEngine:
    """
    Recommends optimal follow-up actions based on enquiry/student state
    Uses rule-based system with scoring
    """

    def __init__(self):
        """Initialize the engine"""
        self.model_name = "followup_suggestion_v1"

    def suggest_admission_followup(
        self,
        enquiry_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Suggest next follow-up action for an admission enquiry
        
        Args:
            enquiry_data:
                - enquiry_id: str
                - status: str (INQUIRY, APPLIED, SHORTLISTED, ADMITTED, etc)
                - days_since_last_contact: int
                - days_since_enquiry: int
                - communication_count: int
                - last_communication_type: str
                - parent_type: str (engaged, neutral, disengaged)
                - conversion_probability: float (from scorer)
                - student_test_score: float (if available)
        
        Returns:
            Dictionary with suggested actions
        """
        try:
            actions = []
            urgency = "normal"

            # Status-based suggestions
            status = enquiry_data.get("status", "INQUIRY")
            days_since_last = enquiry_data.get("days_since_last_contact", 0)
            days_since_start = enquiry_data.get("days_since_enquiry", 0)

            if status == "INQUIRY":
                if days_since_last < 2:
                    actions.append({
                        "action": "send_brochure",
                        "description": "Send school brochure and prospectus",
                        "medium": "email",
                        "priority": "medium",
                    })
                elif days_since_last < 7:
                    actions.append({
                        "action": "phone_call",
                        "description": "Call to understand requirements and schedule campus tour",
                        "medium": "phone",
                        "priority": "high",
                        "urgency": "urgent",
                    })
                    urgency = "high"
                else:
                    actions.append({
                        "action": "whatsapp_reminder",
                        "description": "Send WhatsApp reminder with campus visit schedule",
                        "medium": "whatsapp",
                        "priority": "high",
                        "urgency": "urgent",
                    })
                    urgency = "high"

            elif status == "APPLIED":
                if days_since_last < 3:
                    actions.append({
                        "action": "test_schedule",
                        "description": "Send test/interview schedule details",
                        "medium": "email",
                        "priority": "high",
                    })
                elif days_since_last < 7:
                    actions.append({
                        "action": "test_reminder",
                        "description": "Reminder about upcoming test/interview",
                        "medium": "whatsapp",
                        "priority": "high",
                        "urgency": "urgent",
                    })
                    urgency = "high"

            elif status == "SHORTLISTED":
                conversion_prob = enquiry_data.get("conversion_probability", 0.5)
                if conversion_prob > 0.7:
                    actions.append({
                        "action": "send_offer",
                        "description": "Send admission offer letter",
                        "medium": "email",
                        "priority": "critical",
                        "urgency": "urgent",
                    })
                    urgency = "critical"
                else:
                    actions.append({
                        "action": "counsellor_call",
                        "description": "Counselor personal call to address concerns",
                        "medium": "phone",
                        "priority": "high",
                        "urgency": "urgent",
                    })
                    urgency = "high"

            elif status == "ADMITTED":
                actions.append({
                    "action": "collect_documents",
                    "description": "Initiate document collection and verification",
                    "medium": "phone",
                    "priority": "high",
                })
                actions.append({
                    "action": "fee_discussion",
                    "description": "Discuss fee payment schedule and options",
                    "medium": "phone",
                    "priority": "high",
                })

            # Parent engagement adjustment
            parent_type = enquiry_data.get("parent_type", "neutral")
            if parent_type == "disengaged" and days_since_last > 5:
                actions.append({
                    "action": "personalized_engagement",
                    "description": "Director/Principal personal touch email",
                    "medium": "email",
                    "priority": "high",
                    "urgency": "urgent",
                })
                urgency = "high"

            # Time-based escalation
            if days_since_start > 30 and status in ["INQUIRY", "APPLIED"]:
                actions.append({
                    "action": "escalate_to_principal",
                    "description": "30+ days with no progression - escalate to principal",
                    "medium": "phone",
                    "priority": "critical",
                    "urgency": "urgent",
                })
                urgency = "critical"

            return {
                "enquiry_id": enquiry_data.get("enquiry_id"),
                "suggested_actions": actions,
                "primary_action": actions[0] if actions else self._default_action(status),
                "urgency_level": urgency,
                "optimal_contact_time": self._suggest_contact_time(enquiry_data),
                "communication_channels": self._suggest_channels(status),
                "expected_outcome": self._expected_outcome(status, enquiry_data),
            }
        except Exception as e:
            logger.error(f"Error suggesting admission followup: {str(e)}")
            return {
                "enquiry_id": enquiry_data.get("enquiry_id"),
                "error": str(e),
            }

    def suggest_fee_followup(
        self,
        student_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Suggest next follow-up action for fee payment
        
        Args:
            student_data:
                - student_id: str
                - days_overdue: int
                - outstanding_amount: float
                - default_risk_probability: float
                - days_since_last_reminder: int
                - reminder_count: int
                - fee_month: str
                - parent_communication_score: float
        
        Returns:
            Dictionary with suggested actions
        """
        try:
            actions = []
            urgency = "normal"

            days_overdue = student_data.get("days_overdue", 0)
            risk_prob = student_data.get("default_risk_probability", 0.5)
            days_since_reminder = student_data.get("days_since_last_reminder", 0)
            reminder_count = student_data.get("reminder_count", 0)

            if days_overdue == 0:
                # Payment not yet due
                if int(float(student_data.get("days_till_due", 0))) <= 7:
                    actions.append({
                        "action": "advance_reminder",
                        "description": "Send advance payment reminder (due in 7 days)",
                        "medium": "whatsapp",
                        "priority": "low",
                    })

            elif days_overdue <= 5:
                # Just overdue
                actions.append({
                    "action": "courtesy_reminder",
                    "description": "Send courteous payment reminder",
                    "medium": "whatsapp",
                    "priority": "medium",
                })

            elif days_overdue <= 15:
                # Moderately overdue
                actions.append({
                    "action": "payment_reminder",
                    "description": "Send WhatsApp and Email payment reminder",
                    "medium": "whatsapp_email",
                    "priority": "high",
                    "urgency": "urgent",
                })
                urgency = "high"

            elif days_overdue <= 30:
                # Significantly overdue
                if reminder_count < 3:
                    actions.append({
                        "action": "urgent_reminder",
                        "description": "Urgent reminder with payment link and discount offer",
                        "medium": "whatsapp_phone",
                        "priority": "high",
                        "urgency": "urgent",
                    })
                else:
                    actions.append({
                        "action": "counsellor_call",
                        "description": "Counselor call to discuss payment plan",
                        "medium": "phone",
                        "priority": "critical",
                        "urgency": "urgent",
                    })
                    urgency = "critical"

            elif days_overdue <= 60:
                # Severely overdue
                actions.append({
                    "action": "office_call",
                    "description": "Office staff call to discuss hardship and plan",
                    "medium": "phone",
                    "priority": "critical",
                    "urgency": "urgent",
                })
                actions.append({
                    "action": "flexible_payment_plan",
                    "description": "Offer flexible payment plan with installments",
                    "medium": "email_phone",
                    "priority": "critical",
                })
                urgency = "critical"

            else:
                # Extremely overdue - potential legal action
                actions.append({
                    "action": "director_escalation",
                    "description": "Director/Principal intervention required",
                    "medium": "phone",
                    "priority": "critical",
                    "urgency": "critical",
                })
                actions.append({
                    "action": "legal_notice",
                    "description": "Prepare for formal legal notice if appropriate",
                    "medium": "letter",
                    "priority": "critical",
                })
                urgency = "critical"

            # Risk-based adjustments
            if risk_prob > 0.7 and days_overdue < 30:
                actions.append({
                    "action": "prevent_default",
                    "description": "Personalized intervention to prevent default",
                    "medium": "phone",
                    "priority": "critical",
                    "urgency": "urgent",
                })
                urgency = "critical"

            return {
                "student_id": student_data.get("student_id"),
                "suggested_actions": actions,
                "primary_action": actions[0] if actions else self._default_fee_action(),
                "urgency_level": urgency,
                "suggested_contact_time": self._suggest_fee_contact_time(days_overdue),
                "communication_channels": self._suggest_fee_channels(days_overdue),
                "success_probability": self._estimate_collection_probability(risk_prob, days_overdue),
            }
        except Exception as e:
            logger.error(f"Error suggesting fee followup: {str(e)}")
            return {
                "student_id": student_data.get("student_id"),
                "error": str(e),
            }

    def _default_action(self, status: str) -> Dict[str, str]:
        """Default action for given status"""
        defaults = {
            "INQUIRY": {
                "action": "send_brochure",
                "description": "Send school information",
                "medium": "email",
            },
            "APPLIED": {
                "action": "test_schedule",
                "description": "Send test schedule",
                "medium": "email",
            },
            "SHORTLISTED": {
                "action": "counsellor_call",
                "description": "Schedule counselor discussion",
                "medium": "phone",
            },
            "ADMITTED": {
                "action": "collect_documents",
                "description": "Collect required documents",
                "medium": "phone",
            },
        }
        return defaults.get(status, {"action": "follow_up", "description": "Follow up", "medium": "email"})

    def _default_fee_action(self) -> Dict[str, str]:
        """Default fee follow-up action"""
        return {
            "action": "reminder",
            "description": "Send payment reminder",
            "medium": "whatsapp",
        }

    def _suggest_contact_time(self, enquiry_data: Dict[str, Any]) -> str:
        """Suggest optimal contact time"""
        now = datetime.now()
        
        # Morning calls better for engaged parents
        if enquiry_data.get("parent_type") == "engaged":
            return "9:00 AM - 11:00 AM (weekday)"
        
        # Evening calls better for working parents
        return "6:00 PM - 8:00 PM (weekday)"

    def _suggest_fee_contact_time(self, days_overdue: int) -> str:
        """Suggest optimal fee collection contact time"""
        if days_overdue <= 15:
            return "Morning (9-11 AM) - less intrusive"
        else:
            return "Evening (6-8 PM) after work - better availability"

    def _suggest_channels(self, status: str) -> List[str]:
        """Suggest communication channels"""
        channels_map = {
            "INQUIRY": ["email", "whatsapp", "phone"],
            "APPLIED": ["whatsapp", "phone", "email"],
            "SHORTLISTED": ["phone", "email"],
            "ADMITTED": ["phone", "email", "whatsapp"],
        }
        return channels_map.get(status, ["email", "whatsapp"])

    def _suggest_fee_channels(self, days_overdue: int) -> List[str]:
        """Suggest communication channels for fee follow-up"""
        if days_overdue == 0:
            return ["whatsapp"]
        elif days_overdue <= 15:
            return ["whatsapp", "email"]
        elif days_overdue <= 30:
            return ["whatsapp", "phone", "email"]
        else:
            return ["phone", "email", "whatsapp"]

    def _expected_outcome(self, status: str, enquiry_data: Dict[str, Any]) -> str:
        """Expected outcome of suggested action"""
        conversion_prob = enquiry_data.get("conversion_probability", 0.5)
        
        if conversion_prob > 0.7:
            return "High probability of admission (70%+)"
        elif conversion_prob > 0.4:
            return "Medium probability of admission (40-70%)"
        else:
            return "Low probability of admission (<40%)"

    def _estimate_collection_probability(self, risk_prob: float, days_overdue: int) -> float:
        """Estimate probability of successful fee collection"""
        base_prob = 1 - risk_prob
        
        # Decay based on days overdue
        days_factor = max(1 - (days_overdue / 365), 0.2)
        
        return round(base_prob * days_factor, 3)


# Global instance
followup_engine = FollowUpSuggestionEngine()
