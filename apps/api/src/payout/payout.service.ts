import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payout } from './entities/payout.entity';
import { Repository } from 'typeorm';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import {
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PayoutService {
	constructor(
		@InjectRepository(Payout) private readonly payout: Repository<Payout>,
		private readonly core: PluginCoreService
	) {}

	async install(tgzPath: string, moduleName: string) {
		const prepared = await this.core.prepare(
			tgzPath,
			moduleName,
			PluginType.PAYOUT
		);
		let payout: Payout | null = null;
		try {
			payout = await this.payout.save({
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
			return payout;
		} catch (err) {
			if (payout?.id) await this.payout.delete(payout?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');

		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(payout.manifest.configSchema, config);

		payout.config = await this.core.encrypt(config);
		await this.payout.save(payout);
	}

	async launch(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');
		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is already active.');

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		try {
			await this.core.launch(ref, {
				dir: payout.path,
				manifest: payout.manifest,
				encryptedConfig: payout.config
			});
			payout.status = PluginStatus.ACTIVE;
			return this.payout.save(payout);
		} catch (err) {
			payout.status = PluginStatus.DISABLED;
			await this.payout.save(payout);
			throw err;
		}
	}

	async disable(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');
		if (payout.status !== PluginStatus.ACTIVE) return payout;

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		this.core.stop(ref);

		payout.status = PluginStatus.DISABLED;
		return this.payout.save(payout);
		// handle currencies and routes changes
	}

	async remove(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');

		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		await this.core.clearFiles(payout.path);
		await this.payout.remove(payout);
	}

	@OnEvent('payout.crashed', { async: true })
	async handleCrash(ref: PluginRef) {
		await this.payout.update(ref.id, {
			status: PluginStatus.DISABLED
		});
		// handle currencies and routes changes
	}
}
