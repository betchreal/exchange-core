import { PluginType } from '@exchange-core/common';
import { IsEnum, IsString, Length, Matches, MaxLength } from 'class-validator';

export class IssueTicketDto {
	@IsString()
	@Length(1, 32)
	@Matches(/^[a-z0-9][a-z0-9_-]*$/)
	name: string;

	@IsString()
	@Length(1, 32)
	@Matches(/^[a-z0-9][a-z0-9_.-]*$/)
	version: string;

	@IsEnum(PluginType)
	type: PluginType;
}
