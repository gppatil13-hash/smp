export class CreateStudentDto {
  enrollmentNo: string;
  rollNumber: number;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  bloodGroup?: string;
  email?: string;
  phone?: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  motherName: string;
  motherPhone: string;
  motherEmail?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  academicYear: string;
  classId: string;
  admissionDate: Date;
}

export class UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  status?: string;
}

export class StudentListDto {
  skip?: number;
  take?: number;
  classId?: string;
  academicYear?: string;
  status?: string;
}
