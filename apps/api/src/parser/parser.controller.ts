import { Controller } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
	constructor(private readonly parserService: ParserService) {}
}
