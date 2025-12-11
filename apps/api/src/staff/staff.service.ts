import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StaffService {
	constructor(
		@InjectRepository(Staff) private readonly staff: Repository<Staff>
	) {}

	async getOne(id: number) {
		const staff = await this.staff.findOne({ where: { id } });
		if (!staff) throw new NotFoundException('Staff not found.');
		return staff;
	}
}
