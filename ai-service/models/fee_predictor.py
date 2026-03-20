"""
Fee default prediction model
Predicts likelihood of student defaulting on fee payments
"""

import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)


class FeeDefaultPredictor:
    """
    Machine learning model for predicting fee payment defaults
    
    Prediction factors:
    - Payment history (on-time, late, defaults)
    - Days overdue
    - Total outstanding amount
    - Student class (socioeconomic proxy)
    - Parent communication responsiveness
    - Previous arrears
    - Economic indicators
    """

    def __init__(self):
        """Initialize the model"""
        self.model_name = "fee_default_predictor_v1"
        self.feature_names = [
            "payment_history_score",
            "days_overdue",
            "outstanding_amount",
            "class_level",
            "parent_responsiveness",
            "arrears_count",
            "payment_frequency",
            "economic_status",
        ]

    def predict_default_risk(
        self,
        student_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Predict probability of fee default
        
        Args:
            student_data: Dictionary containing student and fee information
                - student_id: String
                - class_level: int (1-12)
                - days_overdue: int (current overdue days)
                - outstanding_amount: float (rupees)
                - total_expected_fees: float (annual fees)
                - payment_history: List[str] (on_time, late_1_30, late_30_60, default)
                - parent_communication_score: float (0-1)
                - previous_arrears_count: int
                - admission_method: String (merit, scholarship, paying)
                - parent_occupation: String (business, service, education, other)
        
        Returns:
            Dictionary with prediction results
        """
        try:
            # Extract features
            features = self._extract_features(student_data)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(features, student_data)
            
            # Apply temporal adjustment
            risk_score = self._apply_temporal_adjustment(
                risk_score,
                student_data.get("days_overdue", 0),
            )
            risk_score = max(0, min(1, risk_score))  # Clamp between 0 and 1
            
            # Generate intervention recommendations
            interventions = self._generate_interventions(risk_score, student_data)
            
            return {
                "student_id": student_data.get("student_id"),
                "default_risk_probability": round(risk_score, 3),
                "confidence_score": self._calculate_confidence(features),
                "risk_level": self._assess_risk_level(risk_score),
                "reason_for_risk": interventions["primary_reason"],
                "risk_factors": interventions["risk_factors"],
                "intervention_type": interventions["intervention_type"],
                "suggested_action": interventions["suggested_action"],
                "expected_recovery_days": self._estimate_recovery_days(
                    risk_score,
                    student_data.get("days_overdue", 0),
                ),
            }
        except Exception as e:
            logger.error(f"Error in default prediction: {str(e)}")
            return {
                "student_id": student_data.get("student_id"),
                "default_risk_probability": 0.5,
                "confidence_score": 0.0,
                "error": str(e),
            }

    def _extract_features(self, student_data: Dict[str, Any]) -> np.ndarray:
        """Extract and normalize features for prediction"""
        features = []

        # Payment history score (perfect = 0, default = 1)
        history = student_data.get("payment_history", [])
        default_count = history.count("default")
        late_60_count = history.count("late_30_60") + history.count("late_60")
        late_30_count = history.count("late_1_30")

        history_score = min(
            (default_count * 0.5 + late_60_count * 0.3 + late_30_count * 0.1) / max(len(history), 1) if history else 0,
            1,
        )
        features.append(history_score)

        # Days overdue (0 to extreme, normalized)
        days_overdue = min(student_data.get("days_overdue", 0), 365) / 365
        features.append(days_overdue * 0.8)  # More weight on current overdue

        # Outstanding amount vs total expected (higher is worse)
        outstanding = student_data.get("outstanding_amount", 0)
        expected = student_data.get("total_expected_fees", 1)
        amount_ratio = min(outstanding / max(expected, 1), 1)
        features.append(amount_ratio)

        # Class level (higher class = better ability to pay)
        class_level = student_data.get("class_level", 6)
        class_score = (class_level / 12)  # Normalize to 0-1
        features.append(1 - class_score * 0.3)  # Higher class = lower risk

        # Parent responsiveness (higher = better)
        parent_resp = student_data.get("parent_communication_score", 0.5)
        features.append(1 - min(parent_resp, 1) * 0.6)

        # Previous arrears (count)
        arrears = min(student_data.get("previous_arrears_count", 0), 5) / 5
        features.append(arrears * 0.7)

        # Payment frequency regularity (inferred from history)
        history = student_data.get("payment_history", [])
        if history:
            on_time = history.count("on_time")
            regularity = on_time / len(history)
            features.append(1 - regularity * 0.5)
        else:
            features.append(0.5)

        # Economic status indicator
        occupation = student_data.get("parent_occupation", "other")
        admission = student_data.get("admission_method", "paying")
        
        econ_score = 0.5
        if admission == "scholarship":
            econ_score = 0.8  # Higher risk
        elif occupation in ["business", "service"]:
            econ_score = 0.3  # Lower risk
        elif occupation == "education":
            econ_score = 0.2  # Very low risk
            
        features.append(econ_score)

        return np.array(features)

    def _calculate_risk_score(
        self,
        features: np.ndarray,
        student_data: Dict[str, Any],
    ) -> float:
        """Calculate the default risk score"""
        # Feature weights
        weights = np.array([
            0.25,  # Payment history (most important)
            0.25,  # Days overdue (current delinquency)
            0.15,  # Outstanding amount
            0.10,  # Class level
            0.10,  # Parent responsiveness
            0.08,  # Previous arrears
            0.04,  # Payment frequency
            0.03,  # Economic status
        ])

        weights = weights / weights.sum()
        score = np.dot(features, weights)

        # Exponential boost if already in default
        if student_data.get("days_overdue", 0) > 60:
            score *= 1.5
        elif student_data.get("days_overdue", 0) > 30:
            score *= 1.3

        return float(score)

    def _apply_temporal_adjustment(self, score: float, days_overdue: int) -> float:
        """Apply temporal adjustment based on duration of overduecy"""
        if days_overdue > 180:
            return min(score * 1.8, 1.0)  # Likely to default
        elif days_overdue > 90:
            return min(score * 1.5, 1.0)
        elif days_overdue > 30:
            return min(score * 1.2, 1.0)
        return score

    def _calculate_confidence(self, features: np.ndarray) -> float:
        """Calculate confidence in the prediction"""
        # Confidence based on complete data
        confidence = min(np.count_nonzero(features) / len(features), 1.0)
        return round(confidence, 2)

    def _assess_risk_level(self, probability: float) -> str:
        """Assess the risk level"""
        if probability >= 0.7:
            return "critical"
        elif probability >= 0.5:
            return "high"
        elif probability >= 0.3:
            return "medium"
        else:
            return "low"

    def _generate_interventions(
        self,
        risk_score: float,
        student_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate intervention recommendations"""
        risk_factors = []
        primary_reason = ""
        intervention_type = ""
        suggested_action = ""

        days_overdue = student_data.get("days_overdue", 0)
        history = student_data.get("payment_history", [])

        # Identify risk factors
        if days_overdue > 60:
            risk_factors.append("Severely overdue (60+ days)")
            primary_reason = "Extended non-payment"

        if days_overdue > 30:
            risk_factors.append("Overdue for 30+ days")
            if not primary_reason:
                primary_reason = "Prolonged payment delay"

        if "default" in history:
            risk_factors.append("Previous default history")
            if not primary_reason:
                primary_reason = "Past default history"

        if student_data.get("parent_communication_score", 1) < 0.3:
            risk_factors.append("Low parent communication")
            if not primary_reason:
                primary_reason = "Poor communication"

        if student_data.get("admission_method") == "scholarship":
            risk_factors.append("Scholarship student (potential difficulty)")

        # Determine intervention type
        if risk_score >= 0.7:
            intervention_type = "urgent"
            suggested_action = "Immediate director/principal contact required. Assess financial hardship and offer payment plan."
        elif risk_score >= 0.5:
            intervention_type = "escalated"
            suggested_action = "Counselor follow-up with payment plan proposal. Flexible payment options recommended."
        elif risk_score >= 0.3:
            intervention_type = "preventive"
            suggested_action = "Send payment reminder. Offer fee concession or installment plan."
        else:
            intervention_type = "monitoring"
            suggested_action = "Continue regular follow-up. Monitor payment patterns."

        return {
            "primary_reason": primary_reason or "Elevated default risk",
            "risk_factors": risk_factors or ["General payment concerns"],
            "intervention_type": intervention_type,
            "suggested_action": suggested_action,
        }

    def _estimate_recovery_days(self, risk_score: float, days_overdue: int) -> int:
        """Estimate days to recovery (payment) with intervention"""
        base_recovery = max(7, int(days_overdue / 10))
        
        if risk_score >= 0.7:
            return int(base_recovery * 2.5)  # Takes longer
        elif risk_score >= 0.5:
            return int(base_recovery * 1.8)
        elif risk_score >= 0.3:
            return int(base_recovery * 1.2)
        else:
            return base_recovery


# Global instance
fee_predictor = FeeDefaultPredictor()
