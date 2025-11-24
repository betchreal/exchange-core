import {
	Injectable,
	PipeTransform,
	ArgumentMetadata,
	BadRequestException
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import 'reflect-metadata';

@Injectable()
export class DecimalPipe implements PipeTransform {
	transform(value: any, { metatype, type }: ArgumentMetadata) {
		if (type !== 'body' || !metatype || typeof metatype !== 'function') {
			return value;
		}

		if (!value || typeof value !== 'object') {
			return value;
		}

		const prototype = metatype.prototype;

		for (const key of Object.keys(value)) {
			const designType = Reflect.getMetadata(
				'design:type',
				prototype,
				key
			);

			if (designType === Decimal) {
				const raw = value[key];

				if (raw == null || raw instanceof Decimal) {
					continue;
				}

				if (typeof raw !== 'string' && typeof raw !== 'number') {
					throw new BadRequestException(
						`Field "${key}" must be string or number to be converted to Decimal`
					);
				}

				try {
					value[key] = new Decimal(raw);
				} catch {
					throw new BadRequestException(
						`Field "${key}" must be a valid decimal`
					);
				}
			}
		}

		return value;
	}
}
