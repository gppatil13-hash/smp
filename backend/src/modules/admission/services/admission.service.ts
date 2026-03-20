import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import {
  ConvertEnquiryToAdmissionDto,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  DocumentUploadDto,
  BulkDocumentUploadDto,
  AdmissionResponseDto,
  DocumentResponseDto,
  AdmissionSummaryResponseDto,
  AdmissionStatisticsResponseDto,
} from '../dtos/admission.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Convert an admission enquiry to a formal student admission
   * This creates a Student record and links it to an Admission
   */
  async convertEnquiryToAdmission(
    tenantId: string,
    enquiryId: string,
    dto: ConvertEnquiryToAdmissionDto,
  ): Promise<{ student: any; admission: any }> {
    // Get the enquiry
    const enquiry = await this.prisma.admissionEnquiry.findFirst({
      where: { id: enquiryId, tenantId },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    if (enquiry.isConverted) {
      throw new BadRequestException('This enquiry is already converted to admission');
    }

    // Create Student record
    const enrollmentNo = await this.generateEnrollmentNumber(tenantId);

    const student = await this.prisma.student.create({
      data: {
        tenantId,
        schoolId: enquiry.schoolId,
        enrollmentNo,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        dateOfBirth: new Date(dto.dateOfBirth),
        address: enquiry.address,
        city: enquiry.city,
        state: enquiry.state,
        pincode: enquiry.pincode,
        country: 'India',
        status: 'ACTIVE',
        enrollmentDate: new Date(),
        classId: dto.classId,
        fatherName: dto.fatherName,
        fatherPhone: dto.fatherPhone,
        fatherEmail: dto.fatherEmail,
        motherName: dto.motherName,
        motherPhone: dto.motherPhone,
        motherEmail: dto.motherEmail,
        aadharNo: dto.aadharNo,
        bloodGroup: dto.bloodGroup,
        specialNeeds: dto.specialNeeds ? true : false,
        specialNeedsDetails: dto.specialNeeds,
        medicalConditions: dto.medicalConditions,
      },
    });

    // Create Admission record
    const applicationNo = await this.generateApplicationNumber(
      tenantId,
      enquiry.schoolId,
    );

    const admission = await this.prisma.admission.create({
      data: {
        tenantId,
        schoolId: enquiry.schoolId,
        studentId: student.id,
        applicationNo,
        applicationDate: new Date(),
        status: 'APPLIED',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        classAppliedFor: dto.assignedClass,
        previousSchool: dto.previousSchool,
        previousClassPassed: dto.previousClassPassed,
        previousPercentage: dto.previousPercentage,
        transferCertificateNo: dto.transferCertificateNo,
        notes: dto.previousSchool ? `Transferred from ${dto.previousSchool}` : null,
      },
    });

    // Mark enquiry as converted
    await this.prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: {
        isConverted: true,
        convertedToAdmissionId: admission.id,
      },
    });

    return { student, admission };
  }

  /**
   * Create an admission directly (for non-enquiry admissions)
   */
  async createAdmission(
    tenantId: string,
    dto: CreateAdmissionDto,
  ): Promise<AdmissionResponseDto> {
    const applicationNo = await this.generateApplicationNumber(tenantId, null);

    const admission = await this.prisma.admission.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        applicationNo,
        applicationDate: new Date(),
        status: 'APPLIED',
        academicYear: dto.academicYear,
        classAppliedFor: dto.classAppliedFor,
        section: dto.section,
        previousSchool: dto.previousSchool,
        previousClassPassed: dto.previousClassPassed,
        previousPercentage: dto.previousPercentage,
        transferCertificateNo: dto.transferCertificateNo,
        notes: dto.notes,
      },
    });

    return this.formatAdmissionResponse(admission);
  }

  /**
   * Update admission status and details
   */
  async updateAdmission(
    tenantId: string,
    admissionId: string,
    dto: UpdateAdmissionDto,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.getAdmissionById(tenantId, admissionId);

    // Validate status transition
    if (dto.status) {
      this.validateStatusTransition(admission.status, dto.status);
    }

    // If approving, update student class assignment
    if (dto.status === 'ADMITTED' && dto.classId) {
      await this.prisma.student.update({
        where: { id: admission.studentId },
        data: { classId: dto.classId },
      });
    }

    // If enrolling, mark as complete
    let admissionDate = admission.admissionDate;
    if (dto.status === 'ENROLLED' && !admissionDate) {
      admissionDate = new Date();
    }

    const updated = await this.prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: dto.status || admission.status,
        classId: dto.classId,
        notes: dto.notes || admission.notes,
        rejectionReason:
          dto.status === 'REJECTED' ? dto.rejectionReason : undefined,
        admissionDate,
      },
    });

    return this.formatAdmissionResponse(updated);
  }

  /**
   * Upload single document for admission
   */
  async uploadDocument(
    tenantId: string,
    admissionId: string,
    dto: DocumentUploadDto,
  ): Promise<DocumentResponseDto> {
    const admission = await this.getAdmissionById(tenantId, admissionId);

    // Generate file name if not provided
    const fileName = `${admission.applicationNo}-${dto.documentType}-${Date.now()}`;

    const document = await this.prisma.document.create({
      data: {
        tenantId,
        admissionId,
        studentId: admission.studentId,
        documentType: dto.documentType,
        fileName,
        fileUrl: dto.fileUrl,
        status: 'UPLOADED',
        remarks: dto.remarks,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });

    return this.formatDocumentResponse(document);
  }

  /**
   * Upload multiple documents in bulk
   */
  async uploadDocumentsBulk(
    tenantId: string,
    admissionId: string,
    dto: BulkDocumentUploadDto,
  ): Promise<DocumentResponseDto[]> {
    const admission = await this.getAdmissionById(tenantId, admissionId);

    const documents = await Promise.all(
      dto.documents.map((doc) =>
        this.uploadDocument(tenantId, admissionId, doc),
      ),
    );

    return documents;
  }

  /**
   * Get admission with documents and summary
   */
  async getAdmissionSummary(
    tenantId: string,
    admissionId: string,
  ): Promise<AdmissionSummaryResponseDto> {
    const admission = await this.prisma.admission.findFirst({
      where: { id: admissionId, tenantId },
      include: {
        student: true,
        documents: {
          where: { admissionId },
        },
      },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const documents = admission.documents.map((d) =>
      this.formatDocumentResponse(d),
    );
    const documentsUploaded = documents.length;
    const documentsVerified = documents.filter((d) => d.status === 'VERIFIED')
      .length;
    const documentsPending = documents.filter((d) => d.status === 'PENDING')
      .length;

    return {
      id: admission.id,
      studentName: admission.student
        ? `${admission.student.firstName} ${admission.student.lastName}`
        : 'Unknown',
      enrollmentNo: admission.student?.enrollmentNo,
      parentName: admission.student?.fatherName || 'Unknown',
      parentEmail: admission.student?.fatherEmail,
      parentPhone: admission.student?.fatherPhone,
      status: admission.status,
      academicYear: admission.academicYear,
      documents,
      documentsUploaded,
      documentsVerified,
      documentsPending,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
    };
  }

  /**
   * list admissions with filters
   */
  async listAdmissions(
    tenantId: string,
    query: {
      status?: string;
      classId?: string;
      academicYear?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<{
    data: AdmissionResponseDto[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.academicYear) {
      where.academicYear = query.academicYear;
    }

    if (query.search) {
      where.OR = [
        { applicationNo: { contains: query.search, mode: 'insensitive' } },
        { student: { enrollmentNo: { contains: query.search } } },
        { student: { firstName: { contains: query.search } } },
      ];
    }

    const [admissions, total] = await Promise.all([
      this.prisma.admission.findMany({
        where,
        include: { student: true },
        skip,
        take: limit,
        orderBy: { applicationDate: 'desc' },
      }),
      this.prisma.admission.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: admissions.map((a) => this.formatAdmissionResponse(a)),
      total,
      page,
      pages,
    };
  }

  /**
   * Get admission statistics
   */
  async getAdmissionStatistics(
    tenantId: string,
    academicYear?: string,
  ): Promise<AdmissionStatisticsResponseDto> {
    const where: any = { tenantId };
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const enquiryWhere: any = { tenantId };

    // Count enquiries
    const totalEnquiries = await this.prisma.admissionEnquiry.count({
      where: enquiryWhere,
    });
    const newEnquiries = await this.prisma.admissionEnquiry.count({
      where: { ...enquiryWhere, status: 'NEW' },
    });
    const interested = await this.prisma.admissionEnquiry.count({
      where: { ...enquiryWhere, status: 'INTERESTED' },
    });
    const qualified = await this.prisma.admissionEnquiry.count({
      where: { ...enquiryWhere, status: 'QUALIFIED' },
    });
    const rejectedEnquiries = await this.prisma.admissionEnquiry.count({
      where: { ...enquiryWhere, status: 'REJECTED' },
    });

    // Count admissions
    const totalAdmissions = await this.prisma.admission.count({
      where,
    });
    const appliedAdmissions = await this.prisma.admission.count({
      where: { ...where, status: 'APPLIED' },
    });
    const admittedCount = await this.prisma.admission.count({
      where: { ...where, status: 'ADMITTED' },
    });
    const enrolledCount = await this.prisma.admission.count({
      where: { ...where, status: 'ENROLLED' },
    });
    const rejectedAdmissions = await this.prisma.admission.count({
      where: { ...where, status: 'REJECTED' },
    });

    const conversionRate =
      totalEnquiries > 0
        ? Math.round((totalAdmissions / totalEnquiries) * 10000) / 100
        : 0;

    return {
      totalEnquiries,
      newEnquiries,
      interested,
      qualified,
      rejectedEnquiries,
      totalAdmissions,
      appliedAdmissions,
      admittedCount,
      enrolledCount,
      rejectedAdmissions,
      conversionRate,
      academicYear: academicYear || 'All',
    };
  }

  /**
   * Verify document
   */
  async verifyDocument(
    tenantId: string,
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        verificationDate: new Date(),
      },
    });

    return this.formatDocumentResponse(updated);
  }

  /**
   * Get admission by ID
   */
  async getAdmissionById(tenantId: string, admissionId: string): Promise<any> {
    const admission = await this.prisma.admission.findFirst({
      where: { id: admissionId, tenantId },
      include: { student: true },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    return admission;
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Generate unique enrollment number
   */
  private async generateEnrollmentNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const count = (await this.prisma.student.count({ where: { tenantId } })) + 1;

    return `ENR${year}${String(count).padStart(5, '0')}`;
  }

  /**
   * Generate unique application number
   */
  private async generateApplicationNumber(
    tenantId: string,
    schoolId: string | null,
  ): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const where: any = { tenantId };
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const count = await this.prisma.admission.count({ where });
    const sequence = String(count + 1).padStart(4, '0');

    return `APP-${year}-${month}-${sequence}`;
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const validTransitions: { [key: string]: string[] } = {
      INQUIRY: ['APPLIED'],
      APPLIED: ['SHORTLISTED', 'REJECTED'],
      SHORTLISTED: ['ADMITTED', 'REJECTED'],
      ADMITTED: ['ENROLLED', 'REJECTED'],
      ENROLLED: ['SUSPENDED', 'DROPPED'],
      REJECTED: [],
      WAITLISTED: ['ADMITTED', 'REJECTED'],
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Format admission response
   */
  private formatAdmissionResponse(admission: any): AdmissionResponseDto {
    return {
      id: admission.id,
      applicationNo: admission.applicationNo,
      studentId: admission.studentId,
      studentName: admission.student
        ? `${admission.student.firstName} ${admission.student.lastName}`
        : null,
      enrollmentNo: admission.student?.enrollmentNo,
      academicYear: admission.academicYear,
      status: admission.status,
      classAppliedFor: admission.classAppliedFor,
      section: admission.section,
      applicationDate: admission.applicationDate,
      admissionDate: admission.admissionDate,
      previousSchool: admission.previousSchool,
      previousPercentage: admission.previousPercentage,
      medicalCheckupDone: admission.medicalCheckupDone,
      notes: admission.notes,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
    };
  }

  /**
   * Format document response
   */
  private formatDocumentResponse(document: any): DocumentResponseDto {
    return {
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      status: document.status,
      remarks: document.remarks,
      expiryDate: document.expiryDate,
      verificationDate: document.verificationDate,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
