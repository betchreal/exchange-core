import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Metadata } from './entities/metadata.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
	constructor(
		@InjectRepository(Metadata)
		private readonly metadata: Repository<Metadata>
	) {}

	async get(key: string) {
		const record = await this.metadata.findOne({ where: { key } });
		return record === null ? record : record.value;
	}

	async getOrThrow(key: string) {
		const value = await this.get(key);
		if (value === null) throw new Error('Invalid key.');
		return value;
	}

	async getJSON(key: string) {
		const value = await this.get(key);
		return value === null ? value : JSON.parse(value);
	}
}
