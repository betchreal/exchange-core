import {
	BadRequestException,
	ConflictException,
	HttpException,
	Injectable,
	InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import * as tar from 'tar';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
	type Manifest,
	type Signature,
	type PluginRef,
	type LaunchOptions,
	ManifestSchema,
	PluginType,
	MetadataKey,
	REQUIRED_METHODS
} from '@exchange-core/common';
import { PluginManager } from './engine/plugin.manager';
import { TicketService } from '../ticket/ticket.service';
import { SettingService } from '../setting/setting.service';
import { PluginProcess } from './engine/plugin.process';

const scryptAsync = promisify(crypto.scrypt);

@Injectable()
export class PluginCoreService {
	private readonly ajv = new Ajv({ allErrors: true, strict: false });
	private readonly validate: ValidateFunction;

	private readonly REQUIRED = new Set<string>([
		'index.js',
		'manifest.json',
		'signature.json'
	]);

	private readonly roots: Record<PluginType, string>;
	constructor(
		private readonly cfg: ConfigService,
		private readonly metadata: SettingService,
		private readonly manager: PluginManager,
		private readonly ticketService: TicketService
	) {
		addFormats(this.ajv);
		this.validate = this.ajv.compile(ManifestSchema);

		this.roots = {
			payout: this.cfg.getOrThrow<string>('PAYOUT_INSTALL_PATH'),
			merchant: this.cfg.getOrThrow<string>('MERCHANT_INSTALL_PATH'),
			parser: this.cfg.getOrThrow<string>('PARSER_INSTALL_PATH'),
			aml: this.cfg.getOrThrow<string>('AML_INSTALL_PATH')
		} as const;
	}

	async prepare(
		tgzPath: string,
		moduleName: string,
		expectedType: PluginType
	) {
		moduleName = moduleName.toLowerCase().replace(/\.tgz$/i, '');
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), moduleName));

		try {
			await this.extract(tgzPath, tempDir);

			const { name, version, type, ...ticket } =
				await this.verify(tempDir);

			if (type !== expectedType)
				throw new BadRequestException('Type mismatch.');

			const manifest = await this.validateManifest(tempDir, {
				name,
				version,
				type
			});

			const destDir = path.resolve(
				this.roots[manifest.type],
				manifest.name + '@' + manifest.version
			);

			if (existsSync(destDir))
				throw new ConflictException(
					'Plugin with this name and version already exists.'
				);

			return {
				tempDir,
				ticket,
				manifest,
				destDir
			};
		} catch (err) {
			await this.rollback(tgzPath, tempDir);
			if (err instanceof HttpException) throw err;
			throw new InternalServerErrorException('Failed to install plugin.');
		}
	}

	async commit(sourceDir: string, destDir: string, ticket: any) {
		try {
			await fs.cp(sourceDir, destDir, { recursive: true });
			await this.consume(ticket.jti, ticket.exp);
		} catch (err) {
			await fs.rm(destDir, { recursive: true, force: true });
			if (err instanceof HttpException) throw err;
			throw new InternalServerErrorException('Failed to install plugin.');
		}
	}

	async rollback(tgzPath: string, dir: string) {
		await Promise.allSettled([
			fs.rm(dir, { recursive: true, force: true }),
			fs.rm(tgzPath, { force: true })
		]);
	}

	validateConfig(
		configSchema: Record<string, any>,
		config: Record<string, any>
	) {
		const ajvCfg = new Ajv({ allErrors: true, strict: true });
		addFormats(ajvCfg);
		const validateCfg = ajvCfg.compile(configSchema);
		if (!validateCfg(config))
			throw new BadRequestException('Config mismatch the schema.');
	}

	async encrypt(config: Record<string, any>) {
		const salt = crypto.randomBytes(16);
		const iv = crypto.randomBytes(12);
		const key = (await this.deriveKey(
			this.cfg.getOrThrow('AES_KEY'),
			salt
		)) as Buffer;

		const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
		const ct = Buffer.concat([
			cipher.update(JSON.stringify(config), 'utf8'),
			cipher.final()
		]);
		const tag = cipher.getAuthTag();

		return Buffer.from(
			JSON.stringify({
				alg: 'aes-256-gcm',
				salt: this.toB64(salt),
				iv: this.toB64(iv),
				ct: this.toB64(ct),
				tag: this.toB64(tag)
			}),
			'utf-8'
		).toString('base64');
	}

	async launch(ref: PluginRef, opts: LaunchOptions) {
		if (!opts.encryptedConfig)
			throw new BadRequestException('Config is undefined.');
		const config = await this.decrypt(opts.encryptedConfig);

		const required = REQUIRED_METHODS[ref.type](opts.manifest);

		const env = {
			PLUGIN_CONFIG_JSON: JSON.stringify(config),
			REQUIRED_METHODS: JSON.stringify(required),
			HTTP_PROXY: this.cfg.getOrThrow<string>('HTTP_PROXY'),
			HTTPS_PROXY: this.cfg.getOrThrow<string>('HTTPS_PROXY')
		};

		let proc: PluginProcess;
		try {
			proc = await this.manager.boot(ref, {
				entry: path.join(opts.dir, 'index.js'),
				cwd: opts.dir,
				env,
				timeoutMs: opts.manifest.timeouts.bootMs
			});
		} catch (err) {
			throw new BadRequestException(`Boot failed: ${err.message}`);
		}
		return proc;
	}

	stop(ref: PluginRef) {
		return this.manager.stop(ref);
	}

	async clearFiles(dir: string) {
		try {
			await fs.rm(dir, { recursive: true });
		} catch {
			throw new InternalServerErrorException(
				'Unable to remove plugin files.'
			);
		}
	}

	private async decrypt(encoded: string) {
		// to recheck
		const decoded = JSON.parse(
			Buffer.from(encoded, 'base64').toString('utf-8')
		);

		const salt = this.fromB64(decoded.salt);
		const iv = this.fromB64(decoded.iv);
		const ct = this.fromB64(decoded.ct);
		const tag = this.fromB64(decoded.tag);

		const key = (await this.deriveKey(
			this.cfg.getOrThrow('AES_KEY'),
			salt
		)) as Buffer;
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);

		const config = Buffer.concat([decipher.update(ct), decipher.final()]);
		return JSON.parse(config.toString('utf-8'));
	}

	private async extract(tgzPath: string, destDir: string) {
		const seen = new Set<string>();
		const MAX_BYTES = Number(
			this.cfg.getOrThrow<number>('MAX_PLUGIN_SIZE')
		);
		let bytes = 0;

		await tar.x({
			file: tgzPath,
			cwd: destDir,
			strict: true,
			preservePaths: false,
			filter: (entryPath) => {
				const p = entryPath.replace(/\\/g, '/').replace(/^\.\/+/, '');
				if (p.includes('/') || !this.REQUIRED.has(p)) return false;
				if (seen.has(p))
					throw new BadRequestException(
						`Duplicate file in archive: ${p}`
					);
				seen.add(p);
				return true;
			},
			onentry: (entry) => {
				if (entry.type !== 'File')
					throw new BadRequestException(
						'Only regular files allowed.'
					);
				const absolutePath = path.resolve(destDir, entry.path);

				if (
					absolutePath !== destDir &&
					!absolutePath.startsWith(destDir + path.sep)
				) {
					throw new BadRequestException(
						'Invalid path during unarchiving.'
					);
				}

				if (entry.size < 0 || !Number.isFinite(entry.size))
					throw new BadRequestException(
						`Invalid size for ${entry.path.replace(/\\/g, '/').replace(/^\.\/+/, '')}`
					);

				bytes += entry.size;
				if (bytes > MAX_BYTES)
					throw new BadRequestException(
						'Too large size of unarchived files.'
					);
			}
		});

		for (const f of this.REQUIRED) {
			if (!existsSync(path.join(destDir, f)))
				throw new BadRequestException(`Missing required file: ${f}`);
		}
	}

	private async verify(dir: string) {
		let signature: Signature;
		try {
			signature = JSON.parse(
				await fs.readFile(path.join(dir, 'signature.json'), 'utf-8')
			);
		} catch {
			throw new BadRequestException('Unable to read signature.json.');
		}

		if (!signature || typeof signature.ticket !== 'string')
			throw new BadRequestException(
				'signature.json must contain "ticket" attribute'
			);

		return this.ticketService.verify(signature.ticket);
	}

	private async validateManifest(
		dir: string,
		expected: Pick<Manifest, 'name' | 'version' | 'type'>
	) {
		let manifest: Manifest;
		try {
			manifest = JSON.parse(
				await fs.readFile(path.join(dir, 'manifest.json'), 'utf-8')
			);
		} catch {
			throw new BadRequestException('Unable to read manifest.json.');
		}

		if (!this.validate(manifest)) {
			const msg = this.validate.errors
				?.map((e) => `${e.instancePath || '/'} ${e.message}`)
				.join(', ');
			throw new BadRequestException(`Invalid manifest: ${msg}.`);
		}

		if (manifest.name !== expected.name)
			throw new BadRequestException(
				'Manifest name does not match a ticket.'
			);
		if (manifest.version !== expected.version)
			throw new BadRequestException(
				'Manifest version does not match a ticket.'
			);
		if (manifest.type !== expected.type)
			throw new BadRequestException(
				'Manifest type does not match a ticket.'
			);

		const egressAllowList = await this.metadata.getJSON(
			MetadataKey.EGRESS_ALLOW_LIST
		);
		if (!egressAllowList)
			throw new InternalServerErrorException('No EGRESS ALLOW LIST.');

		const notPermitted: string[] = [];
		if (manifest.net.egressAllowList.length) {
			for (const d of manifest.net.egressAllowList) {
				if (!egressAllowList.includes(d)) notPermitted.push(d);
			}
		}

		if (notPermitted.length)
			throw new BadRequestException(
				`Not permitted domains in manifest.json: ${notPermitted.join(', ')}.`
			);

		if (Object.keys(manifest.configSchema).length === 0)
			manifest.configSchema = {
				type: 'object',
				additionalProperties: false,
				maxProperties: 0
			};

		try {
			const ajvCfg = new Ajv({ allErrors: true, strict: true });
			addFormats(ajvCfg);
			ajvCfg.compile(manifest.configSchema);
		} catch {
			throw new BadRequestException(
				'configSchema is not valid JSON schema.'
			);
		}

		return manifest;
	}

	private async consume(jti: string, exp: number) {
		const consumed = await this.ticketService.consume(jti, exp);
		if (!consumed)
			throw new BadRequestException('Ticket is already consumed');
	}

	private async deriveKey(secret: string, salt: Buffer) {
		return scryptAsync(secret, salt, 32);
	}

	private toB64(b: Buffer) {
		return b.toString('base64');
	}

	private fromB64(s: string) {
		return Buffer.from(s, 'base64');
	}
}
