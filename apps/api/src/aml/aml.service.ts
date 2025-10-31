import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Aml } from './entities/aml.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AmlService {
	constructor(@InjectRepository(Aml) private readonly aml: Repository<Aml>) {}
}
