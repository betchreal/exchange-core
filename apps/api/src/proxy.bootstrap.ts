import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { bootstrap } from 'global-agent';

setGlobalDispatcher(
	new ProxyAgent(process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY!)
);

process.env.GLOBAL_AGENT_HTTP_PROXY =
	process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
bootstrap();
