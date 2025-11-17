import { build } from 'esbuild';
import path from 'node:path';

build({
	entryPoints: [
		path.resolve('dist', 'src', 'plugin-core', 'host', 'plugin.host.js')
	],
	bundle: true,
	platform: 'node',
	target: 'node22',
	format: 'cjs',
	outfile: path.resolve(
		'dist',
		'src',
		'plugin-core',
		'host',
		'plugin.host.bundle.js'
	),
	sourcemap: false,
	minify: false,
	legalComments: 'none',
	external: []
}).catch((e) => {
	throw e;
});
