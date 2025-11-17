import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginEmployeeDto {
	@IsEmail()
	@Transform(({ value }) => value.toLowerCase())
	email: string;

	@IsString()
	@MinLength(4)
	@MaxLength(128)
	password: string;
}
