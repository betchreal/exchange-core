import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Metadata } from '../entities/metadata.entity';
import { MetadataKey } from '@exchange-core/common';
import { Repository } from 'typeorm';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

@Injectable()
export class SetMetadata implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(Metadata)
		private readonly metadata: Repository<Metadata>,
		private readonly cfg: ConfigService
	) {}
	async onApplicationBootstrap() {
		await this.metadata
			.createQueryBuilder()
			.insert()
			.into(Metadata)
			.values({ key: MetadataKey.INSTANCE_ID, value: randomUUID() })
			.orIgnore()
			.execute();

		const path = resolve(
			this.cfg.getOrThrow<string>('EGRESS_ALLOW_LIST_PATH')
		);
		if (!existsSync(path))
			throw new Error('Cannot find egress_allow_list.json file.');

		let list: string[];
		try {
			list = JSON.parse(await fs.readFile(path, 'utf-8'));
		} catch {
			throw new Error('egress_allow_list.json is an invalid JSON');
		}

		if (!Array.isArray(list))
			throw new Error('egress_allow_list.json is not an array.');

		await this.metadata
			.createQueryBuilder()
			.insert()
			.into(Metadata)
			.values({
				key: MetadataKey.EGRESS_ALLOW_LIST,
				value: JSON.stringify(list)
			})
			.orUpdate(['value'], ['key'])
			.execute();
	}
}
