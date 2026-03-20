import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthenticatedRequest } from '@common/interfaces/auth.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();
    return request.user;
  },
);
