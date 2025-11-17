import { ChildProcess } from 'child_process';
import type { CallMsg, RespMsg } from '../ipc/messages';

export class PluginProcess {
	private pending = new Map<string, (r: RespMsg) => void>();

	private readyResolve!: () => void;
	private readyReject!: (e: Error) => void;
	private readonly readyPromise: Promise<void>;

	constructor(public child: ChildProcess) {
		this.readyPromise = new Promise<void>((resolve, reject) => {
			this.readyResolve = resolve;
			this.readyReject = reject;
		});

		child.on('message', (msg: RespMsg) => {
			if (msg.id === 'boot')
				return msg.success
					? this.readyResolve()
					: this.readyReject(new Error(msg.error));

			const cb = this.pending.get(msg.id);
			if (cb) {
				this.pending.delete(msg.id);
				cb(msg);
			}
		});

		child.on('exit', () => {
			this.readyReject(new Error('Plugin exited before boot ready.'));
			for (const [, cb] of this.pending)
				cb({ id: 'exit', success: false, error: 'Plugin exited.' });
			this.pending.clear();
		});
	}

	async waitReady(timeoutMs: number) {
		await Promise.race([
			this.readyPromise,
			new Promise((_, rej) =>
				setTimeout(() => rej(new Error('boot timeout.')), timeoutMs)
			)
		]);
	}

	call(method: string, args: any, timeoutMs: number) {
		const id = 'c-' + Math.random().toString(36).slice(2);
		return new Promise((resolve, reject) => {
			const t = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`Timeout ${method}`));
			}, timeoutMs);
			this.pending.set(id, (resp: RespMsg) => {
				clearTimeout(t);
				resp.success
					? resolve(resp.data)
					: reject(new Error(resp.error || 'Call failed'));
			});
			this.child.send({ id, cmd: 'call', method, args } as CallMsg);
		});
	}
}
