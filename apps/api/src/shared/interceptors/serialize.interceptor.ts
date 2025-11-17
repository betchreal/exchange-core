import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
	Type
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { SERIALIZE_DTO } from '@exchange-core/common';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> | Promise<Observable<any>> {
		const dto = this.reflector.get<Type<unknown>>(
			SERIALIZE_DTO,
			context.getHandler()
		);
		if (!dto) return next.handle();

		return next.handle().pipe(
			map((data) => {
				if (!data) return data;

				const transform = (item: unknown) =>
					plainToInstance(dto, item, {
						excludeExtraneousValues: true,
						enableImplicitConversion: true
					});

				return Array.isArray(data)
					? data.map(transform)
					: transform(data);
			})
		);
	}
}
