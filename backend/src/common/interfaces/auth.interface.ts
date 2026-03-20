export interface IAuthenticatedRequest {
  user: {
    id: string;
    email: string;
    tenantId: string;
    schoolId?: string;
    role: string;
  };
  tenantId: string;
  schoolId?: string;
}

export interface ITokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  schoolId?: string;
  role: string;
}

export interface ITenantContext {
  tenantId: string;
  schoolId?: string;
  userId?: string;
}
