import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const tokenFromQuery = request?.query?.token;
    if (tokenFromQuery && !request.headers?.authorization) {
      request.headers.authorization = `Bearer ${tokenFromQuery}`;
    }
    return super.canActivate(context);
  }
}
