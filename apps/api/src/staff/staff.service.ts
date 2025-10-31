import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StaffService {
	constructor(
		@InjectRepository(Staff) private readonly staff: Repository<Staff>
	) {}
}
