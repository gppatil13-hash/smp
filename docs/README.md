# School Management Platform - AI System

A comprehensive AI-powered system for educational institution management, featuring admission probability scoring, fee default prediction, automated follow-up suggestions, and intelligent message generation.

## Overview

The AI System provides intelligent analytics and automation for school management operations:

- **Admission Management**: Predict conversion probability and guide effective follow-up
- **Fee Collection**: Identify at-risk students and optimize collection strategies  
- **Smart Communications**: Generate personalized messages at scale
- **Automated Insights**: Get actionable recommendations for every decision

## Quick Start

### Prerequisites

- Docker & Docker Compose (recommended) OR
- Python 3.10+ and Node.js 18+
- PostgreSQL 14+
- Redis 7+ (optional but recommended)

### 5-Minute Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd smp
```

2. **Copy environment file**:
```bash
cp .env.example .env
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Verify services are running**:
```bash
# Backend health
curl http://localhost:3000/health

# AI Service health
curl http://localhost:8000/api/ai/scoring/sample-scoring
```

5. **Access the application**:
- Backend API: http://localhost:3000
- AI Service: http://localhost:8000

## Documentation

Complete documentation is available in the `docs/` directory:

### 📖 [AI System Documentation](docs/AI_SYSTEM_DOCUMENTATION.md)
Comprehensive guide covering:
- System architecture and components
- Core capabilities and features
- Configuration and setup
- Usage examples and best practices
- Deployment and troubleshooting

### 🔌 [API Reference](docs/API_REFERENCE.md)
Complete API endpoint specifications:
- Admission Scoring API
- Fee Default Prediction API
- Follow-up Suggestions API
- Message Generation API
- Request/response examples
- Error handling

### 🏗️ [NestJS Integration Guide](docs/NESTJS_INTEGRATION_GUIDE.md)
Detailed guide for backend developers:
- Module setup and configuration
- Service integration patterns
- Practical implementation examples
- Error handling and testing
- Performance optimization

### 🚀 [Deployment & Architecture](docs/DEPLOYMENT_ARCHITECTURE.md)
Production deployment guide:
- System architecture overview
- Docker Compose setup
- Kubernetes deployment
- Traditional server setup
- Security and monitoring

## Key Features

### 1. Admission Probability Scoring
Predict the likelihood of an enquiry converting to admission based on:
- Parent engagement and communication patterns
- Student performance metrics
- Interaction history and timing
- Program interest and fit

**Key Endpoints**:
- Score single enquiry
- Score and rank multiple enquiries
- Compare two enquiries
- What-if scenario analysis

### 2. Fee Default Prediction
Identify students at risk of fee payment default:
- Historical payment patterns
- Financial capacity indicators
- Communication responsiveness
- Days overdue and outstanding amount

**Key Endpoints**:
- Predict default risk for individual student
- Assess batch risk with financial impact
- Get personalized collection strategy
- Simulate payment scenarios

### 3. Automated Follow-up Suggestions
Get smart follow-up recommendations at each stage:
- Admission enquiries: Initial inquiry → Applied → Shortlisted → Admitted
- Fee payments: Friendly reminder → Urgent notice → Overdue demand → Critical action

**Key Endpoints**:
- Single enquiry/student follow-up
- Batch follow-up suggestions
- Prioritized action list

### 4. Smart Message Generation
Generate personalized messages at scale:
- Multiple tone options (professional, friendly)
- Channel-specific formatting (email, SMS, WhatsApp)
- Batch generation capability
- A/B testing variants

**Key Endpoints**:
- Generate single message
- Generate variants for A/B testing
- Batch message generation
- Get available templates

## Architecture

### Three-Layer Architecture

```
Application Layer (NestJS Backend)
    ↓
Integration Layer (AI Client Service)
    ↓
AI Engine (Python FastAPI Service)
```

**NestJS Backend**:
- REST API endpoints
- Business logic and workflows
- Database operations
- Authentication and authorization

**AI Client Service**:
- HTTP communication with AI engine
- Error handling and retry logic
- Request/response formatting
- Service health checks

**Python AI Service**:
- Machine learning models
- Scoring and prediction engines
- Message generation
- Analytics processing

## API Examples

### Score an Admission Enquiry

```bash
curl -X POST http://localhost:3000/api/admission/score \
  -H "Content-Type: application/json" \
  -d '{
    "enquiry_id": "ENQ_001",
    "status": "APPLIED",
    "days_since_enquiry": 15,
    "communication_count": 3,
    "parent_engagement_level": 0.8
  }'
```

### Predict Fee Default Risk

```bash
curl -X POST http://localhost:3000/api/fees/predict-default \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU_001",
    "days_overdue": 30,
    "outstanding_amount": 25000,
    "payment_history": {
      "on_time_payments": 5,
      "late_payments": 2
    }
  }'
```

### Generate Personalized Message

```bash
curl -X POST http://localhost:3000/api/communication/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "enquiry_id": "ENQ_001",
    "parent_name": "John Doe",
    "student_name": "Jane Doe",
    "message_type": "inquiry_followup",
    "tone": "friendly",
    "channel": "email"
  }'
```

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete endpoint documentation.

## Development

### Development Environment Setup

```bash
# Backend development
cd backend
npm install
npm run dev

# AI service development
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Running Tests

```bash
# Backend tests
cd backend
npm run test

# AI service tests
cd ai-service
pytest tests/
```

## Project Structure

```
smp/
├── backend/                           # NestJS Backend
│   ├── src/
│   │   ├── common/
│   │   │   ├── services/
│   │   │   │   └── ai-client.service.ts
│   │   │   └── ai.module.ts
│   │   ├── modules/
│   │   │   ├── admission/
│   │   │   ├── fees/
│   │   │   └── communication/
│   │   └── main.ts
│   ├── package.json
│   └── docker-compose.yml
│
├── ai-service/                        # Python FastAPI Service
│   ├── routes/
│   │   ├── scoring_router.py
│   │   ├── default_predictor_router.py
│   │   ├── followup_router.py
│   │   └── message_router.py
│   ├── models/
│   │   ├── admission_scorer.py
│   │   ├── fee_default_predictor.py
│   │   ├── followup_engine.py
│   │   └── message_generator.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                              # Documentation
│   ├── AI_SYSTEM_DOCUMENTATION.md
│   ├── API_REFERENCE.md
│   ├── NESTJS_INTEGRATION_GUIDE.md
│   └── DEPLOYMENT_ARCHITECTURE.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=smp_user
DB_PASSWORD=secure_password
DB_NAME=school_management

# AI Service
AI_SERVICE_URL=http://localhost:8000/api/ai
AI_SERVICE_TIMEOUT=30000

# Backend
NODE_ENV=development
JWT_SECRET=your-secret-key
LOG_LEVEL=debug
```

See `.env.example` for all available options.

## Deployment

### Quick Deployment with Docker

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

See [DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) for:
- Kubernetes deployment
- Traditional server setup
- Load balancing and scaling
- SSL/TLS configuration
- Monitoring and logging

## API Endpoints Summary

### Admission Management
- `POST /api/admission/score` - Score single enquiry
- `POST /api/admission/score-and-rank` - Rank multiple enquiries
- `POST /api/admission/compare-scores` - Compare two enquiries
- `POST /api/admission/scenario-analysis` - What-if analysis

### Fee Management
- `POST /api/fees/predict-default` - Predict default risk
- `POST /api/fees/assess-batch-risk` - Assess multiple students
- `POST /api/fees/collection-strategy` - Get collection approach
- `POST /api/fees/simulate-scenarios` - Analyze payment scenarios
- `GET /api/fees/collection-priority` - Get priority list

### Communications
- `POST /api/communication/generate-message` - Generate single message
- `POST /api/communication/generate-variants` - Create A/B variants
- `POST /api/communication/batch-generate` - Batch message generation
- `GET /api/communication/templates` - Get available templates

### Follow-up
- `POST /api/followup/admission` - Get admission follow-up
- `POST /api/followup/fees` - Get fee follow-up
- `POST /api/followup/batch` - Batch follow-up suggestions

## Performance Metrics

- **Response Time**: < 200ms for single requests
- **Throughput**: Handles 100+ concurrent users
- **Batch Processing**: 1-2s for 100 records
- **Uptime**: 99.9% availability with redundancy

## Security

- **Authentication**: JWT token-based authentication
- **Encryption**: SSL/TLS for all communications
- **Database**: Encrypted sensitive data at rest
- **Rate Limiting**: Prevent abuse and DDoS
- **Input Validation**: Strict validation on all inputs
- **Audit Logging**: Complete audit trail of all operations

## Support & Troubleshooting

### Common Issues

**AI service not responding**:
```bash
curl -v http://localhost:8000/api/ai/scoring/sample-scoring
docker logs smp-ai-service
```

**Database connection error**:
```bash
docker exec smp-db psql -U smp_user -c "SELECT 1"
# or check DB_HOST and password in .env
```

**Port already in use**:
```bash
docker-compose down
docker-compose up -d
```

See [AI_SYSTEM_DOCUMENTATION.md#troubleshooting](docs/AI_SYSTEM_DOCUMENTATION.md#troubleshooting) for more solutions.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Roadmap

- [x] Admission probability scoring
- [x] Fee default prediction
- [x] Automated follow-up suggestions
- [x] Smart message generation
- [x] NestJS integration services
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Parent communication portal
- [ ] Payment gateway integration
- [ ] Custom model training interface

## Contact

For questions, issues, or support:
- Email: support@schoolmanagement.local
- Documentation: See `/docs` directory
- Issue tracker: GitHub Issues

---

**Last Updated**: March 19, 2024
**Version**: 1.0.0
