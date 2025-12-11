import { fork } from 'child_process';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
	PluginKey,
	PluginRef,
	BootOptions,
	ExitCode
} from '@exchange-core/common';
import { PluginProcess } from './plugin.process';

@Injectable()
export class PluginManager {
	private procs = new Map<PluginKey, PluginProcess>();
	constructor(private readonly emitter: EventEmitter2) {}

	async boot(ref: PluginRef, opts: BootOptions) {
		const key = this.createKey(ref);
		if (this.procs.has(key)) return this.procs.get(key)!;

		const execArgv = ['--permission', `--allow-fs-read=${opts.entry}`];

		const child = fork(
			path.resolve(__dirname, '..', 'host', 'plugin.host.bundle.js'),
			['--entry', opts.entry],
			{
				cwd: opts.cwd,
				stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
				env: opts.env,
				execArgv
			}
		);

		const proc = new PluginProcess(child);
		this.procs.set(key, proc);

		child.on('exit', (code) => {
			this.procs.delete(key);
			if (
				!code ||
				code === ExitCode.SUCCESS ||
				code === ExitCode.BOOT_FAIL
			)
				return;

			const [type, id] = key.split(':');
			this.emitter.emit(`${type}.crashed`, {
				id: Number(id),
				type
			});
		});

		await proc.waitReady(opts.timeoutMs);
		return proc;
	}

	get(ref: PluginRef) {
		return this.procs.get(this.createKey(ref));
	}

	stop(ref: PluginRef) {
		const key = this.createKey(ref);
		const proc = this.procs.get(key);
		if (!proc) return;
		proc.child.kill('SIGTERM');
		this.procs.delete(key);
	}

	private createKey(ref: PluginRef): PluginKey {
		return `${ref.type}:${ref.id}`;
	}
}
