import {
	applyDecorators,
	SetMetadata,
	Type,
	UseInterceptors
} from '@nestjs/common';
import { SERIALIZE_DTO } from '@exchange-core/common';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';

export function Serialize(dto: Type) {
	return applyDecorators(
		SetMetadata(SERIALIZE_DTO, dto),
		UseInterceptors(SerializeInterceptor)
	);
}
