import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto } from '../dtos/fees.dto';

/**
 * Course Configuration Service
 * Manages course/class configuration for fee structure mapping
 * - Create courses with duration and academic year
 * - Update course information
 * - Retrieve course configurations
 * - Delete courses
 */
@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new course configuration
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param dto - Course creation data
   * @returns Created course
   */
  async createCourse(tenantId: string, schoolId: string, dto: CreateCourseDto) {
    // Check for duplicate course in same academic year and school
    const existingCourse = await this.prisma.classMaster.findFirst({
      where: {
        schoolId,
        name: dto.courseName,
        academicYear: dto.academicYear as any,
      },
    });

    if (existingCourse) {
      throw new BadRequestException(
        `Course '${dto.courseName}' already exists for academic year ${dto.academicYear}`,
      );
    }

    // Create course configuration
    const course = await this.prisma.classMaster.create({
      data: {
        schoolId,
        name: dto.courseName,
        section: 'CLASS_1_A', // Default section
        academicYear: dto.academicYear as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        school: true,
      },
    });

    return this.formatCourseResponse(course);
  }

  /**
   * Get all courses for a school
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param academicYear - Optional filter by academic year
   * @returns Array of courses
   */
  async getCourses(tenantId: string, schoolId: string, academicYear?: string) {
    const where: any = { schoolId };

    if (academicYear) {
      where.academicYear = academicYear as any;
    }

    const courses = await this.prisma.classMaster.findMany({
      where,
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(course => this.formatCourseResponse(course));
  }

  /**
   * Get a single course by ID
   * @param tenantId - Tenant identifier
   * @param courseId - Course identifier
   * @returns Course details
   */
  async getCourseById(tenantId: string, courseId: string) {
    const course = await this.prisma.classMaster.findFirst({
      where: { id: courseId },
      include: {
        school: true,
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentNo: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course '${courseId}' not found`);
    }

    return {
      ...this.formatCourseResponse(course),
      enrolledStudents: course.students.length,
      studentList: course.students,
    };
  }

  /**
   * Update course information
   * @param tenantId - Tenant identifier
   * @param courseId - Course identifier
   * @param dto - Update data
   * @returns Updated course
   */
  async updateCourse(tenantId: string, courseId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.classMaster.findFirst({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course '${courseId}' not found`);
    }

    const updated = await this.prisma.classMaster.update({
      where: { id: courseId },
      data: {
        name: dto.courseName || course.name,
        updatedAt: new Date(),
      },
      include: {
        school: true,
      },
    });

    return this.formatCourseResponse(updated);
  }

  /**
   * Delete a course
   * @param tenantId - Tenant identifier
   * @param courseId - Course identifier
   */
  async deleteCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.classMaster.findFirst({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course '${courseId}' not found`);
    }

    // Check if course has enrolled students
    const studentCount = await this.prisma.student.count({
      where: { classId: courseId },
    });

    if (studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete course with ${studentCount} enrolled students. Remove students first.`,
      );
    }

    await this.prisma.classMaster.delete({
      where: { id: courseId },
    });

    return { success: true, message: 'Course deleted successfully' };
  }

  /**
   * Get course statistics
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @returns Course statistics
   */
  async getCourseStatistics(tenantId: string, schoolId: string) {
    const courses = await this.prisma.classMaster.findMany({
      where: { schoolId },
      include: {
        students: true,
      },
    });

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + course.students.length, 0);
    const averageStudentsPerCourse = totalStudents / totalCourses || 0;

    const courseWiseDetails = courses.map(course => ({
      courseId: course.id,
      courseName: course.name,
      academicYear: course.academicYear,
      totalCapacity: course.totalCapacity,
      enrolledStudents: course.students.length,
      vacantSeats: course.totalCapacity - course.students.length,
      occupancyPercentage: (course.students.length / course.totalCapacity) * 100,
    }));

    return {
      totalCourses,
      totalStudents,
      averageStudentsPerCourse: Math.round(averageStudentsPerCourse * 100) / 100,
      courseWiseDetails,
    };
  }

  /**
   * Format course response
   * @param course - Raw course data
   * @returns Formatted course response
   */
  private formatCourseResponse(course: any): CourseResponseDto {
    return {
      id: course.id,
      courseName: course.name,
      duration: course.academicYear ? 1 : 1, // Default duration
      academicYear: course.academicYear,
      description: `${course.name} - ${course.academicYear}`,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
