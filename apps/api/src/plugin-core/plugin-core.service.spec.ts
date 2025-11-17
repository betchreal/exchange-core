import { Test, TestingModule } from '@nestjs/testing';
import { PluginCoreService } from './plugin-core.service';

describe('PluginCoreService', () => {
	let service: PluginCoreService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PluginCoreService]
		}).compile();

		service = module.get<PluginCoreService>(PluginCoreService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
