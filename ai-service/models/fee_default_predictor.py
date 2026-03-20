"""
Fee Default Prediction Model
Predicts the probability of student fee default based on payment history and parent behavior
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)


class FeeDefaultPredictionModel:
    """
    Predicts probability of fee payment default
    
    Factors considered:
    - Days overdue
    - Payment history
    - Communication responsiveness
    - Income and payment capability
    - Frequency of reminders
    - Seasonal factors
    - Student performance (linked to motivation)
    """
    
    def __init__(self):
        """Initialize the model"""
        self.model_name = "fee_default_prediction_v1"
    
    def predict_default_probability(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict probability of fee payment default
        
        Args:
            student_data: Dictionary with student fee information
                - student_id: str
                - days_overdue: int (0 if not yet due)
                - outstanding_amount: float
                - original_fee_amount: float
                - default_risk_probability: float (historical risk)
                - days_since_last_reminder: int
                - reminder_count: int
                - previous_defaults: int (count of past defaults)
                - payment_history_score: float (0-1, based on past payments)
                - parent_communication_score: float (0-1, responsiveness)
                - family_income_range: str (low, medium, high)
                - fee_month: str (which fee - Jan, Feb, etc)
                - current_month: int (current month 1-12)
                - student_performance: float (0-100)
                - fees_paid_on_time_count: int
                - total_fee_instances: int
        
        Returns:
            Dictionary with default risk prediction
        """
        try:
            # Extract features
            features = self._extract_features(student_data)
            
            # Calculate base default risk
            base_risk = self._calculate_base_risk(features, student_data)
            
            # Apply adjustments
            adjusted_risk = self._apply_risk_adjustments(base_risk, features, student_data)
            
            # Ensure risk is between 0 and 1
            adjusted_risk = max(0.0, min(1.0, adjusted_risk))
            
            # Get risk level and recommendations
            risk_level = self._get_risk_level(adjusted_risk)
            action_urgency = self._get_action_urgency(adjusted_risk, student_data)
            recommendations = self._get_default_prevention_recommendations(adjusted_risk, features, student_data)
            
            return {
                "student_id": student_data.get("student_id"),
                "default_probability": round(adjusted_risk, 3),
                "default_probability_percentage": round(adjusted_risk * 100, 1),
                "risk_level": risk_level,
                "action_urgency": action_urgency,
                "collection_difficulty": self._estimate_collection_difficulty(adjusted_risk, features),
                "days_until_critical": self._estimate_critical_days(student_data.get("days_overdue", 0)),
                "recommendations": recommendations,
                "confidence_score": self._calculate_confidence(student_data),
                "payment_probability": round(1.0 - adjusted_risk, 3),
                "component_risks": {
                    "overdue_risk": self._score_overdue_risk(student_data),
                    "historical_risk": self._score_historical_risk(student_data),
                    "responsiveness_risk": self._score_responsiveness_risk(features),
                    "financial_capacity_risk": self._score_financial_capacity_risk(student_data),
                },
                "suggested_actions": self._suggest_collection_actions(adjusted_risk, student_data),
            }
        
        except Exception as e:
            logger.error(f"Error predicting default: {str(e)}")
            return {
                "student_id": student_data.get("student_id"),
                "error": str(e),
                "default_probability": 0.5,
            }
    
    def batch_risk_assessment(self, students: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Assess default risk for multiple students
        
        Args:
            students: List of student fee data
        
        Returns:
            Batch assessment with statistics and prioritized list
        """
        results = []
        critical_risk = 0
        high_risk = 0
        medium_risk = 0
        low_risk = 0
        
        total_at_risk_amount = 0.0
        
        for student in students:
            risk_result = self.predict_default_probability(student)
            results.append(risk_result)
            
            if "default_probability" in risk_result:
                risk = risk_result["default_probability"]
                outstanding = student.get("outstanding_amount", 0)
                
                if risk >= 0.9:
                    critical_risk += 1
                    total_at_risk_amount += outstanding
                elif risk >= 0.7:
                    high_risk += 1
                    total_at_risk_amount += outstanding
                elif risk >= 0.4:
                    medium_risk += 1
                elif risk >= 0.2:
                    low_risk += 1
        
        # Sort by risk (highest first)
        prioritized = sorted(results, key=lambda x: x.get("default_probability", 0), reverse=True)
        
        return {
            "total_students": len(students),
            "assessed": len(results),
            "risk_distribution": {
                "critical_risk": critical_risk,
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "low_risk": low_risk,
            },
            "financial_risk": {
                "total_amount_at_risk": round(total_at_risk_amount, 2),
                "critical_amount": round(
                    sum(s.get("outstanding_amount", 0) for r in prioritized[:critical_risk] 
                        for s in [students[results.index(r)]] if r.get("default_probability", 0) >= 0.9),
                    2
                ),
            },
            "results": results,
            "prioritized_for_collection": [
                {
                    "rank": idx + 1,
                    "student_id": r.get("student_id"),
                    "default_probability": r.get("default_probability"),
                    "risk_level": r.get("risk_level"),
                    "action_urgency": r.get("action_urgency"),
                }
                for idx, r in enumerate(prioritized[:20])  # Top 20 students
            ],
        }
    
    # ==================== RISK CALCULATION ====================
    
    def _extract_features(self, student_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract normalized features"""
        return {
            "days_overdue_normalized": min(student_data.get("days_overdue", 0), 90) / 90,
            "communication_score": student_data.get("parent_communication_score", 0.5),
            "payment_history": student_data.get("payment_history_score", 0.5),
            "financial_capacity": self._assess_financial_capacity(student_data),
            "reminder_effectiveness": min(student_data.get("reminder_count", 0), 5) / 5,
        }
    
    def _calculate_base_risk(self, features: Dict[str, float], student_data: Dict[str, Any]) -> float:
        """Calculate base default risk"""
        base_risk = 0.5  # Start with neutral
        
        # Days overdue is significant indicator
        days_overdue = student_data.get("days_overdue", 0)
        if days_overdue > 60:
            base_risk += 0.35
        elif days_overdue > 30:
            base_risk += 0.25
        elif days_overdue > 15:
            base_risk += 0.15
        elif days_overdue > 5:
            base_risk += 0.08
        else:
            base_risk -= 0.10
        
        # Communication responsiveness
        comm_score = features["communication_score"]
        if comm_score < 0.3:
            base_risk += 0.20
        elif comm_score < 0.5:
            base_risk += 0.10
        elif comm_score > 0.8:
            base_risk -= 0.10
        
        # Payment history
        payment_hist = features["payment_history"]
        if payment_hist < 0.3:
            base_risk += 0.25
        elif payment_hist > 0.8:
            base_risk -= 0.15
        
        # Financial capacity
        financial = features["financial_capacity"]
        if financial < 0.3:
            base_risk += 0.20
        elif financial > 0.7:
            base_risk -= 0.10
        
        return base_risk
    
    def _apply_risk_adjustments(self, base_risk: float, features: Dict[str, float], 
                               student_data: Dict[str, Any]) -> float:
        """Apply special adjustments to base risk"""
        adjusted = base_risk
        
        # Previous defaults are strong indicator
        prev_defaults = student_data.get("previous_defaults", 0)
        if prev_defaults >= 3:
            adjusted += 0.30
        elif prev_defaults == 2:
            adjusted += 0.20
        elif prev_defaults == 1:
            adjusted += 0.10
        
        # Amount owed affects risk (larger amounts = higher risk)
        outstanding = student_data.get("outstanding_amount", 0)
        original = student_data.get("original_fee_amount", 0)
        if original > 0:
            proportion_overdue = outstanding / original
            if proportion_overdue > 0.8:
                adjusted += 0.15
        
        # Student performance linked to family commitment
        performance = student_data.get("student_performance", 50)
        if performance > 80:
            adjusted -= 0.10
        elif performance < 40:
            adjusted += 0.10
        
        # If no reminders sent yet, risk is lower
        reminder_count = student_data.get("reminder_count", 0)
        if reminder_count == 0:
            adjusted -= 0.10
        elif reminder_count >= 5:
            # Many reminders = harder to collect
            adjusted += 0.10
        
        return adjusted
    
    # ==================== INDIVIDUAL RISK COMPONENTS ====================
    
    def _score_overdue_risk(self, student_data: Dict[str, Any]) -> float:
        """Risk based on days overdue"""
        days_overdue = student_data.get("days_overdue", 0)
        
        if days_overdue == 0:
            return 0.0
        elif days_overdue <= 7:
            return 0.2
        elif days_overdue <= 15:
            return 0.4
        elif days_overdue <= 30:
            return 0.6
        elif days_overdue <= 60:
            return 0.8
        else:
            return 0.95
    
    def _score_historical_risk(self, student_data: Dict[str, Any]) -> float:
        """Risk based on payment history"""
        prev_defaults = student_data.get("previous_defaults", 0)
        on_time_count = student_data.get("fees_paid_on_time_count", 0)
        total_instances = student_data.get("total_fee_instances", 0)
        
        # If perfect payment history, very low risk
        if total_instances > 0 and on_time_count == total_instances and prev_defaults == 0:
            return 0.1
        
        # Previous defaults increase risk significantly
        if prev_defaults >= 3:
            return 0.9
        elif prev_defaults == 2:
            return 0.7
        elif prev_defaults == 1:
            return 0.5
        
        # Calculate success rate
        if total_instances > 0:
            success_rate = on_time_count / total_instances
            if success_rate > 0.8:
                return 0.2
            elif success_rate > 0.5:
                return 0.4
            else:
                return 0.7
        
        return 0.5
    
    def _score_responsiveness_risk(self, features: Dict[str, float]) -> float:
        """Risk based on communication responsiveness"""
        comm_score = features["communication_score"]
        
        # Higher communication score = lower risk
        return 1.0 - comm_score
    
    def _score_financial_capacity_risk(self, student_data: Dict[str, Any]) -> float:
        """Risk based on perceived financial capacity"""
        income_range = student_data.get("family_income_range", "medium").lower()
        
        if income_range == "high":
            return 0.1
        elif income_range == "medium":
            return 0.5
        else:  # low
            return 0.8
    
    # ==================== UTILITY METHODS ====================
    
    def _assess_financial_capacity(self, student_data: Dict[str, Any]) -> float:
        """Assess financial capacity from available data"""
        income = student_data.get("family_income_range", "medium").lower()
        income_map = {"high": 0.8, "medium": 0.5, "low": 0.2}
        return income_map.get(income, 0.5)
    
    def _get_risk_level(self, probability: float) -> str:
        """Get risk level from probability"""
        if probability >= 0.9:
            return "critical"
        elif probability >= 0.7:
            return "high"
        elif probability >= 0.5:
            return "medium"
        elif probability >= 0.25:
            return "low"
        else:
            return "very_low"
    
    def _get_action_urgency(self, probability: float, student_data: Dict[str, Any]) -> str:
        """Determine action urgency"""
        days_overdue = student_data.get("days_overdue", 0)
        
        if probability >= 0.9 or days_overdue > 60:
            return "immediate"
        elif probability >= 0.7 or days_overdue > 30:
            return "urgent"
        elif probability >= 0.5 or days_overdue > 15:
            return "high"
        elif probability >= 0.25:
            return "medium"
        else:
            return "low"
    
    def _estimate_collection_difficulty(self, probability: float, features: Dict[str, float]) -> str:
        """Estimate difficulty of collection"""
        if probability >= 0.8 or features["communication_score"] < 0.3:
            return "very_difficult"
        elif probability >= 0.6:
            return "difficult"
        elif probability >= 0.4:
            return "moderate"
        else:
            return "easy"
    
    def _estimate_critical_days(self, days_overdue: int) -> int:
        """Estimate days until legal action becomes necessary"""
        if days_overdue >= 90:
            return 0
        elif days_overdue >= 60:
            return 7
        elif days_overdue >= 30:
            return 14
        else:
            return 30 - days_overdue
    
    def _calculate_confidence(self, student_data: Dict[str, Any]) -> float:
        """Calculate confidence in prediction"""
        confidence = 0.5
        
        # More data = higher confidence
        if student_data.get("payment_history_score") is not None:
            confidence += 0.15
        if student_data.get("parent_communication_score") is not None:
            confidence += 0.15
        if student_data.get("previous_defaults") is not None:
            confidence += 0.10
        
        return min(confidence, 1.0)
    
    def _get_default_prevention_recommendations(self, probability: float, features: Dict[str, float],
                                               student_data: Dict[str, Any]) -> List[str]:
        """Get recommendations to prevent default"""
        recommendations = []
        
        if probability >= 0.9:
            recommendations.append("URGENT: Schedule immediate parent meeting")
            recommendations.append("Offer immediate fee restructuring/installment plan")
            recommendations.append("Explore scholarship or fee waiver options")
            recommendations.append("Alert management for possible legal proceedings")
        
        elif probability >= 0.7:
            recommendations.append("Schedule urgent parent consultation")
            recommendations.append("Discuss financial hardship and payment options")
            recommendations.append("Offer extended payment plan")
            recommendations.append("Track closely for next 7 days")
        
        elif probability >= 0.5:
            recommendations.append("Regular follow-up calls")
            recommendations.append("Provide flexible payment options")
            recommendations.append("Send detailed fee breakdown and payment schedule")
        
        else:
            recommendations.append("Maintain regular communication")
            recommendations.append("Send reminders before due dates")
        
        # Add specific recommendations
        if features["communication_score"] < 0.3:
            recommendations.append("Improve communication strategy - use multiple channels")
        
        if features["financial_capacity"] < 0.3:
            recommendations.append("Consider fee assistance/scholarship programs")
        
        return recommendations
    
    def _suggest_collection_actions(self, probability: float, student_data: Dict[str, Any]) -> List[str]:
        """Suggest specific collection actions"""
        actions = []
        days_overdue = student_data.get("days_overdue", 0)
        
        if days_overdue <= 5:
            actions.append("Send friendly payment reminder")
            actions.append("Share convenient payment methods")
        
        elif days_overdue <= 15:
            actions.append("Phone call to check payment status")
            actions.append("Offer early settlement discount")
        
        elif days_overdue <= 30:
            actions.append("Personal visit to discuss payment")
            actions.append("Set up installment payment plan")
        
        elif days_overdue <= 60:
            actions.append("Manager/Director intervention")
            actions.append("Formal payment demand notice")
            actions.append("Evaluate fee waiver/scholarship eligible")
        
        else:
            actions.append("Legal notice preparation")
            actions.append("Consider account suspension")
            actions.append("Submit to external collection agency")
        
        return actions


# Global instance
fee_default_predictor = FeeDefaultPredictionModel()
