"""
Smart message generation engine
AI-powered personalized communication generator for parents and students
"""

import logging
import random
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class MessageGenerationEngine:
    """
    Generates personalized, contextual messages for various school scenarios
    Uses template-based generation with dynamic variable substitution
    """

    def __init__(self):
        """Initialize the engine"""
        self.model_name = "message_generation_v1"
        
        # Message templates
        self.templates = self._init_templates()

    def generate_enquiry_response(
        self,
        enquiry_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate personalized enquiry acknowledgement message
        
        Args:
            enquiry_data:
                - candidate_name: str
                - school_name: str
                - enquiry_type: str
                - preferred_class: str
                - parent_name: str
        
        Returns:
            Dictionary with personalized messages
        """
        try:
            candidate = enquiry_data.get("candidate_name", "there")
            parent_name = enquiry_data.get("parent_name", "")
            school = enquiry_data.get("school_name", "Our School")
            class_name = enquiry_data.get("preferred_class", "Class X")

            # Generate WhatsApp message
            whatsapp_msg = f"""Thank you for your interest in {school}!

We're excited to connect with {candidate}'s family. {parent_name if parent_name else "Dear Parent"}, we believe {school} is the perfect place for {candidate}'s holistic development.

Our counsellor will contact you shortly to discuss:
✓ Academic programs for {class_name}
✓ Entrance test details
✓ Fee structure and scholarships

Looking forward to welcoming your family! 🎓"""

            # Generate Email subject and body
            email_subject = f"Welcome to {school} - Admission Enquiry Response"
            email_body = f"""Dear {parent_name if parent_name else "Parent"},

Thank you for showing interest in {school} for {candidate}'s education.

We are thrilled to hear about your interest and would love to help {candidate} reach their full potential. Our school has a proven track record of academic excellence, character development, and holistic education.

Key Highlights of {school}:
• State-of-the-art facilities and infrastructure
• Highly qualified and experienced faculty
• Focus on both academics and extracurricular activities
• Personalized attention to each student
• Strong alumni network

Next Steps:
1. Our admissions counsellor will contact you within 24 hours
2. Schedule a campus tour (flexible timing)
3. Discuss {class_name} curriculum and fees
4. Entrance test guidelines (if applicable)

Contact Details:
Email: admissions@{school.lower().replace(" ", "")}.com
Phone: +91-XXXXXXXXXX

Best regards,
Admissions Team
{school}"""

            return {
                "enquiry_id": enquiry_data.get("enquiry_id"),
                "whatsapp_message": whatsapp_msg,
                "email": {
                    "subject": email_subject,
                    "body": email_body,
                },
                "message_tone": "welcoming",
                "personalization_score": self._calculate_personalization(enquiry_data),
            }
        except Exception as e:
            logger.error(f"Error generating enquiry response: {str(e)}")
            return {"error": str(e)}

    def generate_admission_offer(
        self,
        admission_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate personalized admission offer letter
        
        Args:
            admission_data:
                - student_name: str
                - parent_name: str
                - class_name: str
                - school_name: str
                - admission_date: str
                - scholarship_amount: float (if any)
        
        Returns:
            Dictionary with offer letter and messages
        """
        try:
            student = admission_data.get("student_name", "Dear Student")
            parent = admission_data.get("parent_name", "Dear Parent")
            school = admission_data.get("school_name", "Our School")
            class_name = admission_data.get("class_name", "")
            admission_date = admission_data.get("admission_date", "Soon")
            scholarship = admission_data.get("scholarship_amount", 0)

            # WhatsApp congratulations
            whatsapp_msg = f"""Congratulations! 🎉

Great news, {student}! {parent}, we are delighted to offer admission to {student} in {class_name} at {school}.

Your child has demonstrated excellent qualities and we look forward to nurturing their academic and personal growth.

Offer Valid Until: March 31, 2024
Classes Commence: April 1, 2024

Next Steps:
1. Accept the offer by replying to this message
2. Complete document submission (within 7 days)
3. Fee payment (flexible options available)

We're excited to welcome your family! 📚"""

            # Email offer letter
            email_body = f"""Dear {parent},

Re: ADMISSION OFFER - {student} for {class_name}

We are proud to offer admission to {student} for {class_name} at {school}.

OFFER DETAILS
=============
Student Name: {student}
Class: {class_name}
Academic Year: 2024-2025
Admission Fee: ₹5,000 (can be adjusted against first month fee)
Monthly Fees: ₹15,000 (flexible payment options available)
"""
            if scholarship > 0:
                email_body += f"Scholarship: ₹{scholarship}/month\n"

            email_body += f"""
DOCUMENTS REQUIRED
==================
1. Birth Certificate (original + 2 copies)
2. Previous School Transfer Certificate
3. Progress Report from last school
4. Two recent passport-size photographs
5. Copy of parents' ID proof

REPORTING DATE
==============
Classes commence on April 1, 2024
Please report by March 28, 2024 for registration

PAYMENT OPTIONS
===============
• Full annual payment: ₹180,000
• Quarterly: ₹45,000 x 4
• Monthly: ₹15,000 x 12

Please confirm acceptance within 7 days. 

Looking forward to welcoming {student}!

Regards,
Admissions Team
{school}"""

            return {
                "admission_id": admission_data.get("admission_id"),
                "whatsapp_message": whatsapp_msg,
                "email": {
                    "subject": f"Admission Offer - {student} ({class_name})",
                    "body": email_body,
                },
                "formal_offer_letter": self._generate_formal_letter(admission_data),
                "message_tone": "congratulatory",
            }
        except Exception as e:
            logger.error(f"Error generating admission offer: {str(e)}")
            return {"error": str(e)}

    def generate_fee_reminder(
        self,
        student_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate personalized fee payment reminder
        
        Args:
            student_data:
                - student_name: str
                - parent_name: str
                - outstanding_amount: float
                - due_date: str
                - days_overdue: int (0 if not yet due)
        
        Returns:
            Dictionary with reminder messages
        """
        try:
            student = student_data.get("student_name", "your child")
            parent = student_data.get("parent_name", "Dear Parent")
            amount = student_data.get("outstanding_amount", 0)
            due_date = student_data.get("due_date", "")
            days_overdue = student_data.get("days_overdue", 0)

            # Tone based on overdue status
            if days_overdue == 0:
                tone = "courteous"
                template = self.templates.get("fee_reminder_upcoming", {})
                opening = f"Payment due on {due_date}"
            elif days_overdue <= 15:
                tone = "gentle_reminder"
                template = self.templates.get("fee_reminder_gentle", {})
                opening = "Gentle reminder"
            elif days_overdue <= 30:
                tone = "urgent_reminder"
                template = self.templates.get("fee_reminder_urgent", {})
                opening = "Urgent payment required"
            else:
                tone = "escalated"
                template = self.templates.get("fee_reminder_escalated", {})
                opening = "Immediate action required"

            # WhatsApp message
            whatsapp = f"""{opening}

Dear {parent},

This is a friendly reminder that {student}'s school fees of ₹{int(amount)} {f"for {due_date}" if days_overdue == 0 else f"were due on {due_date}"}.

Payment Options:
💳 Online: [Payment Link]
🏦 Bank Transfer: [Account Details]
💵 Cash: Visit school office

For any queries or to discuss payment plans, please contact us:
📞 +91-XXXXXXXXXX
📧 fees@school.com

Thank you for your prompt attention.
{student}'s School"""

            # Email message
            email_body = f"""Dear {parent},

{opening} - Action Required

We would like to remind you that {student}'s school fees for the current month are now {f"due on {due_date}" if days_overdue == 0 else f"overdue (due date: {due_date}"}.

Amount Outstanding: ₹{int(amount)}

We understand that sometimes payments can be overlooked. To make it convenient for you, we offer multiple payment options:

1. Online Payment: Visit our school portal and pay directly
2. Bank Transfer: [Provide account details]
3. Check/DD: Post-dated checks accepted
4. Cash Payment: Pay at the school office (9 AM - 4 PM)
5. Installment Plan: [Contact office for flexible payment options]

Your timely payment helps us maintain the quality of education and facilities at our school.

If you're facing financial difficulties, please get in touch with our office. We're here to help find suitable solutions.

Receipt will be sent immediately upon payment.

Contact: admissions@school.com | +91-XXXXXXXXXX

Best regards,
Accounts Team
{student}'s School"""

            return {
                "student_id": student_data.get("student_id"),
                "whatsapp_message": whatsapp,
                "email": {
                    "subject": f"School Fee Reminder - {student} - ₹{int(amount)} Outstanding",
                    "body": email_body,
                },
                "message_tone": tone,
                "escalation_level": self._determine_escalation_level(days_overdue),
            }
        except Exception as e:
            logger.error(f"Error generating fee reminder: {str(e)}")
            return {"error": str(e)}

    def generate_achievement_notification(
        self,
        achievement_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate personalized achievement/performance notification
        
        Args:
            achievement_data:
                - student_name: str
                - parent_name: str
                - achievement: str (e.g., "Top 5 in class", "Science Olympiad Winner")
                - class_name: str
                - achievement_date: str
        
        Returns:
            Dictionary with reward messages
        """
        try:
            student = achievement_data.get("student_name", "your child")
            parent = achievement_data.get("parent_name", "Dear Parent")
            achievement = achievement_data.get("achievement", "excellent performance")
            class_name = achievement_data.get("class_name", "")

            whatsapp = f"""Wonderful News! 🌟

Dear {parent},

We're thrilled to inform you that {student} has achieved {achievement}!

This is a testament to {student}'s hard work, dedication, and the support you provide at home. We're proud to have {student} in our {class_name}.

Please visit the school to collect the achievement certificate.

Keep up the wonderful work, {student}! 📚✨"""

            email_body = f"""Dear {parent},

Congratulations! 🎉

We are delighted to inform you that {student} has achieved {achievement}.

This recognizes the dedication and effort {student} has put into their studies. Such achievements inspire not only the student but also motivate the entire school community.

We encourage you to celebrate this moment with {student}. This recognition will boost {student}'s confidence and motivation for future endeavors.

Certificate Details:
• Student: {student}
• Class: {class_name}
• Achievement: {achievement}
• Date: {achievement_data.get("achievement_date", "")}

Keep supporting {student}'s learning journey. We look forward to witnessing more such achievements!

Warm regards,
Academic Team
{student}'s School"""

            return {
                "student_id": achievement_data.get("student_id"),
                "whatsapp_message": whatsapp,
                "email": {
                    "subject": f"Achievement Recognition - {student} 🌟",
                    "body": email_body,
                },
                "message_tone": "celebratory",
            }
        except Exception as e:
            logger.error(f"Error generating achievement notification: {str(e)}")
            return {"error": str(e)}

    def _init_templates(self) -> Dict[str, Dict[str, str]]:
        """Initialize message templates"""
        return {
            "fee_reminder_upcoming": {
                "subject": "Friendly Reminder - Fee Payment Due",
                "tone": "courteous",
            },
            "fee_reminder_gentle": {
                "subject": "Gentle Reminder - Outstanding Fees",
                "tone": "gentle",
            },
            "fee_reminder_urgent": {
                "subject": "Urgent - Fee Payment Required",
                "tone": "urgent",
            },
            "fee_reminder_escalated": {
                "subject": "Immediate Action Required - Fee Payment",
                "tone": "formal",
            },
        }

    def _calculate_personalization(self, data: Dict[str, Any]) -> float:
        """Calculate personalization score (0-1)"""
        score = 0.7  # Base score
        
        if data.get("candidate_name"):
            score += 0.1
        if data.get("parent_name"):
            score += 0.1
        if data.get("preferred_class"):
            score += 0.1
            
        return min(score, 1.0)

    def _determine_escalation_level(self, days_overdue: int) -> str:
        """Determine escalation level based on days overdue"""
        if days_overdue == 0:
            return "advance_reminder"
        elif days_overdue <= 15:
            return "gentle_reminder"
        elif days_overdue <= 30:
            return "urgent_reminder"
        else:
            return "escalated_to_management"

    def _generate_formal_letter(self, admission_data: Dict[str, Any]) -> str:
        """Generate formal offer letter"""
        student = admission_data.get("student_name", "")
        school = admission_data.get("school_name", "")
        class_name = admission_data.get("class_name", "")
        
        return f"""
ADMISSION OFFER LETTER

Date: {admission_data.get("offer_date", "March 19, 2024")}

To,
{admission_data.get("parent_name", "")}
[Address]

RE: OFFER OF ADMISSION

Dear Sir/Madam,

We are pleased to offer admission to {student} in {class_name} for the academic year 2024-2025.

Based on the assessment conducted, we find that {student} meets our admission standards and will be a valuable addition to our school community.

[Standard offer terms and conditions]

This offer is valid until March 31, 2024.

Yours sincerely,

Principal
{school}"""


# Global instance
message_generator = MessageGenerationEngine()
