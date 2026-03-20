import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ITenantContext, ITokenPayload } from '@common/interfaces/auth.interface';

/**
 * JWT Strategy with Tenant Extraction
 * Extracts and validates tenant information from JWT tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Validate JWT payload and extract tenant context
   */
  async validate(payload: ITokenPayload) {
    this.logger.debug(`Validating JWT for user: ${payload.email}, tenant: ${payload.tenantId}`);

    if (!payload.tenantId) {
      throw new Error('Invalid token: missing tenantId');
    }

    // Build user object with tenant context
    const user = {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      schoolId: payload.schoolId,
      role: payload.role,
    };

    // Attach tenant context
    const tenantContext: ITenantContext = {
      tenantId: payload.tenantId,
      schoolId: payload.schoolId,
      userId: payload.sub,
    };

    return {
      ...user,
      tenantContext,
    };
  }
}
