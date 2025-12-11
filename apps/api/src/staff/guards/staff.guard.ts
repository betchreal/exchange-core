import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { StaffService } from '../staff.service';
import { IdentityService } from '../../identity/identity.service';

@Injectable()
export class StaffGuard implements CanActivate {
	constructor(
		private readonly staffService: StaffService,
		private readonly identity: IdentityService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		if (!request.user)
			throw new UnauthorizedException('Authentication required');

		const principal = await this.identity.getPrincipal(request.user.sub);

		if (!principal.staff) throw new UnauthorizedException();
		request.staff = principal.staff;

		return true;
	}
}
