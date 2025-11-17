import process from 'node:process';
import { ExitCode } from '@exchange-core/common';
import type { CallMsg, RespMsg } from '../ipc/messages';
import '../../proxy.bootstrap';

function parseArg(name: string) {
	const i = process.argv.indexOf(name);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

function isClass(fn: unknown) {
	return (
		typeof fn === 'function' &&
		/^class\s/.test(Function.prototype.toString.call(fn))
	);
}

function haveSameElements(required: string[], toCheck: string[]) {
	if (required.length !== toCheck.length) return false;
	const requiredSet = new Set<string>(required);
	const checkSet = new Set<string>(toCheck);
	if (requiredSet.size !== checkSet.size) return false;
	for (const item of requiredSet) {
		if (!checkSet.has(item)) return false;
	}
	return true;
}

const entry = parseArg('--entry');
if (!entry) {
	process.send?.({
		id: 'boot',
		success: false,
		error: 'No --entry provided'
	} as RespMsg);
	process.exit(ExitCode.BOOT_FAIL);
}

let config;
let required;
try {
	config = JSON.parse(process.env.PLUGIN_CONFIG_JSON!);
	required = JSON.parse(process.env.REQUIRED_METHODS!) as string[];
} catch {
	process.send?.({
		id: 'boot',
		success: false,
		error: 'Invalid env variables.'
	} as RespMsg);
	process.exit(ExitCode.BOOT_FAIL);
}

delete process.env.PLUGIN_CONFIG_JSON;
delete process.env.REQUIRED_METHODS;

(async () => {
	let Plugin;
	try {
		const mod = await import(entry);
		Plugin = mod.default ?? mod;
	} catch (err) {
		process.send?.({
			id: 'boot',
			success: false,
			error: 'Invalid entry.'
		} as RespMsg);
		process.exit(ExitCode.BOOT_FAIL);
	}

	if (!isClass(Plugin)) {
		process.send?.({
			id: 'boot',
			success: false,
			error: 'Exported value is not class.'
		});
		process.exit(ExitCode.BOOT_FAIL);
	}

	if (
		!haveSameElements(
			required,
			Object.getOwnPropertyNames(Plugin.prototype).filter(
				(m) => m !== 'constructor'
			)
		)
	) {
		process.send?.({
			id: 'boot',
			success: false,
			error: 'Invalid structure of plugin.'
		});
		process.exit(ExitCode.BOOT_FAIL);
	}

	if (Plugin.length !== 1) {
		process.send?.({
			id: 'boot',
			success: false,
			error: 'Invalid args of constructor.'
		});
		process.exit(ExitCode.BOOT_FAIL);
	}

	let plugin;

	try {
		plugin = new Plugin(config);
	} catch {
		process.send?.({
			id: 'boot',
			success: false,
			error: 'Exported value is not class.'
		});
		process.exit(ExitCode.BOOT_FAIL);
	}

	process.send?.({ id: 'boot', success: true });

	process.on('message', async (msg: CallMsg) => {
		if (!msg || msg.cmd !== 'call') return;
		const { id, method, args } = msg;
		try {
			if (typeof plugin[method] !== 'function')
				throw new Error(`No method ${method}`);
			console.log(`[HOST] CALLING ${plugin[method].name}`);
			const data = await plugin[method](args);
			process.send?.({ id, success: true, data });
		} catch (err: any) {
			process.send?.({
				id,
				success: false,
				error: err?.message || String(err)
			});
		}
	});

	process.on('uncaughtException', () => process.exit(ExitCode.CRASH));
	process.on('unhandledRejection', () => process.exit(ExitCode.CRASH));
	process.on('SIGTERM', () => process.exit(ExitCode.SUCCESS));
	process.on('disconnect', () => process.exit(ExitCode.SUCCESS));
})();
