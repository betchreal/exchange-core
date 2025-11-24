import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ConflictException,
	ExceptionFilter,
	HttpException,
	InternalServerErrorException
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

const NOT_NULL_VIOLATION = '23502';
const FOREIGN_KEY_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

@Catch(QueryFailedError)
export class PgErrorFilter implements ExceptionFilter {
	catch(exception: QueryFailedError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();

		const pgError = exception as QueryFailedError & { code?: string };
		let httpError: HttpException;

		switch (pgError.code) {
			case UNIQUE_VIOLATION:
				httpError = new ConflictException('Already exists.');
				break;
			case FOREIGN_KEY_VIOLATION:
				httpError = new ConflictException(
					'Operation conflicts with related data.'
				);
				break;
			case CHECK_VIOLATION:
				httpError = new BadRequestException(
					'Data violates a constraint.'
				);
				break;
			case NOT_NULL_VIOLATION:
				httpError = new BadRequestException('Missing required value.');
				break;
			default:
				httpError = new InternalServerErrorException('Database error.');
		}

		response.status(httpError.getStatus()).json(httpError.getResponse());
	}
}
