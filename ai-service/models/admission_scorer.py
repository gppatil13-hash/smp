"""
Admission probability scoring model
Predicts likelihood of enquiry converting to admission
"""

import logging
from typing import Optional, Dict, Any, List
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class AdmissionScoringModel:
    """
    Machine learning model for predicting admission conversion probability
    
    Scoring factors:
    - Communication frequency (follow-ups)
    - Time since enquiry
    - Student test performance
    - Class availability
    - Payment capability indicators
    - Parent engagement
    """

    def __init__(self):
        """Initialize the model"""
        self.model_name = "admission_scoring_v1"
        self.feature_names = [
            "days_since_enquiry",
            "communication_frequency",
            "previous_interactions",
            "student_performance_score",
            "class_availability_score",
            "parent_engagement_score",
            "location_proximity_score",
            "payment_capability_score",
        ]

    def predict_conversion_probability(
        self,
        enquiry_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Predict probability of enquiry converting to admission
        
        Args:
            enquiry_data: Dictionary containing enquiry information
                - enquiry_id: String
                - days_since_enquiry: int (0-365)
                - communication_frequency: int (0-100, number of interactions)
                - previous_interactions: int (count of previous enquiries)
                - student_performance: float (0-100, test score or grade)
                - class_requested: String
                - class_availability: float (0-1, availability percentage)
                - parent_type: String (parent_engaged, neutral, disengaged)
                - school_area: String (urban, suburban, rural)
                - enquiry_type: String (phone, online, inperson)
        
        Returns:
            Dictionary with prediction results
        """
        try:
            # Extract features
            features = self._extract_features(enquiry_data)
            
            # Calculate base score
            score = self._calculate_base_score(features, enquiry_data)
            
            # Apply adjustments
            score = self._apply_seasonal_adjustment(score, enquiry_data.get("enquiry_month"))
            score = max(0, min(1, score))  # Clamp between 0 and 1
            
            # Generate insights
            insights = self._generate_insights(score, features, enquiry_data)
            
            return {
                "enquiry_id": enquiry_data.get("enquiry_id"),
                "conversion_probability": round(score, 3),
                "confidence_score": self._calculate_confidence(features),
                "risk_level": self._assess_risk_level(score),
                "key_factors": insights["key_factors"],
                "recommendations": insights["recommendations"],
                "next_action": insights["next_action"],
                "estimated_conversion_days": self._estimate_conversion_days(
                    score, 
                    enquiry_data.get("days_since_enquiry", 0)
                ),
            }
        except Exception as e:
            logger.error(f"Error in admission prediction: {str(e)}")
            return {
                "enquiry_id": enquiry_data.get("enquiry_id"),
                "conversion_probability": 0.5,
                "confidence_score": 0.0,
                "error": str(e),
            }

    def _extract_features(self, enquiry_data: Dict[str, Any]) -> np.ndarray:
        """Extract and normalize features for prediction"""
        features = []

        # Days since enquiry (0-365 → 0-1, closer to 0 is better for recent enquiries)
        days = min(enquiry_data.get("days_since_enquiry", 100), 365) / 365
        features.append(1 - (days * 0.5))  # Recent enquiries score higher

        # Communication frequency (0-100 → 0-1)
        comm_freq = min(enquiry_data.get("communication_frequency", 0), 100) / 100
        features.append(comm_freq * 0.8 + 0.2)  # More communication is better

        # Previous enquiries (fewer is better - new students)
        prev_enquiries = enquiry_data.get("previous_enquiries", 0)
        features.append(1 - (min(prev_enquiries, 5) / 5) * 0.3)

        # Student performance (higher is better)
        performance = min(enquiry_data.get("student_performance", 50), 100) / 100
        features.append(performance * 0.7 + 0.3)

        # Class availability (higher is better)
        class_avail = enquiry_data.get("class_availability_score", 0.5)
        features.append(min(class_avail, 1) * 0.9 + 0.1)

        # Parent engagement (high engagement is better)
        parent_type = enquiry_data.get("parent_type", "neutral")
        engagement_map = {"engaged": 0.9, "neutral": 0.5, "disengaged": 0.1}
        features.append(engagement_map.get(parent_type, 0.5))

        # Location proximity (urban is generally better)
        area = enquiry_data.get("school_area", "suburban")
        proximity_map = {"urban": 0.9, "suburban": 0.7, "rural": 0.5}
        features.append(proximity_map.get(area, 0.5))

        # Payment capability (higher is better)
        payment_ability = enquiry_data.get("payment_capability_score", 0.5)
        features.append(min(payment_ability, 1))

        return np.array(features)

    def _calculate_base_score(
        self,
        features: np.ndarray,
        enquiry_data: Dict[str, Any],
    ) -> float:
        """
        Calculate base conversion score
        Uses weighted average of features
        """
        # Weights for each feature
        weights = np.array([
            0.15,  # Days since enquiry
            0.25,  # Communication frequency (most important)
            0.05,  # Previous enquiries
            0.15,  # Student performance
            0.15,  # Class availability
            0.15,  # Parent engagement
            0.05,  # Location proximity
            0.05,  # Payment capability
        ])

        # Normalize
        weights = weights / weights.sum()

        # Calculate weighted score
        score = np.dot(features, weights)

        # Boost for specific enquiry types
        enquiry_type = enquiry_data.get("enquiry_type", "online")
        if enquiry_type == "inperson":
            score *= 1.2

        return float(score)

    def _apply_seasonal_adjustment(self, score: float, month: Optional[int]) -> float:
        """Apply seasonal adjustment to score"""
        if month is None:
            return score

        # Peak admission seasons (Jan, May, Jun, Jul)
        peak_months = [1, 5, 6, 7]
        other_months = [2, 3, 4, 8, 9, 10]
        low_months = [11, 12]

        if month in peak_months:
            return score * 1.15  # Higher probability in peak season
        elif month in other_months:
            return score * 0.95  # Slightly lower
        else:  # Low months
            return score * 0.80  # Much lower

    def _calculate_confidence(self, features: np.ndarray) -> float:
        """Calculate confidence score (0-1) for the prediction"""
        # Confidence based on feature completeness and variance
        completeness = min(np.count_nonzero(features) / len(features), 1.0)
        variance = float(np.std(features))
        confidence = completeness * (1 - (variance * 0.2))
        return round(min(confidence, 1.0), 2)

    def _assess_risk_level(self, probability: float) -> str:
        """Assess risk level based on conversion probability"""
        if probability >= 0.7:
            return "high"
        elif probability >= 0.4:
            return "medium"
        else:
            return "low"

    def _generate_insights(
        self,
        score: float,
        features: np.ndarray,
        enquiry_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate actionable insights from the prediction"""
        key_factors = []
        recommendations = []

        # Analyze key factors
        if features[1] < 0.5:  # Low communication
            key_factors.append("Low communication frequency")
            recommendations.append("Increase follow-up frequency")

        if features[3] < 0.5:  # Low performance
            key_factors.append("Student performance below average")
            recommendations.append("Offer scholarship or support programs")

        if features[5] < 0.5:  # Low engagement
            key_factors.append("Parent engagement is low")
            recommendations.append("Schedule personal meeting with parents")

        if features[4] < 0.5:  # Low class availability
            key_factors.append("Limited class availability")
            recommendations.append("Check if preferred class has openings")

        if not key_factors:
            key_factors.append("All factors favorable for conversion")
            recommendations.append("Follow up to close the admission")

        # Next action
        next_action = self._determine_next_action(
            score,
            enquiry_data,
            recommendations,
        )

        return {
            "key_factors": key_factors,
            "recommendations": recommendations,
            "next_action": next_action,
        }

    def _determine_next_action(
        self,
        probability: float,
        enquiry_data: Dict[str, Any],
        recommendations: List[str],
    ) -> str:
        """Determine the next recommended action"""
        if probability >= 0.8:
            return "Send final offer letter and admission details"
        elif probability >= 0.6:
            return "Schedule counselor call to address parent concerns"
        elif probability >= 0.4:
            return recommendations[0] if recommendations else "Send brochure and testimonials"
        else:
            return "Re-engage with personalized offer or scholarship"

    def _estimate_conversion_days(self, probability: float, days_since: int) -> int:
        """Estimate days until conversion (if it happens)"""
        # Higher probability = faster conversion
        adjustment = (1 - probability) * 30  # Can take up to 30 days
        estimated = int(7 + adjustment)
        return estimated


# Global instance
admission_scorer = AdmissionScoringModel()
