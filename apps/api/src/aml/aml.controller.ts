import { Controller } from '@nestjs/common';
import { AmlService } from './aml.service';

@Controller('aml')
export class AmlController {
	constructor(private readonly amlService: AmlService) {}
}
