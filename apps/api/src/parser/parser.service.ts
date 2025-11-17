import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser } from './entities/parser.entity';
import { Repository } from 'typeorm';
import { PluginStatus, PluginType } from '@exchange-core/common';
import { PluginCoreService } from '../plugin-core/plugin-core.service';

@Injectable()
export class ParserService {
	constructor(
		@InjectRepository(Parser) private readonly parser: Repository<Parser>,
		private readonly core: PluginCoreService
	) {}

	async install(tgzPath: string, moduleName: string) {
		const prepared = await this.core.prepare(
			tgzPath,
			moduleName,
			PluginType.PARSER
		);
		let parser: Parser | null = null;
		try {
			parser = await this.parser.save({
				name: prepared.manifest.name,
				version: prepared.manifest.version,
				type: prepared.manifest.type,
				path: prepared.destDir,
				manifest: prepared.manifest
			});
			await this.core.commit(
				prepared.tempDir,
				prepared.destDir,
				prepared.ticket
			);
			return parser;
		} catch (err) {
			if (parser?.id) await this.parser.delete(parser?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');

		if (parser.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(parser.manifest.configSchema, config);

		parser.config = await this.core.encrypt(config);
		await this.parser.save(parser);
	}
}
