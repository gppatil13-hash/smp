-- ==========================================
-- Multi-Tenant School ERP Database Schema
-- PostgreSQL DDL Statements
-- ==========================================

-- ========== DROP EXISTING OBJECTS ==========
DROP INDEX IF EXISTS idx_tenant_subdomain;
DROP INDEX IF EXISTS idx_tenant_isactive;
DROP INDEX IF EXISTS idx_school_tenantid;
DROP INDEX IF EXISTS idx_school_isactive;
DROP INDEX IF EXISTS idx_user_tenantid;
DROP INDEX IF EXISTS idx_user_schoolid;
DROP INDEX IF EXISTS idx_user_role;
DROP INDEX IF EXISTS idx_user_isactive;
DROP INDEX IF EXISTS idx_student_tenantid;
DROP INDEX IF EXISTS idx_student_schoolid;
DROP INDEX IF EXISTS idx_student_classid;
DROP INDEX IF EXISTS idx_student_status;
DROP INDEX IF EXISTS idx_student_enrollmentdate;
DROP INDEX IF EXISTS idx_course_tenantid;
DROP INDEX IF EXISTS idx_course_schoolid;
DROP INDEX IF EXISTS idx_class_tenantid;
DROP INDEX IF EXISTS idx_class_schoolid;
DROP INDEX IF EXISTS idx_class_courseid;
DROP INDEX IF EXISTS idx_class_isactive;
DROP INDEX IF EXISTS idx_admissionenquiry_tenantid;
DROP INDEX IF EXISTS idx_admissionenquiry_schoolid;
DROP INDEX IF EXISTS idx_admissionenquiry_status;
DROP INDEX IF EXISTS idx_admissionenquiry_enquirydate;
DROP INDEX IF EXISTS idx_admission_tenantid;
DROP INDEX IF EXISTS idx_admission_schoolid;
DROP INDEX IF EXISTS idx_admission_studentid;
DROP INDEX IF EXISTS idx_admission_status;
DROP INDEX IF EXISTS idx_admission_applicationdate;
DROP INDEX IF EXISTS idx_feestructure_tenantid;
DROP INDEX IF EXISTS idx_feestructure_schoolid;
DROP INDEX IF EXISTS idx_feestructure_classid;
DROP INDEX IF EXISTS idx_feestructure_isactive;
DROP INDEX IF EXISTS idx_feecomponent_tenantid;
DROP INDEX IF EXISTS idx_feecomponent_feestructureid;
DROP INDEX IF EXISTS idx_feeinstallment_tenantid;
DROP INDEX IF EXISTS idx_feeinstallment_feestructureid;
DROP INDEX IF EXISTS idx_feeinstallment_duedate;
DROP INDEX IF EXISTS idx_studentfeeinstallment_tenantid;
DROP INDEX IF EXISTS idx_studentfeeinstallment_studentid;
DROP INDEX IF EXISTS idx_studentfeeinstallment_installmentid;
DROP INDEX IF EXISTS idx_studentfeeinstallment_status;
DROP INDEX IF EXISTS idx_studentfeeinstallment_duedate;
DROP INDEX IF EXISTS idx_feepayment_tenantid;
DROP INDEX IF EXISTS idx_feepayment_studentid;
DROP INDEX IF EXISTS idx_feepayment_paymentdate;
DROP INDEX IF EXISTS idx_feepayment_status;
DROP INDEX IF EXISTS idx_feepayment_paymentmode;
DROP INDEX IF EXISTS idx_receipt_tenantid;
DROP INDEX IF EXISTS idx_receipt_receiptdate;
DROP INDEX IF EXISTS idx_document_tenantid;
DROP INDEX IF EXISTS idx_document_studentid;
DROP INDEX IF EXISTS idx_document_admissionenquiryid;
DROP INDEX IF EXISTS idx_document_admissionid;
DROP INDEX IF EXISTS idx_document_documenttype;
DROP INDEX IF EXISTS idx_document_status;
DROP INDEX IF EXISTS idx_communicationlog_tenantid;
DROP INDEX IF EXISTS idx_communicationlog_schoolid;
DROP INDEX IF EXISTS idx_communicationlog_type;
DROP INDEX IF EXISTS idx_communicationlog_status;
DROP INDEX IF EXISTS idx_communicationlog_sentat;
DROP INDEX IF EXISTS idx_communicationlog_createdat;

DROP TABLE IF EXISTS "CommunicationLog" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Receipt" CASCADE;
DROP TABLE IF EXISTS "FeePayment" CASCADE;
DROP TABLE IF EXISTS "StudentFeeInstallment" CASCADE;
DROP TABLE IF EXISTS "FeeInstallment" CASCADE;
DROP TABLE IF EXISTS "FeeComponent" CASCADE;
DROP TABLE IF EXISTS "FeeStructure" CASCADE;
DROP TABLE IF EXISTS "Admission" CASCADE;
DROP TABLE IF EXISTS "AdmissionEnquiry" CASCADE;
DROP TABLE IF EXISTS "Student" CASCADE;
DROP TABLE IF EXISTS "Class" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "School" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "StudentStatus";
DROP TYPE IF EXISTS "AdmissionEnquiryStatus";
DROP TYPE IF EXISTS "AdmissionStatus";
DROP TYPE IF EXISTS "DocumentType";
DROP TYPE IF EXISTS "DocumentStatus";
DROP TYPE IF EXISTS "FeeStructureType";
DROP TYPE IF EXISTS "FeeFrequency";
DROP TYPE IF EXISTS "InstallmentStatus";
DROP TYPE IF EXISTS "PaymentMode";
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "CommunicationType";
DROP TYPE IF EXISTS "CommunicationStatus";
DROP TYPE IF EXISTS "CommunicationRecipient";

-- ========== ENUMS ==========

CREATE TYPE "UserRole" AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'TEACHER',
  'ACCOUNTANT',
  'ADMISSION_COUNSELLOR',
  'RECEPTIONIST',
  'PARENT',
  'STUDENT'
);

CREATE TYPE "StudentStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'TRANSFERRED',
  'PASSED_OUT',
  'SUSPENDED',
  'DROPPED'
);

CREATE TYPE "AdmissionEnquiryStatus" AS ENUM (
  'NEW',
  'INTERESTED',
  'AWAITING_INFO',
  'QUALIFIED',
  'NOT_INTERESTED',
  'REJECTED'
);

CREATE TYPE "AdmissionStatus" AS ENUM (
  'INQUIRY',
  'APPLIED',
  'SHORTLISTED',
  'ADMITTED',
  'ENROLLED',
  'REJECTED',
  'CANCELLED',
  'WAITLISTED'
);

CREATE TYPE "DocumentType" AS ENUM (
  'BIRTH_CERTIFICATE',
  'AADHAR',
  'PASSPORT',
  'ADMISSION_FORM',
  'TRANSFER_CERTIFICATE',
  'CHARACTER_CERTIFICATE',
  'MEDICAL_CERTIFICATE',
  'VACCINATION_CERTIFICATE',
  'PHOTOGRAPH',
  'PARENT_ID_PROOF',
  'ADDRESS_PROOF',
  'INCOME_CERTIFICATE',
  'CASTE_CERTIFICATE',
  'HEALTH_RECORD',
  'PREVIOUS_SCHOOL_REPORT',
  'OTHER'
);

CREATE TYPE "DocumentStatus" AS ENUM (
  'PENDING',
  'UPLOADED',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE "FeeStructureType" AS ENUM (
  'ANNUAL',
  'SEMESTER',
  'QUARTERLY',
  'MONTHLY',
  'ONE_TIME'
);

CREATE TYPE "FeeFrequency" AS ENUM (
  'ANNUAL',
  'SEMESTER',
  'QUARTERLY',
  'MONTHLY',
  'ON_DEMAND'
);

CREATE TYPE "InstallmentStatus" AS ENUM (
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'WAIVED',
  'CANCELLED'
);

CREATE TYPE "PaymentMode" AS ENUM (
  'CASH',
  'CHEQUE',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'UPI',
  'ONLINE',
  'WALLET'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
);

CREATE TYPE "CommunicationType" AS ENUM (
  'SMS',
  'EMAIL',
  'WHATSAPP',
  'IN_APP',
  'PHONE_CALL',
  'PUSH_NOTIFICATION'
);

CREATE TYPE "CommunicationStatus" AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'MARKED_AS_READ'
);

CREATE TYPE "CommunicationRecipient" AS ENUM (
  'STUDENT',
  'PARENT',
  'BOTH'
);

-- ========== CORE TABLES ==========

CREATE TABLE "Tenant" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "registrationNo" VARCHAR(255) UNIQUE,
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  currency VARCHAR(10) DEFAULT 'INR',
  "subscriptionPlan" VARCHAR(100) DEFAULT 'STANDARD',
  "maxSchools" INTEGER DEFAULT 1,
  "maxUsers" INTEGER DEFAULT 50,
  "maxStudents" INTEGER DEFAULT 3000,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_subdomain ON "Tenant"(subdomain);
CREATE INDEX idx_tenant_isactive ON "Tenant"("isActive");

-- ========== SCHOOL TABLE ==========

CREATE TABLE "School" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "principalName" VARCHAR(255),
  "principalPhone" VARCHAR(20),
  "principalEmail" VARCHAR(255),
  "registrationNo" VARCHAR(255),
  "foundedYear" INTEGER,
  "affiliationNumber" VARCHAR(255),
  "boardName" VARCHAR(100),
  "noOfStudents" INTEGER DEFAULT 0,
  "noOfClasses" INTEGER DEFAULT 0,
  "noOfTeachers" INTEGER DEFAULT 0,
  building VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "registrationNo")
);

CREATE INDEX idx_school_tenantid ON "School"("tenantId");
CREATE INDEX idx_school_isactive ON "School"("isActive");

-- ========== USER TABLE ==========

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role "UserRole" NOT NULL,
  "employeeId" VARCHAR(100),
  department VARCHAR(100),
  designation VARCHAR(100),
  gender VARCHAR(20),
  "dateOfBirth" TIMESTAMP,
  "aadharNo" VARCHAR(20),
  "panNo" VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  "profileImageUrl" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", email)
);

CREATE INDEX idx_user_tenantid ON "User"("tenantId");
CREATE INDEX idx_user_schoolid ON "User"("schoolId");
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_isactive ON "User"("isActive");

-- ========== COURSE TABLE ==========

CREATE TABLE "Course" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  board VARCHAR(100),
  duration INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "schoolId", code)
);

CREATE INDEX idx_course_tenantid ON "Course"("tenantId");
CREATE INDEX idx_course_schoolid ON "Course"("schoolId");

-- ========== CLASS TABLE ==========

CREATE TABLE "Class" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "courseId" UUID NOT NULL REFERENCES "Course"(id) ON DELETE RESTRICT,
  "classCode" VARCHAR(50) NOT NULL,
  "className" VARCHAR(100) NOT NULL,
  "academicYear" VARCHAR(20) NOT NULL,
  section VARCHAR(50),
  capacity INTEGER DEFAULT 60,
  "classTeacherId" UUID,
  "classroomNo" VARCHAR(50),
  floor VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "courseId", "classCode", "academicYear")
);

CREATE INDEX idx_class_tenantid ON "Class"("tenantId");
CREATE INDEX idx_class_schoolid ON "Class"("schoolId");
CREATE INDEX idx_class_courseid ON "Class"("courseId");
CREATE INDEX idx_class_isactive ON "Class"("isActive");

-- ========== STUDENT TABLE ==========

CREATE TABLE "Student" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "enrollmentNo" VARCHAR(100) NOT NULL,
  "rollNumber" VARCHAR(50),
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  "dateOfBirth" TIMESTAMP NOT NULL,
  age INTEGER,
  "bloodGroup" VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  "profileImageUrl" VARCHAR(255),
  status "StudentStatus" DEFAULT 'ACTIVE',
  "enrollmentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "classId" UUID REFERENCES "Class"(id) ON DELETE SET NULL,
  "fatherName" VARCHAR(255),
  "fatherPhone" VARCHAR(20),
  "fatherEmail" VARCHAR(255),
  "fatherOccupation" VARCHAR(100),
  "motherName" VARCHAR(255),
  "motherPhone" VARCHAR(20),
  "motherEmail" VARCHAR(255),
  "motherOccupation" VARCHAR(100),
  "guardianName" VARCHAR(255),
  "guardianPhone" VARCHAR(20),
  "guardianRelation" VARCHAR(100),
  "aadharNo" VARCHAR(20),
  "samadhaarNo" VARCHAR(20),
  "medicalConditions" TEXT,
  "specialNeeds" BOOLEAN DEFAULT false,
  "specialNeedsDetails" TEXT,
  "assignedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "enrollmentNo")
);

CREATE INDEX idx_student_tenantid ON "Student"("tenantId");
CREATE INDEX idx_student_schoolid ON "Student"("schoolId");
CREATE INDEX idx_student_classid ON "Student"("classId");
CREATE INDEX idx_student_status ON "Student"(status);
CREATE INDEX idx_student_enrollmentdate ON "Student"("enrollmentDate");

-- ========== ADMISSION ENQUIRY TABLE ==========

CREATE TABLE "AdmissionEnquiry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "enquiryNo" VARCHAR(100) NOT NULL,
  "enquiryDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "studentName" VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  "dateOfBirth" TIMESTAMP,
  "parentName" VARCHAR(255),
  "parentEmail" VARCHAR(255),
  "parentPhone" VARCHAR(20),
  "interestedClass" VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  course VARCHAR(100),
  status "AdmissionEnquiryStatus" DEFAULT 'NEW',
  source VARCHAR(100),
  notes TEXT,
  "handledBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "followUpDate" TIMESTAMP,
  "isConverted" BOOLEAN DEFAULT false,
  "convertedToAdmissionId" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "enquiryNo")
);

CREATE INDEX idx_admissionenquiry_tenantid ON "AdmissionEnquiry"("tenantId");
CREATE INDEX idx_admissionenquiry_schoolid ON "AdmissionEnquiry"("schoolId");
CREATE INDEX idx_admissionenquiry_status ON "AdmissionEnquiry"(status);
CREATE INDEX idx_admissionenquiry_enquirydate ON "AdmissionEnquiry"("enquiryDate");

-- ========== ADMISSION TABLE ==========

CREATE TABLE "Admission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "studentId" UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "applicationNo" VARCHAR(100) NOT NULL,
  "applicationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "admissionDate" TIMESTAMP,
  status "AdmissionStatus" DEFAULT 'APPLIED',
  "academicYear" VARCHAR(20) NOT NULL,
  "classAppliedFor" VARCHAR(100),
  section VARCHAR(50),
  "approvedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "approvalDate" TIMESTAMP,
  "rejectionReason" TEXT,
  notes TEXT,
  "previousSchool" VARCHAR(255),
  "previousClassPassed" VARCHAR(100),
  "previousPercentage" DECIMAL(5, 2),
  "transferCertificateNo" VARCHAR(100),
  "medicalCheckupDone" BOOLEAN DEFAULT false,
  "medicalCheckupDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "applicationNo")
);

CREATE INDEX idx_admission_tenantid ON "Admission"("tenantId");
CREATE INDEX idx_admission_schoolid ON "Admission"("schoolId");
CREATE INDEX idx_admission_studentid ON "Admission"("studentId");
CREATE INDEX idx_admission_status ON "Admission"(status);
CREATE INDEX idx_admission_applicationdate ON "Admission"("applicationDate");

-- ========== FEE STRUCTURE TABLE ==========

CREATE TABLE "FeeStructure" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "classId" UUID NOT NULL REFERENCES "Class"(id) ON DELETE RESTRICT,
  "academicYear" VARCHAR(20) NOT NULL,
  "feeType" VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency "FeeFrequency" DEFAULT 'ANNUAL',
  "totalAmount" DECIMAL(12, 2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "effectiveFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "classId", "academicYear", "feeType")
);

CREATE INDEX idx_feestructure_tenantid ON "FeeStructure"("tenantId");
CREATE INDEX idx_feestructure_schoolid ON "FeeStructure"("schoolId");
CREATE INDEX idx_feestructure_classid ON "FeeStructure"("classId");
CREATE INDEX idx_feestructure_isactive ON "FeeStructure"("isActive");

-- ========== FEE COMPONENT TABLE ==========

CREATE TABLE "FeeComponent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "feeStructureId" UUID NOT NULL REFERENCES "FeeStructure"(id) ON DELETE CASCADE,
  "componentName" VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  "isMandatory" BOOLEAN DEFAULT true,
  percentage DECIMAL(5, 2),
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("feeStructureId", "componentName")
);

CREATE INDEX idx_feecomponent_tenantid ON "FeeComponent"("tenantId");
CREATE INDEX idx_feecomponent_feestructureid ON "FeeComponent"("feeStructureId");

-- ========== FEE INSTALLMENT TABLE ==========

CREATE TABLE "FeeInstallment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "feeStructureId" UUID NOT NULL REFERENCES "FeeStructure"(id) ON DELETE CASCADE,
  "installmentNumber" INTEGER NOT NULL,
  "installmentName" VARCHAR(100) NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("feeStructureId", "installmentNumber")
);

CREATE INDEX idx_feeinstallment_tenantid ON "FeeInstallment"("tenantId");
CREATE INDEX idx_feeinstallment_feestructureid ON "FeeInstallment"("feeStructureId");
CREATE INDEX idx_feeinstallment_duedate ON "FeeInstallment"("dueDate");

-- ========== STUDENT FEE INSTALLMENT TABLE ==========

CREATE TABLE "StudentFeeInstallment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "installmentId" UUID NOT NULL REFERENCES "FeeInstallment"(id) ON DELETE CASCADE,
  "dueAmount" DECIMAL(12, 2) NOT NULL,
  "paidAmount" DECIMAL(12, 2) DEFAULT 0,
  "balanceAmount" DECIMAL(12, 2) DEFAULT 0,
  status "InstallmentStatus" DEFAULT 'PENDING',
  "dueDate" TIMESTAMP NOT NULL,
  "paidDate" TIMESTAMP,
  "waiverAmount" DECIMAL(12, 2) DEFAULT 0,
  "waiverReason" TEXT,
  "waiverApprovedBy" VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "installmentId")
);

CREATE INDEX idx_studentfeeinstallment_tenantid ON "StudentFeeInstallment"("tenantId");
CREATE INDEX idx_studentfeeinstallment_studentid ON "StudentFeeInstallment"("studentId");
CREATE INDEX idx_studentfeeinstallment_installmentid ON "StudentFeeInstallment"("installmentId");
CREATE INDEX idx_studentfeeinstallment_status ON "StudentFeeInstallment"(status);
CREATE INDEX idx_studentfeeinstallment_duedate ON "StudentFeeInstallment"("dueDate");

-- ========== FEE PAYMENT TABLE ==========

CREATE TABLE "FeePayment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "installmentId" UUID REFERENCES "StudentFeeInstallment"(id) ON DELETE SET NULL,
  "paymentNo" VARCHAR(100) NOT NULL,
  "paymentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(12, 2) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL,
  status "PaymentStatus" DEFAULT 'COMPLETED',
  "transactionId" VARCHAR(255),
  "referenceNo" VARCHAR(255),
  remarks TEXT,
  "uploadedByUserId" VARCHAR(255),
  "receiptId" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "paymentNo")
);

CREATE INDEX idx_feepayment_tenantid ON "FeePayment"("tenantId");
CREATE INDEX idx_feepayment_studentid ON "FeePayment"("studentId");
CREATE INDEX idx_feepayment_paymentdate ON "FeePayment"("paymentDate");
CREATE INDEX idx_feepayment_status ON "FeePayment"(status);
CREATE INDEX idx_feepayment_paymentmode ON "FeePayment"("paymentMode");

-- ========== RECEIPT TABLE ==========

CREATE TABLE "Receipt" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "receiptNo" VARCHAR(100) NOT NULL,
  "studentId" VARCHAR(255),
  "paymentId" VARCHAR(255),
  "receiptDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "paidAmount" DECIMAL(12, 2) NOT NULL,
  "remainingAmount" DECIMAL(12, 2) DEFAULT 0,
  "paymentMode" "PaymentMode" NOT NULL,
  remarks TEXT,
  "printCount" INTEGER DEFAULT 0,
  "lastPrintedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "receiptNo")
);

CREATE INDEX idx_receipt_tenantid ON "Receipt"("tenantId");
CREATE INDEX idx_receipt_receiptdate ON "Receipt"("receiptDate");

-- ========== DOCUMENT TABLE ==========

CREATE TABLE "Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "studentId" UUID REFERENCES "Student"(id) ON DELETE CASCADE,
  "admissionEnquiryId" UUID REFERENCES "AdmissionEnquiry"(id) ON DELETE CASCADE,
  "admissionId" UUID REFERENCES "Admission"(id) ON DELETE CASCADE,
  "documentType" "DocumentType" NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "fileUrl" VARCHAR(500) NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  status "DocumentStatus" DEFAULT 'PENDING',
  remarks TEXT,
  "uploadedBy" VARCHAR(255),
  "verifiedBy" VARCHAR(255),
  "verificationDate" TIMESTAMP,
  "expiryDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_tenantid ON "Document"("tenantId");
CREATE INDEX idx_document_studentid ON "Document"("studentId");
CREATE INDEX idx_document_admissionenquiryid ON "Document"("admissionEnquiryId");
CREATE INDEX idx_document_admissionid ON "Document"("admissionId");
CREATE INDEX idx_document_documenttype ON "Document"("documentType");
CREATE INDEX idx_document_status ON "Document"(status);

-- ========== COMMUNICATION LOG TABLE ==========

CREATE TABLE "CommunicationLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
  "senderId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "studentId" UUID REFERENCES "Student"(id) ON DELETE SET NULL,
  "admissionEnquiryId" UUID REFERENCES "AdmissionEnquiry"(id) ON DELETE CASCADE,
  "parentEmail" VARCHAR(255),
  "parentPhone" VARCHAR(20),
  type "CommunicationType" NOT NULL,
  "recipientType" "CommunicationRecipient" DEFAULT 'STUDENT',
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status "CommunicationStatus" DEFAULT 'PENDING',
  "sentAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "failureReason" TEXT,
  "maxRetries" INTEGER DEFAULT 3,
  "retryCount" INTEGER DEFAULT 0,
  "externalId" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communicationlog_tenantid ON "CommunicationLog"("tenantId");
CREATE INDEX idx_communicationlog_schoolid ON "CommunicationLog"("schoolId");
CREATE INDEX idx_communicationlog_type ON "CommunicationLog"(type);
CREATE INDEX idx_communicationlog_status ON "CommunicationLog"(status);
CREATE INDEX idx_communicationlog_sentat ON "CommunicationLog"("sentAt");
CREATE INDEX idx_communicationlog_createdat ON "CommunicationLog"("createdAt");

-- ========== END OF SCHEMA ==========
COMMIT;
