export class SchoolDto {
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  principalName: string;
  principalEmail: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  foundedYear: number;
}

export class UpdateSchoolDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  principalName?: string;
  principalEmail?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
}
