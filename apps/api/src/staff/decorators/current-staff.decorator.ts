import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Staff } from '../entities/staff.entity';

export const CurrentStaff = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): Staff => {
		const request = ctx.switchToHttp().getRequest();
		return request.staff as Staff;
	}
);
