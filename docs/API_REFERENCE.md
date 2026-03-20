# API Reference - Complete Endpoint Specifications

## Table of Contents
1. [Admission Scoring API](#admission-scoring-api)
2. [Fee Default Prediction API](#fee-default-prediction-api)
3. [Follow-up Suggestions API](#follow-up-suggestions-api)
4. [Message Generation API](#message-generation-api)
5. [Response Models](#response-models)
6. [Error Handling](#error-handling)

---

## Admission Scoring API

Base URL: `http://localhost:8000/api/ai/scoring`

### 1. Score Single Admission Enquiry

**Endpoint**: `POST /score`

**Purpose**: Calculate conversion probability for a single enquiry

**Request Body**:
```json
{
  "enquiry_id": "ENQ_001",
  "status": "INQUIRY",
  "days_since_enquiry": 5,
  "days_since_last_contact": 2,
  "communication_count": 1,
  "parent_engagement_level": 0.8,
  "student_test_score": 85,
  "parent_type": "engaged",
  "referred_by": "google",
  "program_interest": "ICSE"
}
```

**Response (200 OK)**:
```json
{
  "enquiry_id": "ENQ_001",
  "conversion_probability": 0.75,
  "confidence_score": 0.92,
  "risk_level": "medium",
  "status": "success",
  "analysis": {
    "key_factors": [
      "High parent engagement (+15%)",
      "Recent contact (+10%)",
      "Good test score (+12%)"
    ],
    "recommendation": "Follow up with course information",
    "suggested_action": "Send course brochure and schedule demo"
  }
}
```

**Status Codes**:
- `200 OK`: Successfully scored
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Scoring engine error

---

### 2. Score and Rank Multiple Enquiries

**Endpoint**: `POST /score-and-rank`

**Purpose**: Score multiple enquiries and rank by conversion probability

**Request Body**:
```json
{
  "enquiries": [
    {
      "enquiry_id": "ENQ_001",
      "status": "INQUIRY",
      "days_since_enquiry": 5,
      "days_since_last_contact": 2,
      "communication_count": 1,
      "parent_engagement_level": 0.8,
      "student_test_score": 85,
      "parent_type": "engaged",
      "referred_by": "google",
      "program_interest": "ICSE"
    },
    {
      "enquiry_id": "ENQ_002",
      "status": "APPLIED",
      "days_since_enquiry": 20,
      "days_since_last_contact": 7,
      "communication_count": 5,
      "parent_engagement_level": 0.6,
      "student_test_score": 78,
      "parent_type": "casual",
      "referred_by": "word_of_mouth",
      "program_interest": "IB"
    }
  ],
  "limit": 10
}
```

**Response (200 OK)**:
```json
{
  "total_enquiries": 2,
  "ranked_enquiries": [
    {
      "rank": 1,
      "enquiry_id": "ENQ_001",
      "conversion_probability": 0.75,
      "risk_level": "medium",
      "confidence_score": 0.92,
      "action_priority": "high"
    },
    {
      "rank": 2,
      "enquiry_id": "ENQ_002",
      "conversion_probability": 0.52,
      "risk_level": "high",
      "confidence_score": 0.85,
      "action_priority": "medium"
    }
  ],
  "total_estimated_conversions": 1.27,
  "status": "success"
}
```

---

### 3. Compare Two Enquiries

**Endpoint**: `POST /compare-scores`

**Purpose**: Side-by-side comparison of two enquiries

**Request Body**:
```json
{
  "enquiry_1": { /* enquiry data */ },
  "enquiry_2": { /* enquiry data */ }
}
```

**Response (200 OK)**:
```json
{
  "comparison": {
    "enquiry_1_id": "ENQ_001",
    "enquiry_2_id": "ENQ_002",
    "enquiry_1_probability": 0.75,
    "enquiry_2_probability": 0.52,
    "probability_difference": 0.23,
    "more_likely_to_convert": "ENQ_001",
    "conversion_likelihood": "ENQ_001 is 44% more likely to convert"
  },
  "factor_comparison": {
    "engagement": {
      "enquiry_1": "High (0.8)",
      "enquiry_2": "Medium (0.6)",
      "advantage": "enquiry_1"
    },
    "recency": {
      "enquiry_1": "5 days",
      "enquiry_2": "20 days",
      "advantage": "enquiry_1"
    }
  },
  "recommendations": [
    "Prioritize ENQ_001 for immediate follow-up",
    "Re-engage ENQ_002 with personalized offer"
  ],
  "status": "success"
}
```

---

### 4. What-If Scenario Analysis

**Endpoint**: `POST /what-if-analysis`

**Purpose**: Analyze impact of different actions on conversion probability

**Request Body**:
```json
{
  "enquiry_id": "ENQ_001",
  "current_data": { /* enquiry data */ },
  "scenarios": [
    {
      "scenario_name": "Increase communication frequency",
      "communication_count": 5
    },
    {
      "scenario_name": "Schedule immediate demo",
      "days_since_last_contact": 0
    },
    {
      "scenario_name": "Send personalized offer",
      "parent_engagement_level": 0.95
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "enquiry_id": "ENQ_001",
  "current_probability": 0.75,
  "scenarios_analysis": [
    {
      "scenario": "Increase communication frequency",
      "new_probability": 0.82,
      "improvement_percentage": 9.3,
      "impact": "positive",
      "effort": "medium"
    },
    {
      "scenario": "Schedule immediate demo",
      "new_probability": 0.85,
      "improvement_percentage": 13.3,
      "impact": "positive",
      "effort": "low"
    },
    {
      "scenario": "Send personalized offer",
      "new_probability": 0.88,
      "improvement_percentage": 17.3,
      "impact": "very_positive",
      "effort": "high"
    }
  ],
  "recommended_action": "Schedule immediate demo",
  "recommended_reason": "Highest impact with lowest effort",
  "status": "success"
}
```

---

### 5. Get Sample Scoring Data

**Endpoint**: `GET /sample-scoring`

**Purpose**: Get sample data for testing and development

**Response (200 OK)**:
```json
{
  "sample_enquiry": {
    "enquiry_id": "SAMPLE_001",
    "status": "INQUIRY",
    "days_since_enquiry": 5,
    "days_since_last_contact": 2,
    "communication_count": 1,
    "parent_engagement_level": 0.8,
    "student_test_score": 85,
    "parent_type": "engaged",
    "referred_by": "google",
    "program_interest": "ICSE"
  },
  "sample_response": {
    "conversion_probability": 0.75,
    "risk_level": "medium",
    "recommendation": "Follow up with course information"
  },
  "status": "success"
}
```

---

## Fee Default Prediction API

Base URL: `http://localhost:8000/api/ai/fees`

### 1. Predict Default Risk for Single Student

**Endpoint**: `POST /predict-default-risk`

**Purpose**: Calculate probability of fee payment default

**Request Body**:
```json
{
  "student_id": "STU_001",
  "days_overdue": 30,
  "outstanding_amount": 25000,
  "total_fees": 100000,
  "payment_history": {
    "on_time_payments": 5,
    "late_payments": 2,
    "defaults": 0
  },
  "parent_communication_score": 0.7,
  "financial_capacity_indicators": {
    "employment_status": "employed",
    "income_stability": "stable",
    "other_loans": 1
  },
  "previous_defaults": 0,
  "installment_count": 10
}
```

**Response (200 OK)**:
```json
{
  "student_id": "STU_001",
  "default_probability": 0.35,
  "risk_assessment": {
    "level": "medium",
    "days_until_critical": 45,
    "financial_impact": 25000
  },
  "risk_components": {
    "overdue_risk": 0.4,
    "historical_risk": 0.1,
    "responsiveness_risk": 0.3,
    "financial_capacity_risk": 0.35
  },
  "collection_strategy": {
    "primary_action": "Friendly reminder with installment plan",
    "secondary_action": "Email reminder with payment link",
    "escalation_action": "Phone call with payment negotiation",
    "estimated_recovery_rate": 0.85,
    "success_probability": 0.85,
    "recommended_timeline": "Immediate contact"
  },
  "key_factors": [
    "30 days overdue (-20% risk)",
    "Good payment history (+15% favorability)",
    "Stable employment (+10% recovery probability)"
  ],
  "status": "success"
}
```

---

### 2. Assess Batch Default Risk

**Endpoint**: `POST /assess-batch-risk`

**Purpose**: Analyze default risk for multiple students with financial impact

**Request Body**:
```json
{
  "students": [
    { /* student data 1 */ },
    { /* student data 2 */ },
    { /* student data 3 */ }
  ]
}
```

**Response (200 OK)**:
```json
{
  "total_students": 3,
  "total_outstanding": 75000,
  "risk_summary": {
    "critical_risk": 1,
    "high_risk": 1,
    "medium_risk": 1,
    "low_risk": 0
  },
  "financial_summary": {
    "at_risk_amount": 75000,
    "estimated_recovery": 63750,
    "potential_loss": 11250,
    "recovery_rate": 0.85
  },
  "students_risk_breakdown": [
    {
      "rank": 1,
      "student_id": "STU_001",
      "default_probability": 0.55,
      "risk_level": "critical",
      "outstanding": 30000,
      "days_overdue": 45,
      "recovery_probability": 0.6
    },
    {
      "rank": 2,
      "student_id": "STU_002",
      "default_probability": 0.4,
      "risk_level": "high",
      "outstanding": 25000,
      "days_overdue": 30,
      "recovery_probability": 0.8
    },
    {
      "rank": 3,
      "student_id": "STU_003",
      "default_probability": 0.25,
      "risk_level": "medium",
      "outstanding": 20000,
      "days_overdue": 15,
      "recovery_probability": 0.95
    }
  ],
  "status": "success"
}
```

---

### 3. Get Collection Strategy

**Endpoint**: `POST /collection-strategy`

**Purpose**: Get personalized collection strategy with timeline

**Request Body**:
```json
{
  "student_id": "STU_001",
  "days_overdue": 30,
  "outstanding_amount": 25000,
  "payment_history": { /* ... */ },
  "parent_communication_score": 0.7
}
```

**Response (200 OK)**:
```json
{
  "student_id": "STU_001",
  "strategy": {
    "approach": "friendly_gradualism",
    "phases": [
      {
        "phase": 1,
        "duration_days": 7,
        "action": "Friendly email reminder with payment options",
        "channel": "email",
        "expected_outcome": "Payment or negotiation"
      },
      {
        "phase": 2,
        "duration_days": 7,
        "action": "Phone call with installment plan offer",
        "channel": "phone",
        "expected_outcome": "Agreement on payment schedule"
      },
      {
        "phase": 3,
        "duration_days": 14,
        "action": "Formal demand notice with legal implications",
        "channel": "registered_mail",
        "expected_outcome": "Payment or further escalation"
      }
    ]
  },
  "estimated_recovery_rate": 0.85,
  "success_probability": 0.85,
  "resource_allocation": {
    "staff_hours_required": 2,
    "support_cost": 500,
    "recovery_value": 25000
  },
  "status": "success"
}
```

---

### 4. Risk Comparison

**Endpoint**: `POST /risk-comparison`

**Purpose**: Compare default risk between two students

**Request Body**:
```json
{
  "student_1": { /* student data */ },
  "student_2": { /* student data */ }
}
```

**Response (200 OK)**:
```json
{
  "comparison": {
    "student_1_id": "STU_001",
    "student_2_id": "STU_002",
    "student_1_risk": 0.35,
    "student_2_risk": 0.22,
    "risk_difference": 0.13,
    "higher_risk_student": "STU_001",
    "risk_likelihood": "STU_001 is 59% more likely to default"
  },
  "factor_comparison": {
    "days_overdue": {
      "student_1": "30 days",
      "student_2": "15 days",
      "advantage": "student_2"
    },
    "payment_history": {
      "student_1": "Good",
      "student_2": "Good",
      "advantage": "tie"
    },
    "responsiveness": {
      "student_1": "Medium",
      "student_2": "High",
      "advantage": "student_2"
    }
  },
  "resource_recommendation": "Prioritize STU_001 for immediate interventions",
  "status": "success"
}
```

---

### 5. Simulate Payment Scenarios

**Endpoint**: `POST /simulate-payment-scenario`

**Purpose**: Analyze impact of different payment actions

**Request Body**:
```json
{
  "student_id": "STU_001",
  "current_data": { /* student data */ },
  "scenarios": [
    {
      "scenario_name": "Full payment now",
      "payment_amount": 25000
    },
    {
      "scenario_name": "50% now, 50% in 30 days",
      "payment_amount": 12500,
      "remaining_amount": 12500,
      "remaining_deadline_days": 30
    },
    {
      "scenario_name": "3-month installment plan",
      "monthly_amount": 8333,
      "duration_months": 3
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "student_id": "STU_001",
  "current_risk": 0.35,
  "scenarios_impact": [
    {
      "scenario": "Full payment now",
      "new_risk": 0.0,
      "risk_reduction": 0.35,
      "improvement_percentage": 100,
      "impact": "complete_resolution",
      "student_satisfaction": 0.9
    },
    {
      "scenario": "50% now, 50% in 30 days",
      "new_risk": 0.15,
      "risk_reduction": 0.2,
      "improvement_percentage": 57.1,
      "impact": "significant",
      "student_satisfaction": 0.7,
      "concern": "Requires follow-up for second payment"
    },
    {
      "scenario": "3-month installment plan",
      "new_risk": 0.25,
      "risk_reduction": 0.1,
      "improvement_percentage": 28.6,
      "impact": "moderate",
      "student_satisfaction": 0.85,
      "concern": "Multiple follow-ups required"
    }
  ],
  "recommended_scenario": "50% now, 50% in 30 days",
  "recommendation_reason": "Balances risk reduction with student satisfaction",
  "status": "success"
}
```

---

### 6. Get Sample Risk Prediction Data

**Endpoint**: `GET /sample-risk-prediction`

**Response (200 OK)**:
```json
{
  "sample_student": {
    "student_id": "SAMPLE_001",
    "days_overdue": 30,
    "outstanding_amount": 25000,
    "total_fees": 100000,
    "payment_history": {
      "on_time_payments": 5,
      "late_payments": 2,
      "defaults": 0
    },
    "parent_communication_score": 0.7
  },
  "sample_response": {
    "default_probability": 0.35,
    "risk_level": "medium",
    "collection_strategy": "Friendly reminder with installment plan"
  },
  "status": "success"
}
```

---

## Follow-up Suggestions API

Base URL: `http://localhost:8000/api/ai/followup`

### 1. Get Admission Follow-up

**Endpoint**: `POST /admission`

**Purpose**: Get follow-up actions for admission enquiries

**Request Body**:
```json
{
  "enquiry_id": "ENQ_001",
  "status": "APPLIED",
  "days_since_enquiry": 20,
  "days_since_last_contact": 5,
  "communication_count": 3,
  "parent_engagement_level": 0.8,
  "conversion_probability": 0.75,
  "reason_for_delay": "awaiting_test_results"
}
```

**Response (200 OK)**:
```json
{
  "enquiry_id": "ENQ_001",
  "current_status": "APPLIED",
  "next_actions": [
    {
      "action_id": 1,
      "action": "Send test results",
      "description": "Share mock test results and feedback",
      "priority": "high",
      "urgency": "immediate",
      "expected_outcome": "Increase confidence and engagement"
    },
    {
      "action_id": 2,
      "action": "Schedule campus visit",
      "description": "Invite for personalized campus tour",
      "priority": "high",
      "urgency": "within_3_days",
      "expected_outcome": "Experience school environment"
    }
  ],
  "primary_action": "Send test results",
  "primary_action_description": "Share mock test results and feedback",
  "optimal_contact_time": "Evening (6-8 PM)",
  "preferred_contact_channels": ["email", "phone"],
  "success_probability": 0.82,
  "estimated_timeline": "5-7 days to next milestone",
  "status": "success"
}
```

---

### 2. Get Fee Follow-up

**Endpoint**: `POST /fees`

**Purpose**: Get follow-up actions for fee payment

**Request Body**:
```json
{
  "student_id": "STU_001",
  "days_overdue": 30,
  "outstanding_amount": 25000,
  "payment_history": {
    "on_time_payments": 5,
    "late_payments": 2
  },
  "default_probability": 0.35,
  "parent_communication_score": 0.7
}
```

**Response (200 OK)**:
```json
{
  "student_id": "STU_001",
  "overdue_days": 30,
  "urgency_level": "high",
  "next_actions": [
    {
      "action_id": 1,
      "action": "Send friendly reminder with payment options",
      "description": "Email with installment plan options",
      "priority": "high",
      "contact_method": "email",
      "urgency": "immediate",
      "expected_outcome": "Proactive payment or negotiation"
    },
    {
      "action_id": 2,
      "action": "Phone call with payment negotiation",
      "description": "Direct conversation to understand obstacles",
      "priority": "high",
      "contact_method": "phone",
      "urgency": "within_2_days",
      "expected_outcome": "Agreement on payment schedule"
    }
  ],
  "primary_action": "Send friendly reminder with payment options",
  "optimal_contact_time": "During office hours (9-5 PM)",
  "success_probability": 0.85,
  "recovery_estimate": 21250,
  "status": "success"
}
```

---

### 3. Batch Admission Follow-up

**Endpoint**: `POST /batch-admission-suggestions`

**Request Body**:
```json
{
  "enquiries": [
    { /* enquiry 1 */ },
    { /* enquiry 2 */ },
    { /* enquiry 3 */ }
  ],
  "prioritize_by": "urgency"
}
```

**Response (200 OK)**:
```json
{
  "total_enquiries": 3,
  "followup_count": 3,
  "prioritized_actions": [
    {
      "rank": 1,
      "enquiry_id": "ENQ_001",
      "action": "Send test results",
      "urgency": "critical",
      "probability_impact": 0.12
    },
    {
      "rank": 2,
      "enquiry_id": "ENQ_002",
      "action": "Schedule demo call",
      "urgency": "high",
      "probability_impact": 0.15
    },
    {
      "rank": 3,
      "enquiry_id": "ENQ_003",
      "action": "Send scholarship info",
      "urgency": "medium",
      "probability_impact": 0.08
    }
  ],
  "total_estimated_conversion_impact": 0.35,
  "status": "success"
}
```

---

## Message Generation API

Base URL: `http://localhost:8000/api/ai/messages`

### 1. Generate Enquiry Message

**Endpoint**: `POST /generate-enquiry-message`

**Purpose**: Generate personalized message for enquiry

**Request Body**:
```json
{
  "enquiry_id": "ENQ_001",
  "parent_name": "John Doe",
  "student_name": "Jane Doe",
  "message_type": "inquiry_followup",
  "tone": "friendly",
  "channel": "email",
  "context": {
    "program": "ICSE",
    "days_since_inquiry": 5,
    "parent_type": "engaged"
  }
}
```

**Response (200 OK)**:
```json
{
  "enquiry_id": "ENQ_001",
  "message": {
    "subject": "Your inquiry about ICSE Program - Next Steps",
    "body": "Dear John,\n\nThank you for your interest in our ICSE program!...",
    "tone": "friendly",
    "personalization_level": "high"
  },
  "channel": "email",
  "message_type": "inquiry_followup",
  "estimated_open_rate": 0.85,
  "estimated_response_rate": 0.65,
  "best_send_time": "Tuesday 9:00 AM",
  "status": "success"
}
```

---

### 2. Generate Enquiry Message Variants

**Endpoint**: `POST /generate-enquiry-message-variants`

**Purpose**: Generate A/B testing message variants

**Request Body**:
```json
{
  "enquiry_id": "ENQ_001",
  "parent_name": "John Doe",
  "student_name": "Jane Doe",
  "message_type": "inquiry_followup",
  "variants": ["professional", "friendly"],
  "channel": "email"
}
```

**Response (200 OK)**:
```json
{
  "enquiry_id": "ENQ_001",
  "variants": [
    {
      "variant_id": "VAR_001",
      "tone": "professional",
      "subject": "Important Update - Your ICSE Program Application",
      "body": "Dear Mr./Mrs. Doe,\n\nWe wish to inform you...",
      "estimated_open_rate": 0.75,
      "estimated_response_rate": 0.55
    },
    {
      "variant_id": "VAR_002",
      "tone": "friendly",
      "subject": "Hi John! We loved talking to Jane about our ICSE program!",
      "body": "Hi John!\n\nJane sounded really interested when...",
      "estimated_open_rate": 0.85,
      "estimated_response_rate": 0.65
    }
  ],
  "recommended_variant": "VAR_002",
  "recommendation_reason": "Higher engagement expected with friendly tone for engaged parents",
  "status": "success"
}
```

---

### 3. Generate Fee Message

**Endpoint**: `POST /generate-fee-message`

**Purpose**: Generate personalized fee payment reminder

**Request Body**:
```json
{
  "student_id": "STU_001",
  "parent_name": "John Doe",
  "student_name": "Jane Doe",
  "message_type": "fee_reminder",
  "tone": "friendly",
  "channel": "email",
  "outstanding_amount": 25000,
  "days_overdue": 30,
  "urgency": "medium"
}
```

**Response (200 OK)**:
```json
{
  "student_id": "STU_001",
  "message": {
    "subject": "Fee Payment Reminder - February Installment",
    "body": "Dear John,\n\nThis is a friendly reminder about...",
    "tone": "friendly",
    "personalization_level": "high",
    "call_to_action": "Pay Now",
    "payment_link": "https://pay.school.com/STU_001"
  },
  "channel": "email",
  "message_type": "fee_reminder",
  "urgency_level": "medium",
  "estimated_payment_conversion": 0.7,
  "best_send_time": "Thursday 10:00 AM",
  "status": "success"
}
```

---

## Response Models

### Common Response Structure

All API responses follow this structure:

```json
{
  "status": "success|error",
  "timestamp": "2024-03-19T10:30:00Z",
  "data": { /* specific response data */ },
  "error": "error message (if status is error)"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": "error",
  "error": "Invalid enquiry data",
  "error_code": "INVALID_INPUT",
  "details": {
    "field": "days_since_enquiry",
    "message": "Must be non-negative integer"
  },
  "timestamp": "2024-03-19T10:30:00Z"
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|-----------|------------|-------------|
| INVALID_INPUT | 400 | Invalid request body or parameters |
| SERVICE_UNAVAILABLE | 503 | AI service is not responding |
| TIMEOUT | 504 | Request timed out |
| INTERNAL_ERROR | 500 | Server error |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| RATE_LIMITED | 429 | Too many requests |

---

**Last Updated**: March 19, 2024
