import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser } from './entities/parser.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ParserService {
	constructor(
		@InjectRepository(Parser) private readonly parser: Repository<Parser>
	) {}
}
